"""Native acceptance of ACTUAL visible edge motion; not shader-token assertions.
The rim/far-material masks remain fixed. Text/insert are tested as rigid translations.
No OCR, image synthesis or replacement of the app capture.
"""
import json,re
from pathlib import Path
from PIL import Image,ImageStat
O=Path('qa/liquid/native-output');meta=json.loads((O/'bounds.json').read_text())
box=tuple(meta['button']);density=int(re.findall(r'\d+',meta['density'])[-1])/160

def img(name):return Image.open(O/(name+'.png')).convert('RGB').crop(box)
rest=img('rest');pressed=img('hold-1');w,h=rest.size
# Predefined central strip avoids both the circular insert and native text rows.
x0=int(w*.48);x1=int(w*.52)
def profile(im):return [sum(ImageStat.Stat(im.crop((x0,y,x1,y+1))).mean)/3 for y in range(h)]

def ridge(v,start,end):return max(range(start,end),key=lambda y:v[y])
lo=int(2.3*density)+1;hi=int(h*.24)
r=profile(rest);p=profile(pressed)
rt,rp=ridge(r,lo,hi),ridge(p,lo,hi)
br,bp=ridge(r,h-hi,h-lo),ridge(p,h-hi,h-lo)
result={'density':density,'topRidgePx':[rt,rp],'bottomRidgePx':[br,bp],
 'topTravelDp':(rp-rt)/density,'bottomTravelDp':(br-bp)/density,
 'combinedTravelDp':(rp-rt+br-bp)/density,'profiles':{'rest':r,'pressed':p},
 'method':'mean RGB row profile in fixed central 4% strip, excluding outer 2.3dp; argmax of each inner-ridge window'}

def bright(im,rect,threshold):
 out=[]
 for y in range(rect[1],rect[3]):
  for x in range(rect[0],rect[2]):
   if min(im.getpixel((x,y)))>threshold:out.append((x,y))
 if not out:raise AssertionError('Empty foreground mask')
 return {'cx':sum(x for x,y in out)/len(out),'cy':sum(y for x,y in out)/len(out),
         'width':max(x for x,y in out)-min(x for x,y in out)+1,
         'height':max(y for x,y in out)-min(y for x,y in out)+1,'count':len(out)}
boxes={'text':(int(w*193/460),int(h*.28),int(w*444/460),int(h*.86)),
       'insert':(int(w*84/460),int(h*.20),int(w*152/460),int(h*.84))}
result['foreground']={}
for name,rect in boxes.items():
 a,b=bright(rest,rect,210),bright(pressed,rect,210)
 result['foreground'][name]={'rest':a,'pressed':b,'dx':b['cx']-a['cx'],'dy':b['cy']-a['cy']}
(O/'face-perception.json').write_text(json.dumps(result,indent=2));print('FACE_PERCEPTION',json.dumps({k:v for k,v in result.items()if k!='profiles'}),flush=True)
assert 2.5<=result['combinedTravelDp']<=6,'The visible face is still imperceptible or over-compressed'
assert result['topTravelDp']>1 and result['bottomTravelDp']>.4,'Both inner sides must participate'
for name,v in result['foreground'].items():
 a,b=v['rest'],v['pressed'];assert abs(b['width']-a['width'])<=1,(name,'width')
 assert abs(b['height']-a['height'])<=1,(name,'height')
 assert abs(v['dx'])<.7,(name,'lateral drift')
 assert .3*density<v['dy']<1.4*density,(name,'missing/oversized settling')
print('FACE_NATIVE_VISIBLE_TRAVEL_PASS (not a perceptual study or FPS certification)',flush=True)
