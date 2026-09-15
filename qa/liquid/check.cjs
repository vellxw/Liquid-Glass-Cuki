/** HOST/NUMERICAL tests only. A native device, real gesture arbitration and FPS are
 * intentionally NOT represented by this runner. See docs/LIQUID-PHASE-A.md.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLoader } = require('../load-ts.cjs');
const { walk, expand, serialize } = require('../register/render.cjs');
const root = path.resolve(__dirname,'../..');
const baseline = require('./baseline.json');
let count=0;
function test(name,fn) { fn(); count++; console.log(`PASS liquid: ${name}`); }
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const loader = createLoader();
const math = loader.load(path.join(root,'src/liquid/physics.ts'));
function harness(options={}) {
  const l = createLoader(options);
  if(options.android) l.native.Platform.OS='android';
  const Component = l.load(path.join(root,'src/liquid/LiquidPressable.tsx')).LiquidPressable;
  let commits=0, physics;
  const events=[];
  const tree=l.render(Component,{width:230,height:61,label:'Registrar +',testID:'home-register',
    onPress:()=>commits++,onPhase:e=>events.push(e),...options.props,
    children:p=>{physics=p;return null;}});
  l.flushEffects();
  const g=l.gestures.at(-1);
  let failed=false;
  const evt=(x=115,y=30.5)=>({x,y,numberOfPointers:1});
  const manager={fail:()=>{failed=true;g.handlers.onFinalize({},false);}};
  return {l,tree,g,events,physics,commits:()=>commits,
    down(x=115,y=30.5){failed=false;g.handlers.onBegin(evt(x,y));g.handlers.onTouchesDown({numberOfTouches:1,allTouches:[{id:0,x,y}]},manager);},
    move(x,y){g.handlers.onTouchesMove({numberOfTouches:1,allTouches:[{id:0,x,y}]},manager);},
    secondFinger(){g.handlers.onTouchesDown({numberOfTouches:2,allTouches:[{id:0,x:115,y:30},{id:1,x:120,y:33}]},manager);},
    up(x=115,y=30.5,success=true){g.handlers.onEnd(evt(x,y),success&&!failed);g.handlers.onFinalize(evt(x,y),success&&!failed);},
    finish(){l.animations.at(-1)?.complete?.(true);},
  };
}
function propsOf(tree,type){return walk(tree).find(n=>n.type===type)?.props;}
test('the polished static material and every non-target runtime file are byte-identical',()=>{
  for(const [file,hash] of Object.entries(baseline.protectedFiles)) if(!baseline.intentionalChanges.includes(file)) assert.equal(sha(file),hash,file);
});
test('all original dependencies remain pinned; only four interaction dependencies are added',()=>{
  const p=require(path.join(root,'package.json'));
  for(const [name,value] of Object.entries(baseline.originalDependencies)) assert.equal(p.dependencies[name],value,name);
  assert.deepEqual(Object.keys(p.dependencies).filter(k=>!baseline.originalDependencies[k]).sort(),['expo-haptics','react-native-gesture-handler','react-native-reanimated','react-native-worklets']);
});
test('only PrimaryRegisterButton adopts the new engine',()=>{
  const p=fs.readFileSync(path.join(root,'src/home/PrimaryRegisterButton.tsx'),'utf8');
  assert.match(p,/<LiquidPressable/);assert.match(p,/interaction=\{physics\}/);
  for(const name of ['src/home/NextWorkoutCard.tsx','src/bottom-nav/BottomNavGlass.tsx']) assert.doesNotMatch(fs.readFileSync(path.join(root,name),'utf8'),/LiquidPressable|reanimated/);
});
test('App preserves the normal Home and installs the native gesture root',()=>{
  const s=fs.readFileSync(path.join(root,'App.tsx'),'utf8');assert.match(s,/<GestureHandlerRootView/);assert.match(s,/<CukiHomeDemo\s*\/>/);assert.match(s,/EXPO_PUBLIC_LIQUID_LAB === '1'/);
});
test('press and settle are critically damped and do not overshoot',()=>{
  for(const s of Object.values(math.SPRINGS)){assert.ok(Math.abs(s.damping/(2*Math.sqrt(s.mass*s.stiffness))-1)<1e-12);assert.equal(s.overshootClamping,true);}
});
test('analytical press reaches perceptible displacement within the requested window (not measured latency)',()=>{
  const s=math.SPRINGS.press,w=Math.sqrt(s.stiffness/s.mass),response=t=>1-(1+w*t)*Math.exp(-w*t);
  assert.ok(response(.04)>.55);assert.ok(response(.07)>.85);assert.ok(response(.14)>.99);
});
test('normal press is 2dp / 0.98, with identity at rest',()=>{
  assert.equal(JSON.stringify(math.rigidPose(0,false)),JSON.stringify({y:0,scale:1}));
  assert.equal(JSON.stringify(math.rigidPose(1,false)),JSON.stringify({y:2,scale:.98}));
  assert.equal(math.rigidPose(-1,false).y,0);assert.equal(math.rigidPose(2,false).scale,.98);
});
test('reduced motion limits geometry but retains a response',()=>{
  assert.equal(math.rigidPose(1,true).y,.3);assert.equal(math.rigidPose(1,true).scale,.998);
});
test('optical point is the inverse of physical descent and uniform scale',()=>{
  const q=math.localContact(65,25,230,61,1,false),pose=math.rigidPose(1,false);
  assert.ok(Math.abs((q.u*230-115)*pose.scale+115-65)<1e-9);
  assert.ok(Math.abs((q.v*61-30.5)*pose.scale+30.5+pose.y-25)<1e-9);
});
test('capsule hit testing rejects empty bounding-box corners and invalid coordinates',()=>{
  assert.equal(math.insideCapsule(1,1,230,61),false);assert.equal(math.insideCapsule(115,30,230,61),true);
  assert.equal(math.insideCapsule(NaN,0,230,61),false);assert.equal(math.insideCapsule(231,30,230,61),false);
});
test('optical profile is closed, finite, deterministic and contact-dependent',()=>{
  const p=math.capsuleSamples(460,122,math.OPTICS.inset);
  const a=math.dentedRim(p,80,30,1),b=math.dentedRim(p,380,30,1);
  assert.ok(a.endsWith('Z'));assert.doesNotMatch(a,/NaN|Infinity/);assert.notEqual(a,b);assert.equal(a,math.dentedRim(p,80,30,1));
});
test('native target remains fixed while content transforms uniformly',()=>{
  const h=harness();const v=propsOf(h.tree,'View'),a=propsOf(h.tree,'AnimatedView');
  assert.equal(v.style[0].width,230);assert.equal(v.style[0].height,61);assert.equal(v.style.at(-1).opacity,1);
  h.down();const s=a.style[1].__updater();assert.equal(s.transform[0].translateY,2);assert.equal(s.transform[1].scale,.98);
  assert.equal(s.opacity,undefined);assert.equal(a.pointerEvents,'none');
});
test('hold uses one physical spring and has no autonomous repeat',()=>{
  const h=harness();h.down();assert.equal(h.l.animations.length,1);assert.equal(h.physics.pressure.value,1);
  assert.equal(h.l.animations[0].kind,'spring');assert.ok(h.g.config.maxDuration>60_000);assert.equal(h.g.config.maxDistance,12);
});
test('action is committed only on successful release, once',()=>{
  const h=harness();h.down();assert.equal(h.commits(),0);h.up();assert.equal(h.commits(),1);
  h.g.handlers.onEnd({x:115,y:30.5},true);assert.equal(h.commits(),1);h.finish();assert.equal(h.physics.pressure.value,0);
});
test('a fast tap is not deferred by a minimum-press timer',()=>{
  const h=harness();h.down();h.up();assert.equal(h.commits(),1);assert.equal(h.l.animations.length,2);
});
test('touch coordinates follow small finger movements without React state',()=>{
  const h=harness();h.down(85,28);h.move(90,30);assert.equal(h.physics.contactX.value,90);assert.equal(h.physics.contactY.value,30);
  const p=fs.readFileSync(path.join(root,'src/liquid/LiquidPressable.tsx'),'utf8');assert.doesNotMatch(p,/useState|setTimeout|setInterval|withRepeat/);
});
test('moving outside cancels and never activates the action',()=>{
  const h=harness();h.down();h.move(400,30);h.up(400,30);assert.equal(h.commits(),0);assert.ok(h.events.some(e=>e.phase==='cancel'));assert.equal(h.physics.pressure.value,0);
});
test('native gesture failure such as scrolling settles without commit',()=>{
  const h=harness();h.down();h.up(115,30.5,false);assert.equal(h.commits(),0);h.finish();assert.equal(h.events.at(-1).phase,'settled');
});
test('multi-touch cancels instead of activating twice',()=>{
  const h=harness();h.down();h.secondFinger();h.up();assert.equal(h.commits(),0);assert.equal(h.physics.pressure.value,0);
});
test('empty capsule corners never trigger feedback or commit',()=>{
  const h=harness();h.down(1,1);h.up(1,1);assert.equal(h.commits(),0);assert.equal(h.events.length,0);assert.equal(h.l.haptics.length,0);
});
test('new contact interrupts old settle without a stale reset',()=>{
  const h=harness();h.down();h.up();const old=h.l.animations.at(-1).complete;h.down();old(true);
  assert.equal(h.physics.pressure.value,1);h.up();h.finish();assert.equal(h.commits(),2);assert.equal(h.physics.pressure.value,0);
});
test('disabled control exposes native state and ignores touch',()=>{
  const h=harness({props:{disabled:true}});h.down();h.up();assert.equal(h.commits(),0);assert.equal(h.g.config.enabled,false);
  const p=propsOf(h.tree,'View');assert.equal(p.accessibilityState.disabled,true);assert.equal(p.style.at(-1).opacity,.45);
});
test('no action callback means no commit haptic',()=>{
  const h=harness({props:{onPress:undefined}});h.down();h.up();assert.equal(h.l.haptics.length,0);
});
test('haptics off does not disable the action',()=>{
  const h=harness({props:{haptics:'off'}});h.down();h.up();assert.equal(h.commits(),1);assert.equal(h.l.haptics.length,0);
});
test('haptic grammar drops stale events and coalesces short contacts',()=>{
  const l=createLoader();const f=l.load(path.join(root,'src/liquid/haptics.ts')).createHapticGate();
  f('contact',Date.now()-500,'contact-and-commit');assert.equal(l.haptics.length,0);
  f('contact',Date.now(),'contact-and-commit');f('commit',Date.now(),'contact-and-commit');assert.equal(l.haptics.length,1);
});
test('reduced motion takes a direct timing path, never the large spring',()=>{
  const h=harness({reduced:true});h.down();assert.equal(h.l.animations[0].kind,'timing');h.up();assert.equal(h.l.animations[1].kind,'timing');
});
test('iOS screen reader activation is independent of touch and commits once',()=>{
  const h=harness();const p=propsOf(h.tree,'View');p.onAccessibilityTap();assert.equal(h.commits(),1);assert.equal(p.onAccessibilityAction,undefined);assert.equal(h.l.animations.length,0);
});
test('Android screen reader uses only the activate accessibility action',()=>{
  const h=harness({android:true});const p=propsOf(h.tree,'View');assert.equal(p.onAccessibilityTap,undefined);
  p.onAccessibilityAction({nativeEvent:{actionName:'longpress'}});assert.equal(h.commits(),0);
  p.onAccessibilityAction({nativeEvent:{actionName:'activate'}});assert.equal(h.commits(),1);
});
test('unmount drops queued commits and resets the material',()=>{
  const h=harness({queueRN:true});h.down();h.up();h.l.cleanup();h.l.flushRN();assert.equal(h.commits(),0);assert.equal(h.physics.pressure.value,0);
});
test('backgrounding cancels pressure and rejects queued action dispatch',()=>{
  const h=harness({queueRN:true});h.down();h.up();h.l.native.AppState.currentState='background';h.l.listeners['app:change']('background');h.l.flushRN();assert.equal(h.commits(),0);assert.equal(h.physics.pressure.value,0);
});
test('interactive artwork is passive and new optics are invisible at rest',()=>{
  const h=harness();const l=h.l;const B=l.load(path.join(root,'src/home/GlassButton.tsx')).GlassButton;
  const art=l.render(B,{variant:'primary',label:'Registrar +',scale:1,interaction:h.physics});
  assert.equal(art.type,'View');assert.equal(art.props.pointerEvents,'none');assert.equal(walk(art).filter(n=>n.type==='Pressable').length,0);
  const nodes=walk(expand(art));assert.ok(nodes.some(n=>n.type==='g'&&n.props.opacity===0&&n.props.animatedProps?.opacity===0));
});
test('local optics can be disabled while rigid press is retained',()=>{
  const h=harness();const B=h.l.load(path.join(root,'src/home/GlassButton.tsx')).GlassButton;
  const a=h.l.render(B,{variant:'primary',label:'Registrar +',scale:1,interaction:h.physics,opticsEnabled:false});
  assert.equal(walk(a).filter(n=>n.type?.name==='LiquidPressOptics').length,0);h.down();assert.equal(h.physics.pressure.value,1);
});
console.log(`\n${count} Liquid Phase A host/numerical checks passed. NOT native input, FPS or optical validation.`);
