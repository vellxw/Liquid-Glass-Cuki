"""Run the SAME native input and acceptance protocol against the standalone app.
Only package/activity names and environment labels change. The exact adapted scripts
are retained as evidence; no thresholds or result values are modified.
"""
import sys,types
from pathlib import Path
ROOT=Path.cwd();OUT=ROOT/'qa/liquid/native-output';OUT.mkdir(parents=True,exist_ok=True)
ADAPTED=OUT/'executed-release-protocol';ADAPTED.mkdir(exist_ok=True)
def adapt(text):
 return (text.replace('host.exp.exponent','com.vellxw.liquidglasscuki')
  .replace('ExperienceActivity','MainActivity')
  .replace('production in Expo Go; NOT standalone release APK','standalone release APK / emulator x86_64 / test signing')
  .replace('Production JS in Expo Go/API35','Standalone release APK/API35')
  .replace('Expo Go / production JavaScript','Standalone release APK'))
# The metrics library is reused with the appropriate layer selector, not a different metric.
module=types.ModuleType('metrics');text=adapt((ROOT/'qa/performance/metrics.py').read_text())
(ADAPTED/'metrics.py').write_text(text);exec(compile(text,'release/metrics.py','exec'),module.__dict__)
sys.modules['metrics']=module
for file in ['qa/liquid/android-smoke.py','qa/liquid/native-perf.py','qa/face/validate.py','qa/performance/run.py',
             'qa/liquid/home-smoke.py','qa/performance/trace-report.py',
             'qa/liquid/validate-locality.py','qa/liquid/strict-rest.py','qa/premium/scroll-smoke.py']:
 text=adapt((ROOT/file).read_text());(ADAPTED/Path(file).name).write_text(text)
 print('RELEASE_PROTOCOL',file,flush=True)
 exec(compile(text,'release/'+file,'exec'),{'__name__':'__main__','__file__':str(ADAPTED/Path(file).name)})
