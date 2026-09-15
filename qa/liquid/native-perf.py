"""An additional identical native drag AFTER screenrecord has stopped.
This isolates recorder overhead, not hardware-phone performance. No video is synthesized.
"""
import subprocess as sp
from pathlib import Path
out=Path('qa/liquid/native-output')
def adb(*a):return sp.check_output(['adb',*a],timeout=30)
adb('shell','dumpsys','SurfaceFlinger','--timestats','-clear','-enable')
adb('push',str(out/'C2-drag-performance-input.csv'),'/data/local/tmp/local-input.csv')
(out/'unrecorded-injected.log').write_bytes(adb('shell','CLASSPATH=/data/local/tmp/local-input.jar',
  'app_process','/system/bin','InjectPath','/data/local/tmp/local-input.csv'))
(out/'surfaceflinger-unrecorded.txt').write_bytes(adb('shell','dumpsys','SurfaceFlinger','--timestats','-dump'))
print('Unrecorded presentation benchmark saved; not a phone/release FPS claim.',flush=True)
