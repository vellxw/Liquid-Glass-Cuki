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
