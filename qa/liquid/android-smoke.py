"""Runs on a fresh Android emulator. Uiautomator XML, never OCR.
Records genuine native frames and asserts press/release and callback behavior.
No account login, credentials, uploads or changes to product data are involved.
"""
import io
import math
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


for attempt in range(30):
    root=hierarchy()
    n=find(root,'lab-ready')
    if n is not None and n.get('text')=='Motor: listo':break
    time.sleep(.4)
else:
    capture('texture-not-ready')
    raise RuntimeError('Native material texture never became ready')
root=counter(0)
ready=find(root,'lab-register')
x1,y1,x2,y2=bounds(ready);w=x2-x1;h=y2-y1
x,y=center(ready);box=(x1,y1,x2,y2)
(OUT/'bounds.json').write_text(json.dumps({'button':box,'logicalScale':'Home viewport / 375; no enlarged laboratory button','device':adb('shell','wm','size').decode(),'density':adb('shell','wm','density').decode()}))

def point(u,v):return (x1+u*w,y1+v*h)
def mae(a,b):return sum(ImageStat.Stat(ImageChops.difference(a.crop(box),b.crop(box))).mean)/3

def path_events(points,duration,hold_start=0,hold_end=0):
    # Native pointer id/downTime are unchanged throughout all moves.
    events=[(0,0,*points[0])]
    for i,p in enumerate(points):events.append((hold_start+round(duration*i/max(1,len(points)-1)),2,*p))
    end=hold_start+duration+hold_end
    events.append((end,1,*points[-1]))
    return events

def linear(a,b,n=121):return [(a[0]+(b[0]-a[0])*i/(n-1),a[1]+(b[1]-a[1])*i/(n-1)) for i in range(n)]

def run_path(name,events,shots=None):
    f=OUT/f'{name}-input.csv';f.write_text('\n'.join(','.join(str(round(v,3)) if isinstance(v,float) else str(v) for v in e)for e in events)+'\n')
    adb('push',str(f),'/data/local/tmp/local-input.csv')
    stages.append({'name':name,'start':time.monotonic()-video_origin,'durationMs':events[-1][0]})
    proc=sp.Popen(['adb','shell','CLASSPATH=/data/local/tmp/local-input.jar','app_process','/system/bin','InjectPath','/data/local/tmp/local-input.csv'],stdout=open(OUT/f'{name}-injected.log','w'))
    t=time.monotonic();result={}
    for at,label in shots or []:
        time.sleep(max(0,at-(time.monotonic()-t)))
        result[label]=capture(label)
    proc.wait(timeout=max(10,events[-1][0]/1000+5))
    assert proc.returncode==0, f'Input injection failed: {name}'
    time.sleep(.6)
    return result

def switch(label):
    n=find(hierarchy(),label);assert n is not None,label;tap(n);time.sleep(.65)

# Compare the same button rectangle with its original native SVG before recording.
switch('Referencia estática');time.sleep(1.5)
assert find(hierarchy(),'lab-register') is None,'Static baseline still contains the interaction renderer'
original=capture('original-svg-rest')
switch('Referencia estática');time.sleep(.5)
# Persistent renderer is already visible in REST. No discarded warmup contact.

