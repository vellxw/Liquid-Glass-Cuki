/** Source/host-mock regression checks. These are NOT native visual tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader } = require('../load-ts.cjs');
const { render, walk } = require('./render.cjs');
const root = path.resolve(__dirname, '../..');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
let count = 0;
const test = (name, fn) => { fn(); count++; console.log(`PASS register: ${name}`); };
function normalizeSecondary(doc) {
  // Remove ONLY unused definitions, then normalize instance IDs. Drawing is unchanged.
  doc = doc.replace(/<(linearGradient|radialGradient)\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/g,
    (whole, type, id) => doc.includes(`url(#${id})`) ? whole : '');
  return doc.replace(/buttonoffline\d+/g, 'button');
}
function contract(tree) {
  const text = walk(tree).find(n => n.type?.name === 'HomeText');
  const svg = walk(tree).find(n => n.type === 'svg');
  const blur = walk(tree).find(n => n.type === 'BlurView');
  return { role: tree.props.accessibilityRole, label: tree.props.accessibilityLabel,
    normal: tree.props.style({ pressed: false }), pressed: tree.props.style({ pressed: true }),
    text: text.props, svg: { width: svg.props.width, height: svg.props.height, viewBox: svg.props.viewBox },
    blur: blur.props };
}
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline-contract.json')));
const loader = createLoader();
const { GlassButton } = loader.load(path.join(root, 'src/home/GlassButton.tsx'));
const { REGISTER_MATERIAL: m } = loader.load(path.join(root, 'src/home/RegisterButtonMaterial.tsx'));
test('secondary drawing is identical to the baseline', () => {
  assert.equal(sha(normalizeSecondary(render(root, 'secondary').doc)), fixture.secondarySHA256);
});
test('primary layout, baseline, blur and pressed styles are unchanged', () => {
  assert.equal(JSON.stringify(contract(render(root).tree)), JSON.stringify(fixture.primaryContract));
});
test('circle, plus icon and circle gradient retain their exact drawing', () => {
  const { serialize } = require('./render.cjs');
  const foreground = walk(render(root).expanded).filter(n => n.type === 'circle' ||
    (n.type === 'g' && n.props.transform === 'translate(101 44)') ||
    (n.type === 'linearGradient' && n.props.id?.endsWith('-circle')));
  assert.equal(foreground.map(serialize).join('').replace(/buttonoffline\d+/g, 'button'), fixture.primaryForeground);
});
test('protected static files remain identical; Phase A entry/dependencies are checked separately', () => {
  // HomeScreen now adds native-scroll arbitration without changing layout; covered by Home/QA checks.
  // Explicitly authorized Phase A changes. Never replace the static baseline hashes.
  const phaseA = new Set(['App.tsx', 'package.json', 'src/home/PrimaryRegisterButton.tsx', 'src/home/HomeScreen.tsx']);
  for (const [file, hash] of Object.entries(fixture.protectedFiles)) {
    if (phaseA.has(file)) continue;
    assert.equal(sha(fs.readFileSync(path.join(root, file))), hash, file);
  }
});
test('callbacks and testID reach the same accessible Pressable', () => {
  let calls = 0; const action = () => calls++;
  const tree = loader.render(GlassButton, { variant: 'primary', label: 'Registrar +', scale: 1,
    testID: 'home-register', onPress: action });
  assert.equal(tree.type, 'Pressable'); assert.equal(tree.props.onPress, action);
  assert.equal(tree.props.testID, 'home-register');
  tree.props.onPress(); tree.props.onPress(); assert.equal(calls, 2);
});
test('disabled state remains owned by the native control', () => {
  const tree = loader.render(GlassButton, { variant: 'primary', label: 'Registrar +', scale: 1, disabled: true });
  assert.equal(tree.props.disabled, true); assert.equal(tree.props.accessibilityState.disabled, true);
  assert.equal(tree.props.style({ pressed: false }).at(-1).opacity, 0.45);
});
test('new material is reachable only in primary', () => {
  const secondary = walk(render(root, 'secondary').tree);
  assert.equal(secondary.filter(n => n.type?.name === 'RegisterButtonMaterial').length, 0);
  assert.equal(walk(render(root).tree).filter(n => n.type?.name === 'RegisterButtonMaterial').length, 1);
});
test('closed rim strokes and soft bands fit entirely inside the viewport', () => {
  assert.equal(m.width, 460); assert.equal(m.height, 122);
  assert.ok(m.outerInset >= m.outerStroke/2);
  for (const b of m.glowBands) {
    assert.ok(b.inset >= b.width/2); assert.ok(b.width > 0);
    assert.ok(b.opacity >= 0 && b.opacity <= 1);
  }
});
test('all localized gradients fade to zero and have their focus at center', () => {
  const gradients = walk(render(root).expanded).filter(n => n.type === 'radialGradient');
  assert.ok(gradients.length > 4);
  for (const g of gradients) {
    const stops = walk(g).filter(n => n.type === 'stop');
    assert.equal(stops.at(-1).props.stopOpacity, 0);
    assert.equal(g.props.fx, g.props.cx); assert.equal(g.props.fy, g.props.cy);
  }
});
test('simultaneous instances have disjoint, internally resolvable SVG IDs', () => {
  const { expand } = require('./render.cjs');
  const ids = new Set();
  for (let i=0;i<2;i++) {
    const nodes = walk(expand(loader.render(GlassButton, { variant: 'primary', label: 'Registrar +', scale: 1 })));
    const local = new Set(nodes.map(n => n.props?.id).filter(Boolean));
    for (const id of local) { assert.ok(!ids.has(id)); ids.add(id); }
    for (const node of nodes) for (const value of Object.values(node.props || {})) {
      if (typeof value === 'string' && value.startsWith('url(#')) assert.ok(local.has(value.slice(5,-1)));
    }
  }
});
test('material has no open paths, images, filters or layout ownership', () => {
  const source = fs.readFileSync(path.join(root,'src/home/RegisterButtonMaterial.tsx'),'utf8');
  assert.ok(!/<Path\b|<Image\b|<Filter\b|<BlurView\b|<Text\b|<Pressable\b|data:image|require\(/.test(source));
  const drawables = walk(render(root).expanded).filter(n => n.type === 'rect');
  assert.ok(drawables.length > 4);
});
console.log(`\n${count} Registrar structural checks passed; native material rendering remains unverified.`);
module.exports = { normalizeSecondary, contract };
