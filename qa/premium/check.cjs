/** Native timing/presentation is tested separately. This checks state and math, not FPS. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader}=require('../load-ts.cjs');
const root=path.resolve(__dirname,'../..'),l=createLoader();
const {PREMIUM_PRESS:P}=l.load(path.join(root,'src/liquid/premiumPress.tokens.ts'));
const {volumeSample}=l.load(path.join(root,'src/liquid/volumeField.ts'));
const {SPRINGS,yieldsToScroll}=l.load(path.join(root,'src/liquid/physics.ts'));
let n=0;const test=(name,f)=>{f();n++;console.log('PASS premium:',name);};
function harness(props={},scroll=false){
 const l=createLoader(),scope=l.load(path.join(root,'src/liquid/PremiumScrollScope.ts'));
 if(scroll)scope.PremiumScrollContext._default={gesture:{},enabled:true,resourceRevision:0};
 const {LiquidPressable}=l.load(path.join(root,'src/liquid/LiquidPressable.tsx'));
 let state,calls=0;const events=[];
 const tree=l.render(LiquidPressable,{width:230,height:61,label:'Registrar +',onPress:()=>calls++,onPhase:e=>events.push(e),...props,children:p=>{state=p;return null;}});
 l.flushEffects();const g=l.gestures.at(-1),evt=(x,y)=>({x,y,numberOfPointers:1});
 const manager={activate:()=>{},fail:()=>g.handlers.onFinalize({},false)};
 return {l,state,g,tree,events,calls:()=>calls,
  down(x=115,y=30){g.handlers.onBegin(evt(x,y));g.handlers.onTouchesDown({numberOfTouches:1,allTouches:[{x,y}]},manager);},
  move(x,y){g.handlers.onTouchesMove({numberOfTouches:1,allTouches:[{x,y}]},manager);g.handlers.onUpdate({...evt(x,y),velocityX:800,velocityY:80});},
  up(x=115,y=30){g.handlers.onEnd(evt(x,y),true);g.handlers.onFinalize(evt(x,y),true);},
 };
}
test('critical release, zero inherited velocity and no visible overshoot',()=>{
 const s=SPRINGS.settle;assert.equal(s.damping,2*Math.sqrt(s.mass*s.stiffness));assert.equal(s.velocity,0);assert.equal(s.overshootClamping,true);
 // Analytic critically damped release: monotonically returns toward zero.
 let prior=1;for(let t=0;t<=.3;t+=.001){const w=Math.sqrt(s.stiffness/s.mass),q=(1+w*t)*Math.exp(-w*t);assert.ok(q<=prior+1e-10&&q>=0);prior=q;}
 assert.ok((1+50*.12)*Math.exp(-50*.12)<.02);
});
test('entry starts from actual pressure; no seed step or minimum-duration timeout',()=>{
 const s=fs.readFileSync(path.join(root,'src/liquid/LiquidPressable.tsx'),'utf8');
 assert.doesNotMatch(s,/Math.max\(LOCAL_GLASS.contactSeed|setTimeout|setInterval/);
 const h=harness();assert.equal(h.g.config.manualActivation,true);h.down();assert.equal(h.l.animations[0].config.duration,P.entryMs);h.up();assert.equal(h.calls(),1);
});
test('release after lateral drag keeps the optical center stationary',()=>{
 const h=harness();h.down(80,30);h.move(150,30);h.up(150,30);
 assert.equal(h.state.contactX.value,150);assert.equal(h.state.releaseX.value,0);assert.equal(h.state.releaseY.value,0);
 assert.equal(h.l.animations.length,2); // one entry and one scalar recovery
});
test('cancel + reentry never commits an invalidated interaction',()=>{
 const h=harness();h.down();h.move(400,30);h.move(115,30);h.up();assert.equal(h.calls(),0);
 assert.equal(h.events.filter(e=>e.phase==='cancel').length,1);
});
test('busy is explicit input state, not a timed double-submit debounce',()=>{
 const h=harness({busy:true});h.down();h.up();assert.equal(h.calls(),0);
 assert.equal(h.tree.props.children[0].props.accessibilityState.busy,true);
 assert.equal(h.tree.props.children[0].props.accessibilityState.disabled,true);
});
test('scroll arbitration is vertical, not a loss of horizontal local manipulation',()=>{
 assert.equal(yieldsToScroll(2,15,true),true);assert.equal(yieldsToScroll(30,12,true),false);assert.equal(yieldsToScroll(0,30,false),false);
 const h=harness({},true);h.down(115,22);h.move(116,38);h.up(116,38);assert.equal(h.calls(),0);
 assert.ok(h.g.config.simultaneousWithExternalGesture);
 const h2=harness({},true);h2.down(70,30);h2.move(170,30);h2.up(170,30);assert.equal(h2.calls(),1);
});
test('vertical drag remains available in an isolated non-scrolling lab',()=>{
 const h=harness();h.down(115,20);h.move(116,38);h.up(116,38);assert.equal(h.calls(),1);
});
test('surface and content contain no rigid pose or independent animation',()=>{
 const s=fs.readFileSync(path.join(root,'src/home/LocalRegisterArtwork.tsx'),'utf8');
 assert.doesNotMatch(s,/translate[XY]|rotate|scale[XY]|useAnimatedStyle|Animated.View/);
 assert.equal(P.contentTravel,0);
});
test('lighting modulates existing RGB; no gold/cyan additive emission or sweep',()=>{
 const s=l.load(path.join(root,'src/liquid/volumeShader.ts')).VOLUME_SKSL;
 assert.match(s,/rgb\*=clamp/);assert.doesNotMatch(s,/rgb\+=lighting|uniform float time|\bsin\(|\bcos\(/);
});
test('local geometry remains visible with lighting removed and stays bounded',()=>{
 let maximum=0;for(let x=0;x<230;x+=2)for(let y=0;y<61;y+=2){const a=volumeSample(x,y,115,30,230,61,1);maximum=Math.max(maximum,Math.hypot(a.sx,a.sy));assert.ok(Math.hypot(a.sx,a.sy)<=P.maxRefraction);}
 assert.ok(maximum>.8);
});
test('both interior bevels compress inward while the outer border stays fixed',()=>{
 const a=volumeSample(115,8,115,30.5,230,61,1),b=volumeSample(115,53,115,30.5,230,61,1);
 assert.ok(a.sy<0);assert.ok(b.sy>0);
 for(const y of [0,1,60,61]){const c=volumeSample(115,y,115,30.5,230,61,1);assert.ok(c.sx===0&&c.sy===0);}
});
test('ten-minute validation configuration and static drawing invariants stay explicit',()=>{
 const s=fs.readFileSync(path.join(root,'qa/performance/run.py'),'utf8');assert.match(s,/range\(20\)/);
 const h=fs.readFileSync(path.join(root,'src/home/HomeScreen.tsx'),'utf8');assert.match(h,/PremiumScrollContext.Provider/);assert.match(h,/useNativeDriver: true/);
});
test('offscreen preparation has no gesture or render-loop input',()=>{
 const s=fs.readFileSync(path.join(root,'src/liquid/prepareOpticalPipeline.ts'),'utf8');
 assert.match(s,/MakeOffscreen/);assert.match(s,/pressure:\[1\]/);assert.doesNotMatch(s,/useFrameCallback|setInterval|withRepeat/);
 const v=fs.readFileSync(path.join(root,'src/liquid/useNativeMaterialCache.ts'),'utf8');assert.match(v,/gpuPreparation.current/);assert.match(v,/makeNonTextureImage/);
});
console.log(`${n} premium behavior checks passed; not a native tactile or FPS certification.`);
