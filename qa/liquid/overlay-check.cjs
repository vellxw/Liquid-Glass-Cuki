/** Host compositing invariants, not a native SkSL/GPU test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const shader = fs.readFileSync(path.join(root, 'src/liquid/volumeShader.ts'), 'utf8');
const surface = fs.readFileSync(path.join(root, 'src/liquid/VolumeSurface.tsx'), 'utf8');
function correction(b, target) {
  const d = target.map((v, i) => v - b[i]);
  const a = Math.max(...d.map((v, i) => Math.abs(v) / Math.max(v >= 0 ? 1 - b[i] : b[i], .00001)));
  if (a <= .000001) return {a: 0, rgb: [0, 0, 0]};
  return {a, rgb: b.map((v, i) => a * v + d[i])};
}
let state=1526;
function random(){state=(Math.imul(state,1664525)+1013904223)>>>0;return (state+.5)/4294967296;}
for(let i=0;i<20000;i++) {
  const b=[random(),random(),random()], t=[random(),random(),random()];
  const c=correction(b,t);
  assert.ok(c.a>=0 && c.a<=1+1e-12);
  c.rgb.forEach((v,j)=>{
    assert.ok(v>=-1e-12 && v<=c.a+1e-12);
    assert.ok(Math.abs(v+b[j]*(1-c.a)-t[j])<1e-10);
  });
  assert.deepEqual(correction(b,b),{a:0,rgb:[0,0,0]});
}
for(const b of [[0,0,0],[1,1,1],[0,1,.5],[.5,0,1]])
 for(const t of [[0,0,0],[1,1,1],[1,0,.5],[.5,1,0]]){
  const c=correction(b,t);c.rgb.forEach((v,j)=>assert.ok(Math.abs(v+b[j]*(1-c.a)-t[j])<1e-10));
 }
assert.match(shader,/if\(pressure==0\.0\) return half4\(0\.0\)/);
assert.match(shader,/if\(edge<=2\.4\) return half4\(0\.0\)/);
assert.match(shader,/if\(q>=2\.25\) return half4\(0\.0\)/);
assert.match(shader,/return opticalDifference\(before.rgb,after.rgb\)/);
assert.match(surface,/<View ref=\{source\} collapsable=\{false\} onLayout=\{prepare\}/);
assert.doesNotMatch(surface,/!available &&|opacity:|useAnimatedStyle|withTiming|withSpring/);
console.log('PASS optical overlay: 20000 deterministic color pairs, extreme channels, exact zero support, original native source remains mounted. Native evidence still required.');
const art=fs.readFileSync(path.join(root,'src/home/LocalRegisterArtwork.tsx'),'utf8');
assert.match(shader,/if\(insertMask==0\.0\) return half4\(0\.0\)/);
assert.match(art,/protectedCircle=\{\[118\*s,61\*s,32\.5\*s\]\}/);
assert.doesNotMatch(art,/circleStyle/);
const {createLoader}=require('../load-ts.cjs');
const l=createLoader();
const {LocalRegisterArtwork}=l.load(path.join(root,'src/home/LocalRegisterArtwork.tsx'));
const {GlassButton}=l.load(path.join(root,'src/home/GlassButton.tsx'));
const shared=value=>({value});
const physics={width:230,height:61,pressure:shared(0),contactX:shared(115),contactY:shared(30.5),
 velocityX:shared(0),velocityY:shared(0),releaseX:shared(0),releaseY:shared(0),
 active:shared(false),reduceMotion:shared(false),intensity:1};
function nodes(n){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(nodes);
 return [n,...nodes(n.props?.children)];}
const normal=nodes(GlassButton({variant:'primary',label:'Registrar +',scale:1}));
const local=nodes(LocalRegisterArtwork({physics,scale:1,label:'Registrar +'}));
function circleProps(list){return list.filter(n=>n.type==='Circle').map(n=>({...n.props,
 fill: typeof n.props.fill==='string'&&n.props.fill.startsWith('url(')?'same-circle-gradient':n.props.fill}));}
assert.deepEqual(circleProps(local),circleProps(normal));
console.log('PASS fixed native plus insert: original circle geometry/fill/stroke, no transform, shader sampling exclusion.');
