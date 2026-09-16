/** Host invariants of the current, persistent volume pipeline. Not native performance. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader}=require('../load-ts.cjs'),{serialize}=require('../register/render.cjs');
const root=path.resolve(__dirname,'../..'),l=createLoader();
const {volumeSample,contentDepth,VOLUME}=l.load(path.join(root,'src/liquid/volumeField.ts'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let count=0;function test(name,f){f();count++;console.log('PASS volume: '+name);}
test('late native cache data is installed only in complete REST',()=>{
 const {canInstallCache}=l.load(path.join(root,'src/liquid/useNativeMaterialCache.ts'));
 assert.equal(canInstallCache(false,0),true);
 for(const p of [0,.1,1,-.01])assert.equal(canInstallCache(true,p),false);
 for(const p of [.00001,.2,1,-.01])assert.equal(canInstallCache(false,p),false);
});
test('the true gradient matches finite differences throughout the plate',()=>{
 const e=1e-4;for(let x=15;x<225;x+=6)for(let y=3;y<58;y+=5){
 const s=volumeSample(x,y,103,29,230,61,.75);
 const gx=(volumeSample(x+e,y,103,29,230,61,.75).z-volumeSample(x-e,y,103,29,230,61,.75).z)/(2*e);
 const gy=(volumeSample(x,y+e,103,29,230,61,.75).z-volumeSample(x,y-e,103,29,230,61,.75).z)/(2*e);
 assert.ok(Math.abs(gx-s.gx)<.00001);assert.ok(Math.abs(gy-s.gy)<.00001);}
});
test('relief and refraction vanish together in REST',()=>{
 for(let x=0;x<230;x+=3){const a=volumeSample(x,30,115,30,230,61,0);assert.ok(a.z===0&&a.gx===0&&a.gy===0&&a.sx===0&&a.sy===0);}
});
test('negative pressure is clamped: no release bulge',()=>{
 const a=volumeSample(115,30,115,30,230,61,-.01);assert.ok(a.z===0&&a.sy===0);
});
test('foreground is a common sub-dp rigid settling, not warped lettering',()=>{
 for(const p of [0,.5,1,1.03])for(let x=0;x<230;x+=3){const d=contentDepth(150,30,x,30,p);assert.ok(d>=0&&d<=.85);}
 assert.equal(contentDepth(150,30,150,30,0),0);assert.equal(contentDepth(150,30,150,30,1,true),.12);
});
test('cache preparation is not coupled to every press or render frame',()=>{
 const s=read('src/liquid/VolumeSurface.tsx');assert.doesNotMatch(s,/makeImageFromView|nativeBacking|activeTexture|useFrameCallback|scheduleOnRN|setTimeout|setInterval/);
 assert.match(s,/pressure:enabled\?\(performance.coalesce\?optical.value.p:pressure.value\):0/);
 const c=read('src/liquid/useNativeMaterialCache.ts');assert.match(c,/generation.current/);assert.match(c,/capturing.current/);assert.match(c,/canInstallCache/);
 assert.doesNotMatch(c,/withTiming|withSpring|useFrameCallback/);
});
test('underlay is a distinct shader input, actually refracted',()=>{
 const s=read('src/liquid/volumeShader.ts');assert.match(s,/uniform shader substrate/);assert.match(s,/substrate.eval\(sampleAt\)/);
 assert.match(read('src/liquid/VolumeSurface.tsx'),/substrate\?:SkImage/);
 assert.match(s,/substrate.eval\(sampleAt\).rgb-substrate.eval\(p\).rgb/);
});
test('inner face mapping constrains the visible upper AND lower edge travel',()=>{
 const s=read('src/liquid/volumeShader.ts');assert.match(s,/hermite/);assert.match(s,/sampleY/);
 assert.doesNotMatch(s,/uniform float time|sine|rippleOffset/);
});
test('normal control excludes the former whole-button MechanicalSupport',()=>{
 assert.doesNotMatch(read('src/home/LocalRegisterArtwork.tsx'),/import.*MechanicalSupport|<MechanicalSupport/);
});
test('debug tracing is absent in default mode',()=>{
 const s=read('examples/RegisterPhysicsLab.tsx');assert.match(s,/debug && <Probe/);assert.match(s,/\[debug,setDebug\]=useState\(false\)/);
});
test('unchanged surrounding controls do not import the renderer',()=>{
 for(const f of ['src/home/RegisterButtonMaterial.tsx','src/home/NextWorkoutCard.tsx','src/bottom-nav/BottomNavGlass.tsx'])assert.doesNotMatch(read(f),/VolumeSurface|volumeShader|contentDepth/);
});
console.log(`\n${count} current volume-pipeline checks passed.`);
