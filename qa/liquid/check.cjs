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
    move(x,y){g.handlers.onTouchesMove({numberOfTouches:1,allTouches:[{id:0,x,y}]},manager);g.handlers.onUpdate({x,y,velocityX:0,velocityY:0});},
    secondFinger(){g.handlers.onTouchesDown({numberOfTouches:2,allTouches:[{id:0,x:115,y:30},{id:1,x:120,y:33}]},manager);},
    up(x=115,y=30.5,success=true){g.handlers.onEnd(evt(x,y),success&&!failed);g.handlers.onFinalize(evt(x,y),success&&!failed);},
    finish(){l.animations.at(-1)?.complete?.(true);},
  };
}
function propsOf(tree,type){return walk(tree).find(n=>n.type===type)?.props;}

test('approved material, Home and navigation stay byte-identical',()=>{
 for(const [file,hash] of Object.entries(baseline.protectedFiles))if(!baseline.intentionalChanges.includes(file))assert.equal(sha(file),hash,file);
});
test('the sole added rendering dependency is Expo-compatible Skia',()=>{
 const p=require(path.join(root,'package.json'));assert.equal(p.dependencies['@shopify/react-native-skia'],'2.6.2');
 for(const [name,value]of Object.entries(baseline.originalDependencies))assert.equal(p.dependencies[name],value);
});
test('native Pan starts at zero distance, with unlimited hold and continuous update',()=>{
 const h=harness();assert.equal(h.g.config.minDistance,0);assert.equal(h.g.config.maxPointers,1);
 assert.equal(h.g.config.maxDistance,undefined);assert.equal(h.g.config.maxDuration,undefined);assert.equal(typeof h.g.handlers.onUpdate,'function');
});
test('there is NO rigid transform, opacity press style or Tap recognizer in the engine',()=>{
 const src=fs.readFileSync(path.join(root,'src/liquid/LiquidPressable.tsx'),'utf8');
 assert.doesNotMatch(src,/Gesture\.Tap|rigidPose|translateY|\{\s*scale:|pressed\s*\?\s*[.0-9]|withRepeat|useState|setInterval|setTimeout/);
 const h=harness();h.down();assert.equal(h.physics.pressure.value,1);assert.equal(h.physics.active.value,true);
});
test('horizontal drag exceeds the former 12dp limit and stays in contact',()=>{
 const h=harness();h.down(40,30);h.move(85,30);h.move(130,30);h.move(192,30);
 assert.equal(h.physics.contactX.value,192);assert.equal(h.physics.pressure.value,1);assert.equal(h.physics.active.value,true);
 h.up(192,30);assert.equal(h.commits(),1);
});
test('a small circular drag follows both coordinates and commits only on release',()=>{
 const h=harness();h.down(115,30);
 for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;h.move(115+10*Math.cos(a),30+10*Math.sin(a));assert.equal(h.commits(),0);}
 assert.equal(h.physics.contactX.value,125);h.up(125,30);assert.equal(h.commits(),1);
});
test('height is negative and maximal immediately under the finger',()=>{
 const c=math.LOCAL_GLASS;assert.equal(math.heightAt(115,30.5,115,30.5,230,61,1),-c.depth);
 assert.ok(math.heightAt(125,30.5,115,30.5,230,61,1)>-c.depth);
 assert.ok(math.heightAt(115,30.5,115,30.5,230,61,0)===0);
});
test('the radial field has compact support and a pinned physical rim',()=>{
 assert.ok(math.heightAt(4,30,115,30,230,61,1)===0);
 assert.ok(math.heightAt(115,1,115,30,230,61,1)===0);
 assert.equal(math.heightAt(4,30,4,30,230,61,1),-math.LOCAL_GLASS.depth*math.smooth(2.4,9.4,math.rimDistance(4,30,230,61)));
});
test('hold is deterministic, with no time or ripple uniform',()=>{
 const a=math.localSample(125,35,115,30,230,61,1);
 for(let i=0;i<60;i++)assert.deepEqual(math.localSample(125,35,115,30,230,61,1),a);
 const s=fs.readFileSync(path.join(root,'src/liquid/depressionShader.ts'),'utf8');
 assert.doesNotMatch(s,/uniform float time|\bsin\(|\bcos\(/);
});
test('local texture sampling actually changes coordinates, not only brightness',()=>{
 const a=math.localSample(130,30.5,115,30.5,230,61,1);
 assert.ok(a.dx>0.2);assert.ok(Math.hypot(a.dx,a.dy)<=math.LOCAL_GLASS.maxRefraction);
 const b=math.localSample(15,30.5,115,30.5,230,61,1);assert.ok(b.dx===0 && b.dy===0);
});
test('slopes and refraction remain finite across all contact positions',()=>{
 for(let cx=5;cx<230;cx+=17)for(let cy=5;cy<61;cy+=11)for(let x=0;x<230;x+=5){
  const a=math.localSample(x,30,cx,cy,230,61,1);for(const v of Object.values(a))assert.ok(Number.isFinite(v));
  assert.ok(Math.hypot(a.dx,a.dy)<=3.6000001);
 }
});
test('rest is exactly undeformed; spring returns the same one-dimensional height field',()=>{
 const a=math.localSample(130,25,115,30,230,61,0);assert.ok(a.z===0 && a.dx===0 && a.dy===0);
 const h=harness();h.down();h.up();h.finish();assert.equal(h.physics.pressure.value,0);assert.equal(h.physics.active.value,false);
});
test('shader and native backing switch ONLY between representations, not press brightness',()=>{
 const s=fs.readFileSync(path.join(root,'src/liquid/LocalGlassSurface.tsx'),'utf8');
 assert.match(s,/makeImageFromView/);assert.match(s,/<ImageShader/);assert.match(s,/useDerivedValue/);assert.match(s,/useFrameCallback/);
 assert.doesNotMatch(s,/withRepeat|setInterval/);assert.match(s,/frame.value.pressure!==0\?0:1/);
});
test('native text and circle are outside the refracted subtree',()=>{
 const s=fs.readFileSync(path.join(root,'src/home/LocalRegisterArtwork.tsx'),'utf8');
 assert.ok(s.indexOf('</LocalGlassSurface>')<s.indexOf('<Circle'));
 assert.ok(s.indexOf('</LocalGlassSurface>')<s.indexOf('<HomeText'));
 assert.doesNotMatch(s,/Animated|transform:|scaleX|scaleY/);
});
test('ablation removes the entire local effect and exposes the untouched native material',()=>{
 const s=fs.readFileSync(path.join(root,'src/liquid/LocalGlassSurface.tsx'),'utf8');
 assert.match(s,/pressure:available\?frame.value.pressure:0/);
 const h=harness();assert.equal(walk(h.tree).some(n=>n.props?.style?.transform),false);
});

test('only PrimaryRegisterButton adopts the new engine',()=>{
  const p=fs.readFileSync(path.join(root,'src/home/PrimaryRegisterButton.tsx'),'utf8');
  assert.match(p,/<LiquidPressable/);assert.match(p,/interaction=\{physics\}/);
  for(const name of ['src/home/NextWorkoutCard.tsx','src/bottom-nav/BottomNavGlass.tsx']) assert.doesNotMatch(fs.readFileSync(path.join(root,name),'utf8'),/LiquidPressable|reanimated/);
});
test('App preserves the normal Home and installs the native gesture root',()=>{
  const s=fs.readFileSync(path.join(root,'App.tsx'),'utf8');assert.match(s,/<GestureHandlerRootView/);assert.match(s,/<CukiHomeDemo\s*\/>/);assert.match(s,/EXPO_PUBLIC_LIQUID_LAB === '1'/);
});
test('capsule hit testing rejects empty bounding-box corners and invalid coordinates',()=>{
  assert.equal(math.insideCapsule(1,1,230,61),false);assert.equal(math.insideCapsule(115,30,230,61),true);
  assert.equal(math.insideCapsule(NaN,0,230,61),false);assert.equal(math.insideCapsule(231,30,230,61),false);
});
test('action is committed only on successful release, once',()=>{
  const h=harness();h.down();assert.equal(h.commits(),0);h.up();assert.equal(h.commits(),1);
  h.g.handlers.onEnd({x:115,y:30.5},true);assert.equal(h.commits(),1);h.finish();assert.equal(h.physics.pressure.value,0);
});
test('a fast tap is not deferred by a minimum-press timer',()=>{
  const h=harness();h.down();h.up();assert.equal(h.commits(),1);assert.equal(h.l.animations.at(-1).target,0);
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
console.log(`\n${count} local-surface host/numerical checks passed. GPU/input/presentation require native evidence.`);
