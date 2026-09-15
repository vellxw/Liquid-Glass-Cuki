/** Deterministic host tests; native screenshots/Perfetto are separate evidence. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createLoader}=require('../load-ts.cjs');
const root=path.resolve(__dirname,'../..'),l=createLoader();
const {contactRect,GLASS_PERFORMANCE}=l.load(path.join(root,'src/liquid/performance.tsx'));
const {OPTIMIZED_VOLUME_SKSL,optimizeVolumeShader}=l.load(path.join(root,'src/liquid/optimizedShader.ts'));
const {VOLUME_SKSL}=l.load(path.join(root,'src/liquid/volumeShader.ts'));
let n=0;function test(name,fn){fn();n++;console.log('PASS performance:',name);}
test('default full-quality modes preserve blur, content, light and pressure',()=>{
 for(const name of ['baseline','optimized','frame-coalesced','shader-only']){
  const v=GLASS_PERFORMANCE[name];assert.equal(v.nativeBlur,true);assert.equal(v.lighting,true);
  assert.equal(v.contentFollow,true);assert.equal(v.identity,false);
 }
});
test('local support is never clipped at any size/density/contact tested',()=>{
 for(const width of [180,230,368,600])for(const height of [48,61,98])for(const density of [1,1.75,2,3,4])
 for(let x=0;x<=width;x+=11)for(let y=0;y<=height;y+=7){
  const r=contactRect(x,y,width,height,42,1,density);
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+.00001&&r.y+r.height<=height+.00001);
  assert.ok(r.x<=Math.max(0,x-63)&&r.y<=Math.max(0,y-63));
  assert.ok(r.x+r.width>=Math.min(width,x+63)&&r.y+r.height>=Math.min(height,y+63));
 }
});
test('rest prepares at most one transparent pixel and negative spring values retain full support',()=>{
 assert.equal(contactRect(100,30,230,61,42,0,2).width,.5);
 assert.equal(contactRect(100,30,230,61,42,0,2).height,.5);
 assert.equal(contactRect(100,30,230,61,42,-.01,2).width,contactRect(100,30,230,61,42,1,2).width);
});
test('geometry uses the same non-quantized contact coordinates',()=>{
 const s=fs.readFileSync(path.join(root,'src/liquid/VolumeSurface.tsx'),'utf8');
 assert.match(s,/touch:performance.coalesce\?\[optical.value.x,optical.value.y\]:\[contactX.value\+releaseX.value,contactY.value\+releaseY.value\]/);
 assert.match(s,/performance.coalesce && <OpticalFrameCoordinator/);
 const f=fs.readFileSync(path.join(root,'src/liquid/useOpticalFrame.ts'),'utf8');assert.match(f,/x:contactX.value\+releaseX.value/);assert.match(f,/y:contactY.value\+releaseY.value/);
 assert.doesNotMatch(s,/withTiming|withSpring|useFrameCallback|setInterval|setTimeout/);
});
test('shader optimization only reorders support rejection and shares the original sample',()=>{
 const test=`  float2 d=p-touch;\n  float q=dot(d,d)/(radius*radius);\n  if(q>=2.25) return half4(0.0);`;
 const old=VOLUME_SKSL.replace(test,'').replace('substrate.eval(sampleAt).rgb-substrate.eval(p).rgb','substrate.eval(sampleAt).rgb-background.rgb').replace(/\s+/g,'');
 const next=OPTIMIZED_VOLUME_SKSL.replace(test,'').replace(/\s+/g,'');
 assert.equal(old,next);assert.throws(()=>optimizeVolumeShader('invalid shader'));
});
test('geometry/press/haptic source checksums remain the native-rest baseline',()=>{
 const hashes=JSON.parse(fs.readFileSync(path.join(__dirname,'frozen-source.json'),'utf8'));
 for(const [file,hash] of Object.entries(hashes)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,file);
 }
});
test('no screenrecord or React per-frame meter in the A/B screen',()=>{
 const s=fs.readFileSync(path.join(root,'examples/GlassPerformanceBench.tsx'),'utf8');
 assert.doesNotMatch(s,/useFrameCallback|setInterval|setTimeout|onUpdate/);
 assert.match(s,/GlassPerformanceContext.Provider/);
});
console.log(`${n} performance invariants passed (including the dense support sweep).`);
