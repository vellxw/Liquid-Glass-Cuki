"""Runs on a fresh Android emulator. Uiautomator XML, never OCR.
Records genuine native frames and asserts press/release and callback behavior.
No account login, credentials, uploads or changes to product data are involved.
"""
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
    # A visible Text label may precede the actual Switch. Prefer IDs and
    # content descriptions globally, not the first matching text sibling.
    nodes = list(root.iter('node'))
    for key in ['resource-id', 'content-desc', 'text']:
        for n in nodes:
            value = n.get(key, '')
            if (key == 'resource-id' and value.endswith(identifier)) or value == identifier:
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
        # A fresh software-rendered AVD can raise a BACKGROUND Pixel Launcher ANR.
        # Close only that positively identified launcher dialog; never dismiss an
        # Expo/CUKI ANR or runtime error. Retain its screenshot as test evidence.
        launcher_anr = find(root, "Pixel Launcher isn't responding")
        if launcher_anr is not None:
            capture('emulator-launcher-anr')
            close_launcher = find(root, 'android:id/aerr_close')
            if close_launcher is not None:
                tap(close_launcher)
                continue
        # Expo Go opens its developer sheet on first launch; it hides the app
        # accessibility tree. Dismiss ONLY that identified sheet, not error UI.
        if find(root,'Go home') is not None and find(root,'Reload') is not None:
            close=find(root,'Close')
            if close is not None:
                tap(close)
                continue
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
target_box=(x1,y1,x2,y2)
box=(max(0,x1-12),max(0,y1-12),x2+12,y2+18)

# Capture both an EARLY transient and a stable hold. A cold software GPU can stall
# the first animation; a fixed early screenshot must not be labelled FULL PRESS.
# Keep cold-start frames/logs, rather than warm them away or assert FPS from them.
def hold_capture(prefix, early=False):
    hold=sp.Popen(['adb','shell','input','touchscreen','swipe',str(x),str(y),str(x),str(y),'3000'])
    time.sleep(.65)
    if early:
        capture('early-contact')
    time.sleep(1.35)
    image=capture(prefix)
    hold.wait(timeout=8)
    time.sleep(.7)
    return image

def mae(a,b):
    return sum(ImageStat.Stat(ImageChops.difference(a.crop(box),b.crop(box))).mean)/3

def foreground_box(image):
    # Existing label/plus are white; the black-glass rim is excluded. This fixed
    # region/threshold checks uniform compression, NOT material similarity.
    w,h=x2-x1,y2-y1
    roi=(int(w*.16),int(h*.18),int(w*.94),int(h*.84))
    r,g,b=image.crop(target_box).crop(roi).split()
    white=ImageChops.darker(ImageChops.darker(r,g),b).point(lambda v:255 if v>=232 else 0)
    b=white.getbbox()
    assert b is not None and b[2]-b[0]>100, 'Foreground control region is not visible'
    return b

def scale_ratio(rest,pressed):
    a,b=foreground_box(rest),foreground_box(pressed)
    return (b[2]-b[0])/(a[2]-a[0])

record=sp.Popen(['adb','shell','screenrecord','--time-limit','10','/sdcard/liquid-phase-a.mp4'])
time.sleep(.5)
rest=capture('rest')
pressed=hold_capture('pressed',early=True)
settled=capture('settled')
counter(1)
record.wait(timeout=14)
adb('pull','/sdcard/liquid-phase-a.mp4',str(OUT/'native-press.mp4'))

press_mae=mae(rest,pressed)
settle_mae=mae(rest,settled)
normal_ratio=scale_ratio(rest,pressed)
assert .976<=normal_ratio<=.984, f'Full press must reach 0.98 scale, not just change brightness: {normal_ratio}'
assert settle_mae < 1, f'Native rest did not recover: MAE {settle_mae}'

# Repeat after first-use initialization; retain separate UI interval reports in logs.
warm_pressed=hold_capture('warm-pressed')
counter(2)
warm_ratio=scale_ratio(rest,warm_pressed)
assert .976<=warm_ratio<=.984, f'Warm hold geometry: {warm_ratio}'

# Prove physical readability without the optional optical overlay.
optics=find(hierarchy(),'Óptica local del laboratorio')
assert optics is not None, 'Optics switch missing'
tap(optics)
assert find(hierarchy(),'Óptica local del laboratorio').get('checked')=='false'
no_optics=hold_capture('pressed-no-optics')
counter(3)
no_optics_ratio=scale_ratio(rest,no_optics)
assert .976<=no_optics_ratio<=.984, f'Physical press disappeared without optics: {no_optics_ratio}'
tap(find(hierarchy(),'Óptica local del laboratorio'))

# Horizontal escape: no scroll needed to find the counter again.
adb('shell','input','swipe',str(x),str(y),str(rest.width-1),str(y),'500')
time.sleep(.6)
counter(3)

node=find(hierarchy(),'Deshabilitar Registrar')
assert node is not None,'Disabled switch missing'
tap(node)
assert find(hierarchy(),'Deshabilitar Registrar').get('checked') == 'true', 'Disabled switch did not change'
adb('shell','input','tap',str(x),str(y))
time.sleep(.5)
counter(3)
tap(find(hierarchy(),'Deshabilitar Registrar'))

node=find(hierarchy(),'Forzar movimiento reducido')
assert node is not None,'Reduced-motion switch missing'
tap(node)
assert find(hierarchy(),'Forzar movimiento reducido').get('checked') == 'true', 'Reduced switch did not change'
reduced_rest=capture('reduced-rest')
reduced_pressed=hold_capture('reduced-pressed')
root=counter(4)
reduced_ratio=scale_ratio(reduced_rest,reduced_pressed)
assert .994<=reduced_ratio<=1.002 and reduced_ratio>normal_ratio+.01, f'Reduced geometry is not limited: {reduced_ratio}'
reduced_mae=mae(reduced_rest,reduced_pressed)
(OUT/'result.json').write_text(json.dumps({'native':'Android API 35 / Expo Go / software GPU / debug JS',
  'pressROI_MAE':press_mae,'settledROI_MAE':settle_mae,'reducedPressROI_MAE':reduced_mae,
  'foregroundScaleRatio':normal_ratio,'warmForegroundScaleRatio':warm_ratio,
  'noOpticsForegroundScaleRatio':no_optics_ratio,'reducedForegroundScaleRatio':reduced_ratio,
  'normalHoldCommit':True,'warmHoldCommit':True,'noOpticsHoldCommit':True,
  'escapeCancelled':True,'disabledIgnored':True,'reducedCommit':True,
  'physicalHaptics':'not testable in emulator','release60fps':'not measured',
  'inputLatency':'not measured; early-contact and cold-start logs retained',
  'bounds':box},indent=2))
print('NATIVE_RESULT', (OUT/'result.json').read_text(),flush=True)
montage=Image.new('RGB',(480,3*164),'#111719')
d=ImageDraw.Draw(montage)
for i,(name,im) in enumerate([('Native REST',rest.crop(box)),('Native HOLD',pressed.crop(box)),('Native SETTLED',settled.crop(box))]):
    im.thumbnail((460,132));montage.paste(im,(10,i*164+23));d.text((10,i*164+5),name,fill='white')
montage.save(OUT/'native-montage.png')
print('NATIVE_SMOKE_PASS',flush=True)
