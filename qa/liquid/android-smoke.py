"""Runs on a fresh Android emulator. Uiautomator XML, never OCR.
Records genuine native frames and asserts press/release and callback behavior.
No account login, credentials, uploads or changes to product data are involved.
"""
import base64
import io
import json
import re
import subprocess as sp
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, ImageDraw

OUT = Path('qa/liquid/native-output')
OUT.mkdir(parents=True, exist_ok=True)

def adb(*args, timeout=35):
    return sp.check_output(['adb', *args], timeout=timeout)

def hierarchy():
    adb('shell', 'uiautomator', 'dump', '/sdcard/liquid-ui.xml')
    text = adb('shell', 'cat', '/sdcard/liquid-ui.xml').decode('utf-8', errors='replace')
    (OUT/'ui.xml').write_text(text)
    return ET.fromstring(text)

def find(root, identifier):
    for n in root.iter('node'):
        if n.get('resource-id','').endswith(identifier) or n.get('content-desc') == identifier or n.get('text') == identifier:
            return n
    return None

def bounds(n):
    return tuple(map(int, re.findall(r'\d+', n.attrib['bounds'])))

def center(n):
    x1,y1,x2,y2 = bounds(n)
    return (x1+x2)//2, (y1+y2)//2

def tap(n):
    x,y = center(n)
    adb('shell','input','tap',str(x),str(y))
    time.sleep(.6)

def capture(name):
    data = adb('exec-out','screencap','-p')
    (OUT/f'{name}.png').write_bytes(data)
    return Image.open(io.BytesIO(data)).convert('RGB')

def counter(expected):
    root=hierarchy()
    node=find(root,'lab-commits')
    text = node.get('text','') if node is not None else ''
    if not text:
        text=' '.join(n.get('text','') for n in root.iter('node'))
    assert f'Acciones: {expected}' in text, f'Counter {expected} not found: {text[:1000]}'
    return root

# Allow Metro bundling and Expo Go download/first-run screens, but never hide a runtime error.
ready=None
for attempt in range(55):
    time.sleep(4)
    try:
        root=hierarchy()
        ready=find(root,'lab-register')
        if ready is not None: break
        texts=' '.join(n.get('text','') for n in root.iter('node'))
        if any(s in texts for s in ['Uncaught Error','ReferenceError:','TypeError:','Invariant Violation','WorkletsError']):
            raise RuntimeError(texts[:3000])
        for title in ['Continue','Got it','Allow','Allow notifications','Open','OK']:
            n=find(root,title)
            if n is not None:
                tap(n)
                break
    except (sp.SubprocessError, ET.ParseError):
        continue
if ready is None:
    capture('startup-failure')
    raise RuntimeError('Native lab did not become accessible. Inspect Metro, logcat, XML and screenshot artifacts.')

time.sleep(2)
root=counter(0)
ready=find(root,'lab-register')
x,y=center(ready)
x1,y1,x2,y2=bounds(ready)
box=(max(0,x1-12),max(0,y1-12),x2+12,y2+18)
record=sp.Popen(['adb','shell','screenrecord','--time-limit','8','/sdcard/liquid-phase-a.mp4'])
time.sleep(.5)
rest=capture('rest')
hold=sp.Popen(['adb','shell','input','touchscreen','swipe',str(x),str(y),str(x),str(y),'1500'])
time.sleep(.65)
pressed=capture('pressed')
hold.wait(timeout=8)
time.sleep(.7)
settled=capture('settled')
counter(1)
record.wait(timeout=12)
adb('pull','/sdcard/liquid-phase-a.mp4',str(OUT/'native-press.mp4'))

r,p,s=(im.crop(box) for im in [rest,pressed,settled])
press_mae=sum(ImageStat.Stat(ImageChops.difference(r,p)).mean)/3
settle_mae=sum(ImageStat.Stat(ImageChops.difference(r,s)).mean)/3
assert press_mae > .05, f'Native pressed state indistinguishable: {press_mae}'
assert settle_mae < 1, f'Native rest did not recover: MAE {settle_mae}'

# Horizontal escape: no scroll needed to find the counter again.
adb('shell','input','swipe',str(x),str(y),str(rest.width-1),str(y),'500')
time.sleep(.6)
counter(1)

node=find(hierarchy(),'Deshabilitar Registrar')
assert node is not None,'Disabled switch missing'
tap(node)
adb('shell','input','tap',str(x),str(y))
time.sleep(.5)
counter(1)
tap(find(hierarchy(),'Deshabilitar Registrar'))

node=find(hierarchy(),'Forzar movimiento reducido')
assert node is not None,'Reduced-motion switch missing'
tap(node)
adb('shell','input','tap',str(x),str(y))
time.sleep(.7)
root=counter(2)
(OUT/'result.json').write_text(json.dumps({'native':'Android API 35 / Expo Go / software GPU / debug JS',
  'pressROI_MAE':press_mae,'settledROI_MAE':settle_mae,
  'normalHoldCommit':True,'escapeCancelled':True,'disabledIgnored':True,'reducedCommit':True,
  'physicalHaptics':'not testable in emulator','release60fps':'not measured',
  'bounds':box},indent=2))
print('NATIVE_RESULT', (OUT/'result.json').read_text(),flush=True)
# Small native crops in the log also permit a visual check when artifact download is unavailable.
montage=Image.new('RGB',(480,3*164),'#111719')
d=ImageDraw.Draw(montage)
for i,(name,im) in enumerate([('Native REST',r),('Native HOLD',p),('Native SETTLED',s)]):
    im.thumbnail((460,132));montage.paste(im,(10,i*164+23));d.text((10,i*164+5),name,fill='white')
montage.save(OUT/'native-montage.png')
buffer=io.BytesIO();montage.save(buffer,format='WEBP',quality=78)
print('NATIVE_PREVIEW_BASE64_BEGIN\n'+base64.b64encode(buffer.getvalue()).decode()+'\nNATIVE_PREVIEW_BASE64_END',flush=True)
print('NATIVE_SMOKE_PASS',flush=True)
