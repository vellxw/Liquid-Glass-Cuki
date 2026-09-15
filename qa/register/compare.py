"""Diagnostic comparison only. Reference/device inputs are QA, never app assets.
Install optional QA packages: python -m pip install pillow numpy scikit-image
Usage: python qa/register/compare.py REFERENCE DEVICE_BEFORE EVIDENCE_DIR
Expects baseline.png and vN.png rendered at 2x in EVIDENCE_DIR.
"""
import sys, json, hashlib, os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from skimage.metrics import structural_similarity
cfg_path=Path(__file__).with_name('comparison-config.json')
cfg=json.loads(cfg_path.read_text())
if len(sys.argv) != 4:
    raise SystemExit('Usage: compare.py REFERENCE DEVICE_BEFORE EVIDENCE_DIR')
ref_path, dev_path, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
out.mkdir(parents=True,exist_ok=True)
w,h,pad=460,122,12
size=(w+pad*2,h+pad*2)
def aligned(path,key):
    im=Image.open(path).convert('RGB'); c=cfg[key]
    assert list(im.size)==c['resolution'], (path,im.size)
    sx,sy=c['origin'];s=c['scale']
    return im.transform(size,Image.Transform.AFFINE,(s,0,sx-pad*s,0,s,sy-pad*s),Image.Resampling.BICUBIC)
ref=aligned(ref_path,'reference');dev=aligned(dev_path,'deviceBefore')
ref.save(out/'reference-aligned.png');dev.save(out/'device-before-aligned.png')
y,x=np.indices((size[1],size[0]),dtype=float);x=x-pad+.5;y=y-pad+.5
# Signed distance to the frozen capsule. Same mask for all iterations.
d=np.sqrt(np.maximum(np.abs(x-w/2)-(w-h)/2,0)**2+(y-h/2)**2)-h/2
rim=(d>=cfg['mask']['signedDistanceMin'])&(d<=cfg['mask']['signedDistanceMax'])
regions={'full-rim':rim,
 'upper-left':rim&(x<90)&(y<61),'upper-center':rim&(x>=90)&(x<=370)&(y<61),
 'upper-right':rim&(x>370)&(y<61),'lower-right':rim&(x>370)&(y>=61),
 'lower-center':rim&(x>=90)&(x<=370)&(y>=61),'lower-left':rim&(x<90)&(y>=61),
 'center-diagnostic':(x>=172)&(x<=352)&(y>=30)&(y<=39)}
maskim=Image.fromarray(rim.astype('uint8')*255); maskim.save(out/'fixed-mask.png')
config_hash=hashlib.sha256(cfg_path.read_bytes()).hexdigest()
a=np.array(ref,dtype=np.float64)
metrics={'configSHA256':config_hash,'nativeAfterAvailable':False,'method':cfg['method'], 'versions':{}}
images={'device-before':dev}
for name in ['baseline']+[f'v{i}' for i in range(1,10)]:
    f=out/f'{name}.png'
    if f.exists(): images[name]=Image.open(f).convert('RGB').resize(size,Image.Resampling.LANCZOS)
for name,im in images.items():
    b=np.array(im,dtype=float)
    _,smap=structural_similarity(a,b,data_range=255,channel_axis=2,full=True)
    if smap.ndim==3:smap=smap.mean(axis=2)
    report={}
    for region,mask in regions.items():
        err=(a-b)[mask]
        report[region]={'pixels':int(mask.sum()),'MAE':round(float(np.abs(err).mean()),3),
            'RMSE':round(float(np.sqrt((err**2).mean())),3),
            'SSIM_local_mean':round(float(smap[mask].mean()),4),
            'mean_luma':round(float((b[:,:,0]*.2126+b[:,:,1]*.7152+b[:,:,2]*.0722)[mask].mean()),2)}
    metrics['versions'][name]=report
(out/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
last=list(images)[-1];final=images[last];b=np.array(final,dtype=float)
Image.blend(ref,final,.5).save(out/'overlay50.png')
Image.fromarray(np.clip(np.abs(a-b),0,255).astype('uint8')).save(out/'absolute-diff.png')
diff=np.abs(a-b)*rim[:,:,None]
Image.fromarray(np.clip(diff*2,0,255).astype('uint8')).save(out/'rim-diff-2x-gain.png')
try:
    font=ImageFont.truetype(os.environ.get('QA_FONT', 'DejaVuSans.ttf'),17)
except OSError:
    font=ImageFont.load_default(size=17)
rows=[('REFERENCIA | recorte de la imagen',ref),('ANTES | captura real del usuario',dev),('DESPUES | diagnostico SVG; no es captura nativa',final)]
panel=Image.new('RGB',(size[0]*2+32,len(rows)*(size[1]*2+44)+16),'#0B1315');draw=ImageDraw.Draw(panel)
for i,(label,im) in enumerate(rows):
    top=16+i*(size[1]*2+44);draw.text((16,top),label,font=font,fill='#DEE5EB')
    panel.paste(im.resize((size[0]*2,size[1]*2),Image.Resampling.LANCZOS),(16,top+28))
panel.save(out/'comparison.png')
print(json.dumps({n:v['full-rim'] for n,v in metrics['versions'].items()},indent=2))
