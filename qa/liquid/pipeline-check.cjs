/** Host invariants of the current, persistent volume pipeline. Not native performance. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createLoader}=require('../load-ts.cjs'),{serialize}=require('../register/render.cjs');
const root=path.resolve(__dirname,'../..'),l=createLoader();
const {volumeSample,contentDepth,VOLUME}=l.load(path.join(root,'src/liquid/volumeField.ts'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
let count=0;function test(name,f){f();count++;console.log('PASS volume: '+name);}
test('XML is derived from the untouched approved React SVG',()=>{
 const {RegisterButtonMaterial}=l.load(path.join(root,'src/home/RegisterButtonMaterial.tsx'));
 const {materialXml}=l.load(path.join(root,'src/liquid/materialXml.ts'));
 const native=RegisterButtonMaterial({id:'cache'});
 const normalized=s=>s.replace(/\s+(?=>)/g,'').replace(/\s+/g,' ');
 assert.equal(normalized(materialXml(native)),normalized(serialize(native)));
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
test('small negative release overshoot is bounded, not a growing ripple',()=>{
 const a=volumeSample(115,30,115,30,230,61,-.01);assert.ok(a.z>0&&a.z<=VOLUME.depth*.010001);
});
test('native letters only have bounded sub-dp rigid follow-through',()=>{
 for(const p of [-.03,0,.5,1,1.03])for(let x=0;x<230;x+=3){const d=contentDepth(150,30,x,30,p);assert.ok(d>=0&&d<=.9);}
 assert.equal(contentDepth(150,30,150,30,0),0);assert.equal(contentDepth(150,30,150,30,1,true),.12);
});
test('no press-time swapping, viewport snapshots, cadence or microtask loops',()=>{
 const s=read('src/liquid/VolumeSurface.tsx');assert.doesNotMatch(s,/makeImageFromView|nativeBacking|activeTexture|useFrameCallback|scheduleOnRN|setTimeout|setInterval/);
 assert.match(s,/useMemo/);assert.match(s,/pressure:enabled\?pressure.value:0/);
});
test('underlay is a distinct shader input, actually refracted',()=>{
 const s=read('src/liquid/volumeShader.ts');assert.match(s,/uniform shader substrate/);assert.match(s,/substrate.eval\(sampleAt\)/);
 assert.match(read('src/liquid/VolumeSurface.tsx'),/substrate\?:SkImage/);
});
test('optical difference derives from both resting and pressed normals',()=>{
 const s=read('src/liquid/volumeShader.ts');assert.match(s,/baseGrad/);assert.match(s,/spec\(n,cold\)-spec\(n0,cold\)/);
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
