"""Same-process, interleaved native A/B + diagnostics + 3-minute endurance.
No screenrecord during timed trials. The original native gesture injector is reused.
This is reproducible emulator evidence, never represented as a physical-device result.
"""
import io,json,math,os,re,statistics,subprocess as sp,time,xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
from metrics import layer_stats,summarize
O=Path('qa/liquid/native-output/performance');O.mkdir(parents=True,exist_ok=True)

def adb(*a,timeout=40):return sp.check_output(['adb',*a],timeout=timeout)
def tree():
    adb('shell','uiautomator','dump','/sdcard/perf.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/perf.xml').decode())
def find(root,name):
    for k in ['resource-id','content-desc','text']:
        for n in root.iter('node'):
            v=n.get(k,'')
            if v==name or (k=='resource-id' and v.endswith(name)):return n
    raise RuntimeError('Missing native control '+name)
def bounds(n):return tuple(map(int,re.findall(r'\d+',n.get('bounds',''))))
def tap(n):
    a,b,c,d=bounds(n);adb('shell','input','tap',str((a+c)//2),str((b+d)//2));time.sleep(.25)
def select(mode):
    tap(find(tree(),'perf-select-'+mode));time.sleep(.25)
    assert find(tree(),'perf-mode').get('text')=='Modo: '+mode

def snap(name):
    raw=adb('exec-out','screencap','-p');(O/(name+'.png')).write_bytes(raw)
    return Image.open(io.BytesIO(raw)).convert('RGB')
def status(name):
    for key,args in {'memory':['dumpsys','meminfo','host.exp.exponent'],
                     'thermal':['dumpsys','thermalservice'],'battery':['dumpsys','battery']}.items():
        (O/f'{name}-{key}.txt').write_bytes(adb('shell',*args))

tap(find(tree(),'lab-open-perf'))
for _ in range(30):
    t=tree()
    if find(t,'perf-ready').get('text')=='Motor: listo':break
    time.sleep(.2)
else:raise RuntimeError('Benchmark material not ready')
box=bounds(find(tree(),'perf-register'));a,b,c,d=box;w=c-a;h=d-b
(O/'environment.json').write_text(json.dumps({'button':box,'size':adb('shell','wm','size').decode(),
 'density':adb('shell','wm','density').decode(),'release':adb('shell','getprop','ro.build.version.release').decode(),
 'fingerprint':adb('shell','getprop','ro.build.fingerprint').decode(),
 'recording':False,'JS':'production in Expo Go; NOT standalone release APK'},indent=2))

def events(duration=5600,stationary=False,cancel=False):
    out=[];n=max(2,round(duration/16.667))
    for i in range(n+1):
        t=i/n
        u=.53 if stationary else .18+.64*(1-abs(2*(t%1)-1))
        x=a+w*u;y=b+h*.42
        out.append((round(t*duration),0 if i==0 else 2,x,y))
    out.append((duration+1,1,c+40 if cancel else out[-1][2],out[-1][3]))
    if cancel:out.insert(-1,(duration,2,c+40,b+h*.42))
    return out

def inject(name,data,shot=None):
    file=O/(name+'.csv');file.write_text('\n'.join(','.join(str(round(v,3))for v in e)for e in data)+'\n')
    adb('push',str(file),'/data/local/tmp/local-input.csv')
    with open(O/(name+'-input.log'),'w')as log:
        p=sp.Popen(['adb','shell','CLASSPATH=/data/local/tmp/local-input.jar','app_process','/system/bin','InjectPath','/data/local/tmp/local-input.csv'],stdout=log)
        image=None
        if shot:time.sleep(.9);image=snap(shot)
        p.wait(timeout=data[-1][0]/1000+15);assert p.returncode==0
    return image

def trial(mode,index,duration=5600):
    select(mode)
    # Compile/warm each distinct GPU path separately; the native functional movie keeps first tap.
    inject(f'warm-{index}',events(250,cancel=True));time.sleep(.35)
    adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
    t0=time.monotonic();inject(f'trial-{index}-{mode}',events(duration))
    raw=adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump').decode()
    (O/f'trial-{index}-{mode}-sf.txt').write_text(raw)
    return dict(mode=mode,index=index,elapsed=time.monotonic()-t0,layers=layer_stats(raw))

samples=[];status('before')
# ABBA-like interleaving, five repetitions per full-quality candidate in final runs.
repetitions=int(os.environ.get('CUKI_BENCH_REPEATS','5'))
for i in range(repetitions):
    order=['baseline','optimized','frame-coalesced','shader-only']
    if i%2:order.reverse()
    for mode in order:
        samples.append(trial(mode,len(samples)))
        (O/'samples.json').write_text(json.dumps(samples,indent=2))
        print('BENCH',mode,samples[-1]['layers'],flush=True)
# One pass each: diagnostic, not statistically claimed as a full A/B win.
for mode in ['no-blur','no-lighting','no-content','identity']:
    samples.append(trial(mode,len(samples)))

# Identical native pixels at stable states: same instance, no whole-screen score.
images={}
for mode in ['baseline','optimized','frame-coalesced','shader-only']:
    select(mode);time.sleep(.3);images[mode+'-rest']=snap(mode+'-rest')
    images[mode+'-hold']=inject(mode+'-hold',events(1700,stationary=True),mode+'-hold')
    time.sleep(.3)
def mae(x,y):return sum(ImageStat.Stat(ImageChops.difference(x.crop(box),y.crop(box))).mean)/3
visual={mode:{state:mae(images['baseline-'+state],images[mode+'-'+state])for state in ['rest','hold']}
        for mode in ['optimized','frame-coalesced','shader-only']}
(O/'visual.json').write_text(json.dumps(visual,indent=2))

# Keep input normal and optics full-quality while checking long-running behavior.
select('optimized');status('endurance-start')
endurance=[]
for i in range(6):
    adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
    # 30 seconds of repeated native contacts, one stable pointer sequence at a time.
    data=[]
    for j in range(5):data.extend([(t+j*6000,act,x,y)for t,act,x,y in events(5500)])
    inject(f'endurance-{i}',data)
    raw=adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump').decode()
    (O/f'endurance-{i}-sf.txt').write_text(raw)
    endurance.append({'block':i,'layers':layer_stats(raw)})
    status('endurance-'+str(i))
# Quiet intervals are NOT interpreted as FPS. We check frame counts/work while still.
for mode in ['rest','hold']:
    adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
    if mode=='hold':inject('steady-hold',events(5000,stationary=True))
    else:time.sleep(5)
    (O/f'idle-{mode}.txt').write_bytes(adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump'))

# Real system trace, separate from primary uninstrumented measurements.
config='''buffers { size_kb: 32768 fill_policy: RING_BUFFER }
duration_ms: 9000
data_sources { config { name: "linux.ftrace" ftrace_config {
 ftrace_events: "sched/sched_switch" ftrace_events: "sched/sched_waking"
 atrace_categories: "gfx" atrace_categories: "view" atrace_categories: "input"
 atrace_categories: "wm" atrace_categories: "am" atrace_apps: "host.exp.exponent"
} } }
data_sources { config { name: "linux.process_stats" process_stats_config { scan_all_processes_on_start: true } } }
data_sources { config { name: "android.surfaceflinger.frametimeline" } }
'''
try:
    f=O/'trace-config.pbtxt';f.write_text(config);adb('push',str(f),'/data/local/tmp/cuki-perf.pbtxt')
    trace=sp.Popen(['adb','shell','perfetto','--txt','-c','-','-o','/data/misc/perfetto-traces/cuki.perfetto-trace'],stdin=sp.PIPE)
    trace.stdin.write(config.encode());trace.stdin.close()
    time.sleep(.8);inject('profiled-drag',events(6000));trace.wait(timeout=15);assert trace.returncode==0,'Perfetto did not start'
    adb('pull','/data/misc/perfetto-traces/cuki.perfetto-trace',str(O/'cuki.perfetto-trace'))
except Exception as e:(O/'trace-error.txt').write_text(str(e))
status('after')
summary={'samples':samples,'summary':summarize(samples),'visual':visual,'endurance':endurance,
 'method':'same-process interleaved native gestures; SurfaceFlinger app-layer FPS and histogram bucket quantiles',
 'limits':['emulator software GPU, not device certification','no physical touch-to-photon or haptics measurement',
           'diagnostics single trial; primary candidates five trials','thermal sensors may not be meaningful in emulator']}
(O/'summary.json').write_text(json.dumps(summary,indent=2));print('SUMMARY',json.dumps(summary['summary']),flush=True)
assert all(v['rest']<=.05 and v['hold']<=.25 for v in visual.values()),'Performance change altered approved pixels'
tap(find(tree(),'perf-back'))
