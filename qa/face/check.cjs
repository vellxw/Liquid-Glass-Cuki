/** Actual edge travel is a tested geometric constraint, not a nominal intensity. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {createLoader}=require('../load-ts.cjs');const l=createLoader(),root=path.resolve(__dirname,'../..');
const {faceKnots,faceSample,faceContentTravel}=l.load(path.join(root,'src/liquid/faceCompression.ts'));
let n=0;function test(name,fn){fn();n++;console.log('PASS face:',name);}
test('both inner edges move by a combined 4dp at normal Home size',()=>{
 const f=faceKnots(126,126,33,252,66,1);
 assert.ok(Math.abs(f.top+f.bottom-4)<1e-9);
 assert.ok(Math.abs(f.at+faceSample(126,f.at,126,33,252,66,1).sy-f.a)<1e-9);
 assert.ok(Math.abs(f.bt+faceSample(126,f.bt,126,33,252,66,1).sy-f.b)<1e-9);
});
test('mapping never folds or reverses rows at supported responsive sizes',()=>{
 for(const [w,h] of [[180,48],[230,61],[252,66],[368,98]])for(const cx of [w*.16,w*.5,w*.84])
 for(const cy of [h*.15,h*.5,h*.85])for(const p of [.2,.6,1])for(let x=0;x<w;x+=7){
 let prior=-Infinity;
 for(let y=0;y<=h;y+=.25){const sample=y+faceSample(x,y,cx,cy,w,h,p).sy;
 assert.ok(Number.isFinite(sample)&&sample>=prior-1e-8,JSON.stringify({x,y,w,h,cx,cy,p,prior,sample}));prior=sample;}
 }
});
test('REST preserves every sample position, also when the contact is near an end',()=>{
 for(let x=0;x<252;x+=3)for(let y=0;y<66;y+=2){const f=faceSample(x,y,33,10,252,66,0);assert.ok(f.sx===0&&f.sy===0);}
});
test('material at a distant end and the fixed outer frame do not move',()=>{
 for(const x of [2,20,240,250]){const s=faceSample(x,33,126,33,252,66,1);assert.ok(s.sx===0&&s.sy===0);}
 for(const y of [0,1,2.2,64,65,66])assert.equal(faceSample(126,y,126,33,252,66,1).sy,0);
});
test('same pressure produces the same pose: there is no autonomous hold animation',()=>{
 const a=faceSample(130,7,126,33,252,66,1);
 for(let i=0;i<600;i++)assert.deepEqual(faceSample(130,7,126,33,252,66,1),a);
});
test('visible travel remains bounded and independent of the optional lighting',()=>{
 for(let y=0;y<66;y+=.2)for(let x=0;x<252;x+=3)assert.ok(Math.abs(faceSample(x,y,126,33,252,66,1).sy)<3.2);
 const s=fs.readFileSync(path.join(root,'src/liquid/volumeShader.ts'),'utf8');
 assert.ok(s.indexOf('float sampleY=')<s.indexOf('rgb*=clamp'));
});
test('a group of crisp foreground elements shares one sub-dp translation',()=>{
 assert.equal(faceContentTravel(1),.85);assert.equal(faceContentTravel(1,true),.12);assert.equal(faceContentTravel(0),0);
 const s=fs.readFileSync(path.join(root,'src/liquid/volumeShader.ts'),'utf8');
 assert.match(s,/p-float2\(0.0,contentTravel\)/);assert.doesNotMatch(s,/rotate|uniform float time/);
});
console.log(`${n} face-compression checks passed (host, not native images).`);