# Android damage-based screenrecord contains actual native frames, not a synthesized tween.
adb('shell','settings','put','system','show_touches','0')
adb('shell','dumpsys','gfxinfo','host.exp.exponent','reset')
adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
record=sp.Popen(['adb','shell','screenrecord','--bit-rate','6000000','--time-limit','180','/sdcard/local-glass.mp4'])
video_origin=time.monotonic();stages=[]
time.sleep(.8)
rest=capture('rest')
run_path('A-quick-tap',path_events([point(.52,.38)]*2,90));counter(1)
shots=run_path('B-hold-1-second',path_events([point(.50,.38)]*2,3300),[(.8,'hold-1'),(1.9,'hold-2')])
pressed=shots['hold-1'];stable=mae(pressed,shots['hold-2']);counter(2)
settled=capture('settled')
shots=run_path('C-horizontal-drag',path_events(linear(point(.16,.40),point(.84,.40)),2800,1000,1100),[(.7,'drag-left'),(4.5,'drag-right')]);counter(3)
# Pure native presented-frame stats for an uninterrupted repeated drag (no screencaps during it).
adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
run_path('C2-drag-performance',path_events(linear(point(.18,.42),point(.82,.42),181)+linear(point(.82,.42),point(.18,.42),181),5600))
(OUT/'surfaceflinger-drag.txt').write_bytes(adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump'))
counter(4)
radx=min(w*.045,h*.14);rady=radx
circle=[(x+w*.04+radx*math.cos(i/180*2*math.pi),y-h*.10+rady*math.sin(i/180*2*math.pi))for i in range(181)]
run_path('D-small-circle',path_events(circle,3000,400,400));counter(5)
run_path('E-short-vertical',path_events(linear(point(.62,.30),point(.62,.70))+linear(point(.62,.70),point(.62,.30)),2400,300,400));counter(6)
run_path('F-cancel-outside',path_events(linear(point(.76,.50),(x2+80,y)),1500,200,300));counter(6)
cancelled=capture('cancelled')
# Refraction proof uses a diagnostic grid in the sampled native material, not letters.
switch('Cuadrícula de refracción');grid_rest=capture('grid-rest')
proof=run_path('G-refraction-grid',path_events(linear(point(.42,.50),point(.77,.50)),2400,1700,1300),[(1.0,'grid-left'),(4.6,'grid-right')]);counter(7)
switch('Cuadrícula de refracción')
# Definitive ablation: with local deformation OFF, nothing shrinks/moves/dims.
switch('Deformación local');off_rest=capture('off-rest')
off=run_path('H-deformation-OFF',path_events([point(.55,.5)]*2,2400),[(1.2,'off-hold')]);counter(8)
switch('Deformación local')
run_path('I-repeat-quick-tap',path_events([point(.44,.34)]*2,130));counter(9)
run_path('J-repeat-quick-tap',path_events([point(.72,.45)]*2,150));counter(10)
final=capture('final-rest')
switch('Acompañamiento del contenido')
switch('Iluminación de contacto');geometry_rest=capture('geometry-rest')
geometry=run_path('K-geometry-without-lighting',path_events([point(.55,.45)]*2,2300),[(1.1,'geometry-hold')]);counter(11)
switch('Iluminación de contacto')
run_path('L-material-alone-drag',path_events(linear(point(.2,.4),point(.8,.4)),2200,300,300));counter(12)
switch('Acompañamiento del contenido')
switch('Forzar movimiento reducido')
run_path('M-reduced-motion',path_events([point(.55,.45)]*2,1100));counter(13)
switch('Forzar movimiento reducido')
switch('Deshabilitar Registrar')
run_path('N-disabled',path_events([point(.55,.45)]*2,400));counter(13)
switch('Deshabilitar Registrar')

# Finish recording without waiting for its upper limit.
adb('shell','pkill','-2','screenrecord');record.wait(timeout=10)
adb('pull','/sdcard/local-glass.mp4',str(OUT/'native-all-actions.mp4'))
(OUT/'stages.json').write_text(json.dumps(stages,indent=2))
(OUT/'surfaceflinger-full.txt').write_bytes(adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump'))

# Report measured differences even if an acceptance assertion fails.
result={'native':'Expo Go / production JavaScript / Android API35 / software GPU', 'button':box,
 'restToHoldMAE':mae(rest,pressed),'hold1toHold2MAE':stable,'restToSettledMAE':mae(rest,settled),
 'leftToRightMAE':mae(shots['drag-left'],shots['drag-right']),
 'gridRestToHoldMAE':mae(grid_rest,proof['grid-left']),
 'localOffRestToHoldMAE':mae(off_rest,off['off-hold']),
 'cancelRestMAE':mae(rest,cancelled),'finalRestMAE':mae(rest,final),'commits':13,
 'originalRestMAE':mae(original,rest),'geometryOnlyMAE':mae(geometry_rest,geometry['geometry-hold']),
 'warmup':'none: first contact is recorded; renderer already draws in REST',
 'pointerInput':'continuous Android MotionEvent stream; no playback animation',
 'haptics':'physical sensation not testable on emulator', 'iOS':'not executed'}
(OUT/'result.json').write_text(json.dumps(result,indent=2));print('LOCAL_RESULT',json.dumps(result),flush=True)
assert result['originalRestMAE']<4.0,'Persistent renderer changed approved native resting state'
assert result['geometryOnlyMAE']>.15,'Pressure is only a lighting change'
assert result['restToHoldMAE']>.7,'No visible local pressure response'
assert result['leftToRightMAE']>.08,'Material did not follow the horizontal drag'
assert stable<.4,'HOLD continues changing after reaching full pressure'
assert result['restToSettledMAE']<.5,'REST did not recover exactly'
assert result['localOffRestToHoldMAE']<.5,'A rigid/fade interaction survives local ablation'
print('LOCAL_NATIVE_DRAG_PASS',flush=True)
