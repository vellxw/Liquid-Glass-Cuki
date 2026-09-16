"""Actual Android/Expo Go smoke. Normal button input; no pressure renderer or animation playback."""
import io,json,re,subprocess as sp,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
O=Path('qa/button/output');O.mkdir(parents=True,exist_ok=True)
def adb(*args): return sp.check_output(['adb',*args],timeout=35)
def tree():
 adb('shell','uiautomator','dump','/sdcard/button.xml')
 data=adb('shell','cat','/sdcard/button.xml');(O/'ui.xml').write_bytes(data)
 return ET.fromstring(data)
def find(root,name):
 for key in ['resource-id','content-desc','text']:
  for n in root.iter('node'):
   v=n.get(key,'')
   if v==name or (key=='resource-id' and v.endswith(name)):return n
 return None
def box(n):return tuple(map(int,re.findall(r'\d+',n.get('bounds'))))
def tap(n):
 a,b,c,d=box(n);adb('shell','input','tap',str((a+c)//2),str((b+d)//2));time.sleep(.4)
def shot(name):
 data=adb('exec-out','screencap','-p');(O/(name+'.png')).write_bytes(data)
 return Image.open(io.BytesIO(data)).convert('RGB')
def count(n):
 node=find(tree(),'demo-count');assert node is not None
 assert node.get('text')==f'Acciones: {n}',node.attrib
for _ in range(55):
 time.sleep(3)
 try:
  root=tree()
 except (sp.SubprocessError, ET.ParseError):
  # Boot/Expo install can temporarily have no accessibility root. Retry startup,
  # never bypass an assertion once the actual demo is available.
  continue
 texts=' '.join(n.get('text','') for n in root.iter('node'))
 if any(error in texts for error in ['Uncaught Error','TypeError:','ReferenceError:','Invariant Violation']):
  shot('runtime-error');raise RuntimeError(texts[:2000])
 if find(root,'Go home') is not None and find(root,'Reload') is not None:
  close=find(root,'Close')
  if close is not None:tap(close)
 if find(root,"Pixel Launcher isn't responding") is not None:
  close=find(root,'android:id/aerr_close')
  if close is not None:shot('launcher-anr');tap(close)
 button=find(root,'demo-register')
 if button is not None:break
 for label in ['Continue','Got it','Open']:
  n=find(root,label)
  if n is not None:tap(n);break
else:
 shot('startup-failed');raise RuntimeError('Button demo did not open')
count(0);a,b,c,d=box(button);x,y=(a+c)//2,(b+d)//2
(O/'bounds.json').write_text(json.dumps({'button':[a,b,c,d],'platform':'Android / Expo Go / API35 / software GPU'}))
adb('shell','settings','put','system','show_touches','0')
rec=sp.Popen(['adb','shell','screenrecord','--time-limit','100','--bit-rate','5000000','/sdcard/button.mp4'])
start=time.monotonic();stages=[]
def stage(name):stages.append({'name':name,'time':time.monotonic()-start})
try:
 time.sleep(.5);rest=shot('rest')
 stage('tap');tap(button);count(1)
 stage('hold');proc=sp.Popen(['adb','shell','input','swipe',str(x),str(y),str(x),str(y),'1600'])
 time.sleep(.7);hold=shot('hold');proc.wait(timeout=10);time.sleep(.3);count(2)
 settled=shot('settled')
 stage('cancel');adb('shell','input','swipe',str(x),str(y),str(c+90),str(y),'800');count(2)
 stage('disabled');tap(find(tree(),'demo-disabled'));tap(button);count(2)
 shot('disabled');tap(find(tree(),'demo-disabled'))
 stage('busy');tap(find(tree(),'demo-busy'));tap(button);count(2)
 shot('busy');tap(find(tree(),'demo-busy'))
 stage('repeat');tap(button);count(3);tap(button);count(4)
 stage('home');tap(find(tree(),'demo-open-home'))
 home=find(tree(),'home-register');assert home is not None
 shot('home-rest');tap(home)
 close=find(tree(),'demo-close');assert close is not None,'Real Home callback did not open panel'
 shot('home-action');tap(close)
 diff=sum(ImageStat.Stat(ImageChops.difference(rest.crop((a,b,c,d)),settled.crop((a,b,c,d)))).mean)/3
 (O/'result.json').write_text(json.dumps({'normalActions':4,'homeAction':True,'holdRepeat':False,'cancelAction':False,'disabledAction':False,'busyAction':False,'restRecoveryMAE':diff,'skiaRuntimePresent':False},indent=2))
 assert diff<.5,'Normal button did not recover'
 print('NORMAL_BUTTON_NATIVE_PASS',flush=True)
finally:
 adb('shell','pkill','-2','screenrecord');rec.wait(timeout=15)
 adb('pull','/sdcard/button.mp4',str(O/'android-button.mp4'))
 (O/'stages.json').write_text(json.dumps(stages,indent=2))
