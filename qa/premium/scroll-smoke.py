"""Actual Home on a short viewport: touch on Registrar must yield to native scroll.
Run after home-smoke.py. No test-only scroll callbacks or animations replace the app.
"""
import json,re,subprocess as sp,time,xml.etree.ElementTree as ET
from pathlib import Path
O=Path('qa/liquid/native-output');O.mkdir(parents=True,exist_ok=True)
def adb(*a):return sp.check_output(['adb',*a],timeout=35)
def tree():
 adb('shell','uiautomator','dump','/sdcard/premium-scroll.xml')
 text=adb('shell','cat','/sdcard/premium-scroll.xml').decode()
 (O/'premium-scroll.xml').write_text(text)
 return ET.fromstring(text)
def find(root,name):
 for key in ['resource-id','content-desc','text']:
  for node in root.iter('node'):
   value=node.get(key,'')
   if value==name or (key=='resource-id' and value.endswith(name)):return node
 return None
def box(node):
 assert node is not None,'Expected a native node, not a guessed touch target'
 return tuple(map(int,re.findall(r'\d+',node.get('bounds'))))
def snap(name):(O/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
def tap(node):
 a,b,c,d=box(node);adb('shell','input','tap',str((a+c)//2),str((b+d)//2));time.sleep(.8)
result={'viewport':[720,1200],'density':280,'scrollStartsOnRegistrar':True}
rec=None
try:
 adb('shell','wm','size','720x1200');time.sleep(1.8)
 root=tree();start=box(find(root,'home-register'));dock=box(find(root,'home-nav-dock'))
 a,b,c,d=start;x=(a+c)//2;y=(b+d)//2
 assert d<dock[1],(start,dock,'Button is not fully visible in the short viewport')
 snap('short-home-rest')
 rec=sp.Popen(['adb','shell','screenrecord','--time-limit','60','--bit-rate','6000000','/sdcard/premium-scroll.mp4'])
 time.sleep(.5)
 # A real native vertical gesture beginning inside the button, not on the page background.
 adb('shell','input','swipe',str(x),str(y),str(x+2),str(y-180),'1100');time.sleep(1.3)
 root=tree();after=box(find(root,'home-register'));dock_after=box(find(root,'home-nav-dock'))
 snap('short-home-scrolled')
 assert find(root,'demo-close') is None,'Vertical scroll incorrectly activated Registrar'
 assert after[1]<start[1]-35,('Scroll did not move the real Home',start,after)
 assert dock_after==dock,('Navigation dock moved',dock,dock_after)
 result.update(before=start,after=after,dock=dock,cancelDidNotCommit=True)
 # The same control remains functional at its new native location after scrolling.
 tap(find(root,'home-register'))
 close=find(tree(),'demo-close');assert close is not None,'Registrar stopped working after scroll'
 snap('short-home-action');tap(close)
 result['actionAfterScroll']=True
finally:
 if rec:
  adb('shell','pkill','-2','screenrecord');rec.wait(timeout=10)
  adb('pull','/sdcard/premium-scroll.mp4',str(O/'native-short-home-scroll.mp4'))
 (O/'short-home-result.json').write_text(json.dumps(result,indent=2))
 adb('shell','wm','size','720x1600');time.sleep(.8)
print('PREMIUM_NATIVE_SCROLL_PASS',json.dumps(result),flush=True)
