"""Query genuine Perfetto data with a bounded, optional analysis subprocess.
A missing/download-blocked trace processor must not strand device cleanup/video QA.
Missing instrumentation is reported, never inferred from FPS.
"""
import json,os,signal,subprocess,sys
from pathlib import Path
O=Path('qa/liquid/native-output/performance');O.mkdir(parents=True,exist_ok=True)
def analyze():
 try:
  from perfetto.trace_processor import TraceProcessor
  with TraceProcessor(trace=str(O/'cuki.perfetto-trace')) as tp:
   queries={
    'coverage':"SELECT COUNT(*) AS frameTimelineRows FROM actual_frame_timeline_slice",
    'matchingProcesses':"SELECT pid,name,cmdline FROM process WHERE name GLOB '*host.exp.exponent*' OR cmdline GLOB '*host.exp.exponent*'",
    'frameTimeline':'''SELECT layer_name,jank_type,present_type,COUNT(*) AS frames,
      AVG(dur)/1e6 AS meanSliceMs, MAX(dur)/1e6 AS maxSliceMs
      FROM actual_frame_timeline_slice JOIN process USING(upid)
      WHERE (process.name GLOB '*host.exp.exponent*' OR process.cmdline GLOB '*host.exp.exponent*') AND dur>0
      GROUP BY layer_name,jank_type,present_type''',
    'threadCPU':'''SELECT thread.name,COUNT(*) AS slices,SUM(sched.dur)/1e6 AS cpuMs
      FROM sched JOIN thread USING(utid) JOIN process USING(upid)
      WHERE (process.name GLOB '*host.exp.exponent*' OR process.cmdline GLOB '*host.exp.exponent*') AND sched.dur>0
      GROUP BY thread.name ORDER BY cpuMs DESC LIMIT 15''',
    'renderSlices':'''SELECT slice.name,COUNT(*) AS count,AVG(slice.dur)/1e6 AS meanMs,
      MAX(slice.dur)/1e6 AS maxMs FROM slice
      JOIN thread_track ON slice.track_id=thread_track.id
      JOIN thread USING(utid) JOIN process USING(upid)
      WHERE (process.name GLOB '*host.exp.exponent*' OR process.cmdline GLOB '*host.exp.exponent*') AND slice.dur>0
      AND (slice.name GLOB '*Draw*' OR slice.name GLOB '*draw*' OR slice.name GLOB '*Frame*' OR slice.name GLOB '*swap*')
      GROUP BY slice.name ORDER BY SUM(slice.dur) DESC LIMIT 25'''}
   result={}
   for name,sql in queries.items():
    try:result[name]=[vars(row)for row in tp.query(sql)]
    except Exception as e:result[name]={'error':str(e)}
   (O/'trace-report.json').write_text(json.dumps(result,indent=2))
 except Exception as e:
  (O/'trace-report-error.txt').write_text(str(e))
  print('Perfetto analysis unavailable; raw trace and SurfaceFlinger retained:',e,flush=True)
if os.environ.get('CUKI_TRACE_CHILD')=='1':analyze()
else:
 env={**os.environ,'CUKI_TRACE_CHILD':'1'}
 with open(O/'trace-analysis.log','w')as log:
  child=subprocess.Popen([sys.executable,__file__],env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  try:child.wait(timeout=90)
  except subprocess.TimeoutExpired:
   os.killpg(child.pid,signal.SIGKILL);child.wait()
   (O/'trace-report-error.txt').write_text('Trace analysis exceeded 90s; process group stopped. Raw trace retained. No CPU/GPU conclusions inferred.')
