/** Host contracts. Actual native Button behavior is checked in the platform workflows. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader } = require('../load-ts.cjs');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS button:', name); }
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const walk = n => !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(walk) : [n, ...walk(n.props?.children)];
function button(file, props = {}, iosVersion = '26.0') {
  const l = createLoader(); l.native.Platform.Version = iosVersion;
  const component = l.load(path.join(root, file)).RegisterActionButton;
  return { l, tree: l.render(component, { scale: 1, ...props }) };
}
test('the rejected runtime and labs are removed, not disabled by a flag', () => {
  for (const file of ['src/liquid', 'src/home/LocalRegisterArtwork.tsx', 'examples/RegisterPhysicsLab.tsx', 'examples/GlassPerformanceBench.tsx'])
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
});
test('no simulation, custom gesture, GPU or frame-loop dependencies remain', () => {
  const p = JSON.parse(read('package.json'));
  for (const name of ['@shopify/react-native-skia', 'react-native-reanimated', 'react-native-worklets', 'react-native-gesture-handler', 'expo-haptics'])
    assert.equal(p.dependencies[name], undefined, name);
  function files(d) { return fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? files(path.join(d,e.name)) : [path.join(d,e.name)]); }
  const src = [...files(path.join(root,'src')),path.join(root,'App.tsx')].filter(f=>/\.tsx?$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
  assert.doesNotMatch(src, /LiquidPressable|RuntimeEffect|makeImageFromView|pressedProgress|withSpring|useSharedValue|GestureDetector|useFrameCallback/);
});
test('navigation, static material, icons and layout tokens are unchanged', () => {
  for (const [file, hash] of Object.entries(JSON.parse(read('qa/button/protected.json'))))
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'), hash, file);
});
test('fallback is the original static glass with normal button semantics', () => {
  let count=0; const { tree }=button('src/buttons/RegisterActionButton.tsx',{onPress:()=>count++});
  assert.equal(tree.type.name,'GlassButton'); assert.equal(tree.props.label,'Registrar +');
  tree.props.onPress(); tree.props.onPress(); assert.equal(count,2);
});
test('fallback suppresses disabled, busy and missing-action buttons', () => {
  for (const props of [{disabled:true},{busy:true},{onPress:undefined}]) {
    let count=0; const {tree}=button('src/buttons/RegisterActionButton.tsx',{onPress:()=>count++,...props});
    assert.equal(tree.props.disabled,true); tree.props.onPress(); assert.equal(count,0);
  }
});
test('iOS is a real SwiftUI Button with the approved artwork, not an outer Pressable', () => {
  let count=0;const {tree}=button('src/buttons/RegisterActionButton.ios.tsx',{onPress:()=>count++,testID:'home-register'});
  assert.equal(tree.type,'SwiftUIHost');const b=walk(tree).find(n=>n.type==='SwiftUIButton');assert.ok(b);
  assert.equal(b.props.modifiers.find(m=>m.name==='buttonStyle').args[0],'plain');
  assert.equal(b.props.modifiers.find(m=>m.name==='accessibilityIdentifier').args[0],'home-register');
  b.props.onPress();assert.equal(count,1);assert.equal(walk(tree).some(n=>n.type==='Pressable'),false);
});
test('earlier iOS keeps the SAME original skin and a native plain button', () => {
  const {tree}=button('src/buttons/RegisterActionButton.ios.tsx',{onPress:()=>{}},'18.7');
  const b=walk(tree).find(n=>n.type==='SwiftUIButton');
  assert.equal(b.props.modifiers.find(m=>m.name==='buttonStyle').args[0],'plain');
});
test('native disabled/busy guards and label are preserved', () => {
  for (const props of [{disabled:true},{busy:true}]) {
    let count=0; const {tree}=button('src/buttons/RegisterActionButton.ios.tsx',{onPress:()=>count++,...props});
    const b=walk(tree).find(n=>n.type==='SwiftUIButton');
    assert.equal(b.props.modifiers.find(m=>m.name==='disabled').args[0],true);
    assert.equal(b.props.modifiers.find(m=>m.name==='accessibilityLabel').args[0],'Registrar +');
    b.props.onPress();assert.equal(count,0);
  }
});
test('both implementations validate the same geometry', () => {
  for(const file of ['src/buttons/RegisterActionButton.tsx','src/buttons/RegisterActionButton.ios.tsx'])
    for(const scale of [0,-1,NaN,Infinity])assert.throws(()=>button(file,{scale}),/scale/);
});
test('Home has normal scroll and no artificial pressure arbitration', () => {
  const s=read('src/home/HomeScreen.tsx');assert.match(s,/<Animated.ScrollView/);
  assert.doesNotMatch(s,/PremiumScroll|Gesture|resourceEpoch|refreshBackdrop/);
});
test('primary action is a single button; no nested interactive layer', () => {
  const l=createLoader();const C=l.load(path.join(root,'src/home/PrimaryRegisterButton.tsx')).PrimaryRegisterButton;
  const action=()=>{};const tree=C({scale:1,onRegister:action});assert.equal(tree.type.name,'RegisterActionButton');
  assert.equal(tree.props.onPress,action);assert.equal(tree.props.testID,'home-register');
});
test('iOS reuses the full approved passive tree rather than a system replacement', () => {
  const {tree}=button('src/buttons/RegisterActionButton.ios.tsx',{onPress:()=>{}});
  const nodes=walk(tree);assert.equal(nodes.filter(n=>n.type==='SwiftUIButton').length,1);
  assert.equal(nodes.filter(n=>n.type==='SwiftUIRNHostView').length,1);
  assert.equal(nodes.filter(n=>n.type==='BlurView').length,1);
  assert.equal(nodes.filter(n=>n.type==='circle').length,2);
  assert.ok(nodes.find(n=>n.type?.name==='HomeText'));
  assert.equal(nodes.filter(n=>n.type==='SwiftUIImage'||n.type==='SwiftUIText').length,0);
});
test('full original artwork is identical for both variants and every tested scale', () => {
  const {expand,serialize}=require('../register/render.cjs');
  function visual(node){return serialize(expand(node)).replace(/buttonoffline\d+/g,'button');}
  for(const variant of ['primary','secondary'])for(const scale of [.8,1,1.12,1.6]){
    const l=createLoader();
    const Current=l.load(path.join(root,'src/home/GlassButton.tsx')).GlassButton;
    const source=read('qa/button/approved-GlassButton.tsx.fixture');
    const tmp=path.join(root,'src/home/.qa-original-button.tsx');
    try {
      fs.writeFileSync(tmp,source);
      const Original=l.load(tmp).GlassButton;
      const p={variant,label:variant==='primary'?'Registrar +':'Ver rutina',scale};
      const a=Current(p),b=Original(p);
      assert.equal(visual(a.props.children),visual(b.props.children));
      assert.equal(JSON.stringify(a.props.style({pressed:false})),JSON.stringify(b.props.style({pressed:false})));
    }finally{fs.rmSync(tmp,{force:true});}
  }
});
console.log(`${passed} normal-button host checks passed. Native tests and screenshots are separate.`);
