"""Additional native smoke in the actual, unchanged Home, not a scaled mockup."""
import io,json,re,subprocess as sp,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
O=Path('qa/liquid/native-output')
def adb(*a):return sp.check_output(['adb',*a],timeout=35)
def tree():
 adb('shell','uiautomator','dump','/sdcard/home.xml')
 return ET.fromstring(adb('shell','cat','/sdcard/home.xml').decode())
def find(root,name):
 for key in ['resource-id','content-desc','text']:
  for n in root.iter('node'):
   v=n.get(key,'')
   if v==name or (key=='resource-id' and v.endswith(name)):return n
 return None
def box(n):return tuple(map(int,re.findall(r'\d+',n.get('bounds'))))
def tap(n):
 a,b,c,d=box(n);adb('shell','input','tap',str((a+c)//2),str((b+d)//2));time.sleep(.7)
def snap(name):
 b=adb('exec-out','screencap','-p');(O/f'{name}.png').write_bytes(b);return Image.open(io.BytesIO(b)).convert('RGB')
n=find(tree(),'lab-open-home');assert n is not None,'Missing Home launch control';tap(n);time.sleep(1.5)
n=find(tree(),'home-register');assert n is not None,'Real Home did not render'
a,b,c,d=box(n);w=c-a;h=d-b
(O/'home-bounds.json').write_text(json.dumps({'button':[a,b,c,d]}))
def point(u,v):return (a+w*u,b+h*v)
rec=sp.Popen(['adb','shell','screenrecord','--time-limit','70','--bit-rate','6000000','/sdcard/volume-home.mp4'])
t0=time.monotonic();stages=[];time.sleep(.7);rest=snap('home-rest')
def inject(name,points,duration,hold=0,shot=None):
 events=[(0,0,*points[0])]
 events += [(hold+round(duration*i/max(1,len(points)-1)),2,*p) for i,p in enumerate(points)]
 events += [(hold+duration+180,1,*points[-1])]
 p=O/(name+'.csv');p.write_text('\n'.join(','.join(map(str,e))for e in events)+'\n')
 adb('push',str(p),'/data/local/tmp/local-input.csv')
 stages.append({'name':name,'start':time.monotonic()-t0,'durationMs':events[-1][0]})
 with open(O/(name+'.log'),'w')as log:
  proc=sp.Popen(['adb','shell','CLASSPATH=/data/local/tmp/local-input.jar','app_process','/system/bin','InjectPath','/data/local/tmp/local-input.csv'],stdout=log)
  if shot:time.sleep(.9);snap(shot)
  proc.wait(timeout=15);assert proc.returncode==0
 time.sleep(.5)
try:
 # Hold and continuous horizontal drag; exit cancels so no modal obscures release.
 pts=[point(.3+.45*i/100,.42)for i in range(101)]+[(c+55,b+h*.42)]
 inject('Home-hold-drag-cancel',pts,2400,1300,'home-hold')
 assert find(tree(),'demo-close') is None,'Cancellation incorrectly opened action panel'
 settled=snap('home-cancelled')
 inject('Home-tap',[point(.55,.4)]*2,120)
 n=find(tree(),'demo-close');assert n is not None,'Registrar did not activate its real Home callback'
 snap('home-action-panel');tap(n)
 inject('Home-hold-release',[point(.7,.48)]*2,1500,0,'home-right-hold')
 n=find(tree(),'demo-close');assert n is not None;tap(n);snap('home-final')
 diff=sum(ImageStat.Stat(ImageChops.difference(rest.crop((a,b,c,d)),settled.crop((a,b,c,d)))).mean)/3
 (O/'home-result.json').write_text(json.dumps({'cancelDidNotCommit':True,'successfulHomeActions':2,'restAfterCancelMAE':diff}))
 assert diff<.5,'Home did not return to rest after cancel'
finally:
 adb('shell','pkill','-2','screenrecord');rec.wait(timeout=10)
 adb('pull','/sdcard/volume-home.mp4',str(O/'native-home-actions.mp4'))
 (O/'home-stages.json').write_text(json.dumps(stages,indent=2))
