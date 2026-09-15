/** Host mocks check source structure and callbacks, NOT a native runtime. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader } = require('../load-ts.cjs');
const root = path.resolve(__dirname, '../..');
let count = 0;
const test = (name, fn) => { fn(); count++; console.log(`PASS ${name}`); };
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node)
  ? node.flatMap(walk) : [node, ...(node.props?.children || []).flatMap(walk)];
const loader = createLoader();
const load = file => loader.load(path.join(root, file));
const { getHomeLayout, sceneStyle } = load('src/home/layout.ts');
const { HOME_REFERENCE: R, BOX, COPY } = load('src/home/tokens.ts');
const insets = { top: 54, bottom: 17, left: 0, right: 0 };
const treeOf = (file, name, props = {}) => {
  const l = createLoader();
  return { l, fn: l.load(path.join(root, file))[name], props };
};
test('All seven original navigation files retain their SHA-256', () => {
  const hashes = JSON.parse(fs.readFileSync(path.join(root, 'qa/nav-sha256.json')));
  assert.equal(Object.keys(hashes).length, 7);
  for (const [file, expected] of Object.entries(hashes)) {
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), expected, file);
  }
});
test('SDK 57 and original native dependencies are retained', () => {
  const p = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  assert.equal(p.dependencies.expo, '~57.0.17');
  assert.equal(p.dependencies['react-native'], '0.86.3');
  assert.equal(p.dependencies['expo-blur'], '~57.0.3');
});
test('The previous nav-only demo is preserved and its imports resolve', () => {
  load('examples/NavOnlyDemo.tsx');
});
test('The logical viewport matches the measured 750 x 1538 crop', () => {
  assert.equal(R.logicalWidth * 2, 750); assert.equal(R.logicalHeight * 2, 1538);
});
test('Nav position at the reference safe areas matches the retained review', () => {
  const l = getHomeLayout(375, 769, insets);
  assert.ok(Math.abs((375 - l.navWidth) + R.viewportX - 115) < 0.5);
  assert.ok(Math.abs((769 - l.bottom - l.navHeight) * 2 + R.viewportY - 1374) < 1);
});
test('Widths scale uniformly and the canvas is centered on larger screens', () => {
  for (const width of [320, 375, 390, 430, 768, 1024]) {
    const l = getHomeLayout(width, 900, insets);
    assert.ok(l.canvasWidth <= width && l.canvasWidth <= 600);
    assert.equal(l.canvasLeft, (width - l.canvasWidth)/2);
    assert.ok(Math.abs(l.navWidth / l.navHeight - 1912/444) < 1e-10);
  }
});
test('Short screens scroll without shrinking navigation', () => {
  const a = getHomeLayout(375, 769, insets), b = getHomeLayout(375, 540, insets);
  assert.equal(b.needsScroll, true); assert.equal(a.navHeight, b.navHeight);
  assert.equal(a.navWidth, b.navWidth); assert.equal(a.bodyHeight, b.bodyHeight);
});
test('Invalid viewport dimensions are rejected', () => {
  for (const n of [0, -1, NaN, Infinity]) assert.throws(() => getHomeLayout(n, 769, insets), /viewport/);
});
test('Photo and button geometries retain their aspect ratio at every scale', () => {
  for (const scale of [0.8, 1, 1.2, 1.6]) for (const box of Object.values(BOX)) {
    const b = sceneStyle(box, scale); assert.ok(Math.abs(b.width/b.height - box.width/box.height) < 1e-10);
  }
});
test('Home starts on Hoy and imports the original nav component', () => {
  const { l, fn } = treeOf('src/home/HomeScreen.tsx', 'HomeScreen');
  const nav = walk(l.render(fn)).find(n => n.type?.name === 'BottomNavGlass');
  assert.equal(nav.props.activeTab, 'hoy');
});
test('Uncontrolled Home selection updates after an item press', () => {
  const { l, fn } = treeOf('src/home/HomeScreen.tsx', 'HomeScreen');
  walk(l.render(fn)).find(n => n.type?.name === 'BottomNavGlass').props.onChange('recetas');
  assert.equal(walk(l.render(fn)).find(n => n.type?.name === 'BottomNavGlass').props.activeTab, 'recetas');
});
test('Controlled Home selection emits without overriding its prop', () => {
  const { l, fn } = treeOf('src/home/HomeScreen.tsx', 'HomeScreen'); let requested;
  const props = { activeTab: 'hoy', onTabChange: tab => requested = tab };
  walk(l.render(fn, props)).find(n => n.type?.name === 'BottomNavGlass').props.onChange('entrenar');
  assert.equal(requested, 'entrenar');
  assert.equal(walk(l.render(fn, props)).find(n => n.type?.name === 'BottomNavGlass').props.activeTab, 'hoy');
});
test('Both Registrar buttons receive the same action', () => {
  const { l, fn } = treeOf('src/home/HomeScreen.tsx', 'HomeScreen'); const action = () => {};
  const nodes = walk(l.render(fn, { onRegister: action }));
  assert.equal(nodes.find(n => n.type?.name === 'BottomNavGlass').props.onRegisterPress, action);
  assert.equal(nodes.find(n => n.type?.name === 'HomeContent').props.onRegister, action);
});
test('Glass buttons are native Pressables with accessible labels', () => {
  const { l, fn } = treeOf('src/home/GlassButton.tsx', 'GlassButton'); let calls = 0;
  const tree = l.render(fn, { scale: 1, variant: 'primary', label: 'Registrar +', onPress: () => calls++ });
  assert.equal(tree.type, 'Pressable'); assert.equal(tree.props.accessibilityLabel, 'Registrar +');
  tree.props.onPress(); tree.props.onPress(); assert.equal(calls, 2);
});
test('Routine, nutrition and profile actions reach their controls', () => {
  const action = () => {};
  const header = load('src/home/HomeHeader.tsx').HomeHeader({ scale: 1, onAvatarPress: action });
  assert.equal(walk(header).find(n => n.type === 'Pressable').props.onPress, action);
  const nutrition = load('src/home/NutritionSection.tsx').NutritionSection({ scale: 1, onOpenNutrition: action });
  assert.equal(walk(nutrition).find(n => n.type === 'Pressable').props.onPress, action);
  const workout = load('src/home/NextWorkoutCard.tsx').NextWorkoutCard({ scale: 1, onOpenRoutine: action });
  assert.equal(walk(workout).find(n => n.type?.name === 'GlassButton').props.onPress, action);
});
test('All four slots are neutral until a real source is supplied', () => {
  const Slot = load('src/home/PhotoSlot.tsx').PhotoSlot;
  for (const name of ['backgroundImage','heroPlantImage','workoutImage','avatarImage']) {
    assert.equal(walk(Slot({ name, width: 40, height: 50 })).filter(n => n.type === 'Image').length, 0);
    assert.equal(walk(Slot({ name, width: 40, height: 50, source: 123 })).filter(n => n.type === 'Image').length, 1);
  }
});
test('Runtime source embeds no reference images, base64, HTML or WebView', () => {
  const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]);
  const source = files(path.join(root, 'src')).filter(f => /\.tsx?$/.test(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  assert.ok(!/data:image|<WebView\b|<canvas\b|<div\b|require\([^)]*\.(?:png|jpg)/.test(source));
});
test('Home labels align their baseline using measured native ascent', () => {
  const { l, fn } = treeOf('src/home/HomeText.tsx', 'HomeText');
  const props = { children: 'Franco', x: 40, baseline: 222, width: 500, size: 60, scale: 1 };
  let text = l.render(fn, props);
  text.props.onTextLayout({ nativeEvent: { lines: [{ y: 2, ascender: 24 }] } });
  text = l.render(fn, props); assert.equal(text.props.style.top + 26, (222-108)/2);
});
test('Visual progress is clamped independently of the displayed values', () => {
  const { clampFraction } = load('src/home/CaloriesRing.tsx');
  for (const [n, expected] of [[-2,0],[0,0],[0.42,0.42],[2,1],[NaN,0]]) assert.equal(clampFraction(n), expected);
});
test('Zero/full ring arcs contain no invalid coordinates', () => {
  const { calorieArc } = load('src/home/CaloriesRing.tsx');
  assert.equal(calorieArc(0), ''); assert.equal((calorieArc(1).match(/ A /g)||[]).length, 2);
  assert.ok(!/NaN|Infinity/.test(calorieArc(0.72)));
});
test('Home copy and five navigation labels remain exact', () => {
  assert.equal(COPY.greeting, 'Buenos días,'); assert.equal(COPY.workout, 'Hoy · Upper A');
  assert.equal(COPY.calories, '1.620'); assert.equal(COPY.week, 'Semana 18 de 52');
  assert.equal(load('src/bottom-nav/tokens.ts').TABS.map(t => t.label).join('|'), 'Hoy|Recetas|Registrar|Entrenar|Progreso');
});
test('Blur target is rendered before the foreground and navigation', () => {
  const { l, fn } = treeOf('src/home/HomeScreen.tsx', 'HomeScreen');
  const nodes = walk(l.render(fn));
  assert.ok(nodes.findIndex(n => n.type === 'BlurTargetView') < nodes.findIndex(n => n.type?.name === 'HomeContent'));
  assert.ok(nodes.findIndex(n => n.type === 'BlurTargetView') < nodes.findIndex(n => n.type?.name === 'BottomNavGlass'));
});
test('Demo feedback opens and closes; it is not visible by default', () => {
  const { l, fn } = treeOf('src/demo/CukiHomeDemo.tsx', 'CukiHomeDemo');
  assert.equal(walk(l.render(fn)).find(n => n.type === 'Modal').props.visible, false);
  walk(l.render(fn)).find(n => n.type?.name === 'HomeScreen').props.onRegister();
  assert.equal(walk(l.render(fn)).find(n => n.type === 'Modal').props.visible, true);
  walk(l.render(fn)).find(n => n.props.testID === 'demo-close').props.onPress();
  assert.equal(walk(l.render(fn)).find(n => n.type === 'Modal').props.visible, false);
});
console.log(`\n${count} Home structural checks passed. Native compilation, typography, blur and device input are not validated by these mocks.`);
