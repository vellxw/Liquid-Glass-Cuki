/** Structural checks with mocked host components; NOT a native simulator test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createLoader } = require('./load-ts.cjs');
const root = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(dir, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}
function walk(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  return [node, ...(node.props?.children || []).flatMap(walk)];
}
function component() {
  const loader = createLoader();
  return { loader, Nav: loader.load(path.join(root, 'src/bottom-nav/BottomNavGlass.tsx')).BottomNavGlass };
}
function buttons(tree) { return walk(tree).filter(node => node.type === 'Pressable'); }
function selected(tree) { return buttons(tree).find(node => node.props.accessibilityState.selected)?.props.accessibilityLabel; }
const base = createLoader();
const { DESIGN, TABS, ICON_BOXES, getBarHeight, getTabBounds } = base.load(path.join(root, 'src/bottom-nav/tokens.ts'));

test('All TS/TSX files parse and transpile without syntax diagnostics', () => {
  const source = [...files(path.join(root, 'src')), path.join(root, 'App.tsx'), path.join(root, 'index.ts')];
  for (const file of source.filter(file => /\.tsx?$/.test(file))) {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    assert.equal(result.diagnostics?.length || 0, 0, file);
    base.load(file);
  }
});
test('Reference dimensions and five exact labels', () => {
  assert.equal(DESIGN.width, 1912);
  assert.equal(DESIGN.height, 444);
  assert.equal(TABS.map(tab => tab.label).join('|'), 'Hoy|Recetas|Registrar|Entrenar|Progreso');
});
test('Aspect ratio stays uniform at 280, 320, 358, 382.4, 600 and 1912 points', () => {
  for (const width of [280, 320, 358, 382.4, 600, 1912]) {
    assert.ok(Math.abs(getBarHeight(width) / width - 444 / 1912) < 1e-12);
  }
});
test('Invalid explicit widths are rejected', () => {
  for (const width of [0, -5, NaN, Infinity]) assert.throws(() => getBarHeight(width), /width/);
});
test('Hit regions share boundaries; no overlap or dead horizontal gaps', () => {
  let right = 0;
  TABS.forEach((tab, index) => {
    const box = getTabBounds(index);
    assert.equal(box.left, right);
    assert.ok(tab.center > box.left && tab.center < box.left + box.width);
    right = box.left + box.width;
  });
  assert.equal(right, DESIGN.width);
});
test('All five hit targets exceed 44 x 44 points at a 280-point bar width', () => {
  const scale = 280 / DESIGN.width;
  TABS.forEach((_, index) => assert.ok(getTabBounds(index).width * scale >= 44));
  assert.ok(DESIGN.hitHeight * scale >= 44);
});
test('Icons and the label baseline fit their native press targets', () => {
  TABS.forEach((tab, index) => {
    const bounds = getTabBounds(index), icon = ICON_BOXES[tab.id];
    assert.ok(icon.x >= bounds.left && icon.x + icon.width <= bounds.left + bounds.width);
    assert.ok(icon.y >= DESIGN.hitTop && icon.y + icon.height < DESIGN.label.baseline);
  });
});
test('Hoy is active by default; five separate native Pressables', () => {
  const { loader, Nav } = component();
  const tree = loader.render(Nav, { width: 382.4 });
  assert.equal(buttons(tree).length, 5);
  assert.equal(selected(tree), 'Hoy');
});
test('Internal selection follows every destination press', () => {
  const { loader, Nav } = component();
  const props = { width: 382.4 };
  TABS.forEach((tab, index) => {
    buttons(loader.render(Nav, props))[index].props.onPress();
    assert.equal(selected(loader.render(Nav, props)), tab.label);
  });
});
test('Controlled selection emits changes without overwriting its prop', () => {
  const { loader, Nav } = component();
  const requests = [];
  const props = { width: 382.4, activeTab: 'entrenar', onChange: id => requests.push(id) };
  buttons(loader.render(Nav, props))[1].props.onPress();
  assert.equal(requests[0], 'recetas');
  assert.equal(selected(loader.render(Nav, props)), 'Entrenar');
});
test('Registrar fires its callback on repeated presses', () => {
  const { loader, Nav } = component();
  let count = 0;
  const props = { width: 382.4, onRegisterPress: () => count++ };
  for (let i = 0; i < 3; i++) buttons(loader.render(Nav, props))[2].props.onPress();
  assert.equal(count, 3);
  assert.equal(selected(loader.render(Nav, props)), 'Registrar');
});
test('Disabled navigation does not dispatch events', () => {
  const { loader, Nav } = component();
  let count = 0;
  const props = { width: 382.4, disabled: true, onChange: () => count++ };
  buttons(loader.render(Nav, props)).forEach(button => button.props.onPress());
  assert.equal(count, 0);
});
test('Full-width layout waits for measurement then draws', () => {
  const { loader, Nav } = component();
  let tree = loader.render(Nav, {});
  assert.equal(buttons(tree).length, 0);
  tree.props.onLayout({ nativeEvent: { layout: { width: 358 } } });
  tree = loader.render(Nav, {});
  assert.equal(buttons(tree).length, 5);
});
test('Android blur requires a target and gets the SDK 31+ method', () => {
  const { loader, Nav } = component();
  loader.native.Platform.OS = 'android';
  assert.equal(walk(loader.render(Nav, { width: 358 })).filter(node => node.type === 'BlurView').length, 0);
  const tree = loader.render(Nav, { width: 358, blurTarget: { current: null } });
  assert.equal(walk(tree).find(node => node.type === 'BlurView').props.blurMethod, 'dimezisBlurViewSdk31Plus');
});
test('Native label baseline calculation uses measured ascent', () => {
  const loader = createLoader();
  const { NativeLabel } = loader.load(path.join(root, 'src/bottom-nav/NativeLabel.tsx'));
  const props = { text: 'Recetas', center: 180, scale: 1, selected: false };
  let text = loader.render(NativeLabel, props);
  text.props.onTextLayout({ nativeEvent: { lines: [{ y: 2, ascender: 42 }] } });
  text = loader.render(NativeLabel, props);
  const positioned = text.props.style[1];
  assert.equal(positioned.top + 2 + 42, DESIGN.label.baseline - DESIGN.hitTop);
});
test('Material instance IDs do not collide', () => {
  const loader = createLoader();
  const { GlassMaterial } = loader.load(path.join(root, 'src/bottom-nav/GlassMaterial.tsx'));
  const ids = [];
  for (let i = 0; i < 2; i++) {
    ids.push(walk(loader.render(GlassMaterial, { width: 1912, height: 444, activeTab: 'hoy' }))
      .filter(node => node.props.id).map(node => node.props.id));
  }
  assert.ok(ids[0].length >= 25);
  assert.equal(ids[0].filter(id => ids[1].includes(id)).length, 0);
});
test('Nav runtime source contains no bitmap, WebView, HTML or web-canvas imports', () => {
  const source = files(path.join(root, 'src/bottom-nav'))
    .filter(file => /\.tsx?$/.test(file)).map(file => fs.readFileSync(file, 'utf8')).join('\n');
  assert.ok(!/\.(png|jpe?g|webp)['"]|data:image|<Image\b|<ImageBackground\b|<WebView\b|<canvas\b|<div\b/.test(source));
});
console.log(`\n${passed} structural checks passed. Native build, native visual QA and full dependency type-check are NOT performed by this script.`);
