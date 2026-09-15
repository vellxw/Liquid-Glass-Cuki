/** Host tests for the optimized pipeline, not native FPS measurements. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader}=require('../load-ts.cjs');
const root=path.resolve(__dirname,'../..'),l=createLoader();
const {opticalFrame,sameFrame,contactPatch}=l.load(path.join(root,'src/liquid/opticalFrame.ts'));
let count=0;function test(name,f){f();console.log('PASS pipeline: '+name);count++;}
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('support is exact identity at rest',()=>{const f=opticalFrame(52,34,0,0,0,230,61,false,1,true);assert.equal(f.x,52);assert.equal(f.y,34);});
test('inverse pose keeps the depression directly below the physical finger',()=>{
 for(const reduced of [false,true])for(const p of [0,.25,.5,1])for(const x of [20,115,210]){
 const f=opticalFrame(x,28,0,0,p,230,61,reduced,1,true);
 const scale=1+((reduced?.998:.98)-1)*p,down=(reduced?.25:2)*p;
 assert.ok(Math.abs((f.x-115)*scale+115-x)<1e-10);
 assert.ok(Math.abs((f.y-30.5)*scale+30.5+down-28)<1e-10);
 }});
test('local-only mode does not alter native contact coordinates',()=>{const f=opticalFrame(75,27,50,5,1,230,61,false,1,false);assert.equal(f.x,75);assert.equal(f.y,27);});
test('stationary frame equality suppresses redundant submissions',()=>{const a=opticalFrame(75,27,0,0,1,230,61,false,1,false);assert.ok(sameFrame(a,{...a}));assert.ok(!sameFrame(a,{...a,x:76}));});
test('compact patch includes the entire field and remains inside the viewport',()=>{
 for(let x=0;x<=368;x+=9)for(let y=0;y<=98;y+=7){const r=contactPatch(x,y,368,98);assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=368.00001&&r.y+r.height<=98.00001);assert.ok(r.width<=2*42*1.91+.00001);}
});
test('no per-input velocity animation or duplicate movement assignment',()=>{
 const s=read('src/liquid/LiquidPressable.tsx').split('.onUpdate(event=>')[1].split('.onEnd')[0];assert.doesNotMatch(s,/withTiming|withSpring|scheduleOnRN|setState/);
});
test('surface has one frame sampler and no settlement snapshot bridge',()=>{const s=read('src/liquid/LocalGlassSurface.tsx');assert.match(s,/useFrameCallback/);assert.match(s,/sameFrame/);assert.doesNotMatch(s,/scheduleOnRN|useAnimatedReaction/);assert.match(s,/pressure.value===0/);});
test('shader executes only in the bounded contact rectangle, with source replacement',()=>{
 const s=read('src/liquid/LocalGlassSurface.tsx');assert.match(s,/<Image image=/);assert.match(s,/<Rect rect=\{patch\} blendMode="src">/);assert.doesNotMatch(s,/<Fill/);
});
test('integer specular ladder matches the original exponents',()=>{
 for(let i=0;i<1000;i++){let x=i/1000,x2=x*x,x4=x2*x2,x8=x4*x4,x16=x8*x8,x32=x16*x16,x64=x32*x32,x128=x64*x64;
 assert.ok(Math.abs(x64*x32*x16*x8-Math.pow(x,120))<1e-13);assert.ok(Math.abs(x128*x16*x4*x2-Math.pow(x,150))<1e-13);}
});
test('unsupported shader keeps native material and does not abort the Home',()=>{const s=read('src/liquid/LocalGlassSurface.tsx');assert.match(s,/catch\{return null;/);assert.doesNotMatch(s,/throw new Error/);});
test('debug probes are unmounted by default rather than silently sampling every frame',()=>{const s=read('examples/RegisterPhysicsLab.tsx');assert.match(s,/debug && <Probe/);assert.match(s,/\[debug,setDebug\]=useState\(false\)/);});
test('approved material and other controls receive no new motion imports',()=>{for(const f of ['src/home/RegisterButtonMaterial.tsx','src/home/NextWorkoutCard.tsx','src/bottom-nav/BottomNavGlass.tsx'])assert.doesNotMatch(read(f),/MechanicalSupport|LocalGlassSurface/);});
console.log(`\n${count} pipeline checks passed.`);
