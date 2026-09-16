"""Stricter native acceptance; old tolerant gates cannot certify the new resting path."""
import json, re, subprocess
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
p=Path('qa/liquid/native-output')
r=json.loads((p/'result.json').read_text());box=tuple(r['button'])
def image(name):return Image.open(p/(name+'.png')).convert('RGB').crop(box)
def mae(a,b):return sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
rest=image('rest');out={
 'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
 'originalNativeRestMAE':mae(image('original-svg-rest'),rest),
 'holdMAE':mae(image('hold-1'),image('hold-2')),
 'releaseRestMAE':mae(rest,image('settled')),
 'offMAE':mae(image('off-rest'),image('off-hold')),
 'cancelRestMAE':mae(rest,image('cancelled')),
 'geometryWithoutLightingMAE':mae(image('geometry-rest'),image('geometry-hold')),
 'fps':{},'locality':json.loads((p/'locality.json').read_text()),
 'nativeTest':'Production JS in Expo Go/API35, software GPU; not physical-phone FPS',
 'phaseAComplete':False,
}
for f in ['surfaceflinger-drag.txt','surfaceflinger-unrecorded.txt']:
 values=[]
 for section in (p/f).read_text().split('layerName = ')[1:]:
  if 'ExperienceActivity' not in section.splitlines()[0]:continue
  a=re.search(r'averageFPS = ([0-9.]+)',section)
  n=re.search(r'totalFrames = (\d+)',section)
  if a and n:values.append({'presentedFPS':float(a[1]),'frames':int(n[1]),'layer':section.splitlines()[0]})
 out['fps'][f]=values
(p/'strict-result.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2),flush=True)
for key in ['originalNativeRestMAE','holdMAE','releaseRestMAE','offMAE','cancelRestMAE']:
 assert out[key]==0, (key,out[key])
assert out['locality']['pinnedRimMAE']==0
assert out['locality']['outsideContactMAE']==0
assert out['geometryWithoutLightingMAE']>.15
assert all(out['fps'].values()), 'Missing presentation measurement'
print('STRICT_NATIVE_REST_PASS: original/rest, hold, release, cancel, ablation and fixed rim exact on this run. Not a physical haptic/iOS/perceptual approval.')

# Fixed foreground contract: opaque glyph cores and circle remain unchanged.
from PIL import ImageFilter
w,h=rest.size
mask=Image.new('L',(w,h))
for y in range(h):
 for x in range(int(w*193/460),min(w,int(w*443/460))):
  if min(rest.getpixel((x,y)))>230:mask.putpixel((x,y),255)
mask=mask.filter(ImageFilter.MinFilter(3))
assert mask.getbbox(), 'No opaque text pixels found for stationary-content check'
foreground={}
for name in ['hold-1','drag-left','drag-right','circle-hold']:
 diff=ImageChops.difference(rest,image(name))
 foreground[name]=sum(ImageStat.Stat(diff,mask).mean)/3
 assert foreground[name]==0,(name,foreground[name])
(p/'stationary-text.json').write_text(json.dumps(foreground,indent=2))
print('PREMIUM_FIXED_TEXT_PASS',foreground,flush=True)
