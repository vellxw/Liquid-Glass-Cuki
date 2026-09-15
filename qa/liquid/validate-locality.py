"""Protect actual native pixels outside the contact patch, not just REST recovery."""
import json, re
from pathlib import Path
from PIL import Image
out=Path('qa/liquid/native-output')
b=json.loads((out/'bounds.json').read_text());box=tuple(b['button'])
density=int(re.search(r'\d+',b['density']).group())/160
r=Image.open(out/'rest.png').convert('RGB').crop(box)
h=Image.open(out/'hold-1.png').convert('RGB').crop(box)
w,height=r.size;radius=height/2;cx=w*.5
rim_errors=[];outside_errors=[]
for y in range(height):
 for x in range(w):
  edge=radius-((x-max(radius,min(w-radius,x)))**2+(y-radius)**2)**.5
  diff=sum(abs(a-b)for a,b in zip(r.getpixel((x,y)),h.getpixel((x,y))))/3
  if .25*density<=edge<=2.2*density:rim_errors.append(diff)
  if abs(x-cx)>42*1.96*density:outside_errors.append(diff)
result={'pinnedRimMAE':sum(rim_errors)/len(rim_errors),'outsideContactMAE':sum(outside_errors)/len(outside_errors),
 'rimPixels':len(rim_errors),'outsidePixels':len(outside_errors),'density':density}
(out/'locality.json').write_text(json.dumps(result,indent=2));print('LOCALITY',result,flush=True)
assert result['pinnedRimMAE']<1.0,'Native outer rim changed during pressure'
assert result['outsideContactMAE']<.75,'Backing texture changes material outside the local patch'
