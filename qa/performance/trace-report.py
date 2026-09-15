"""Query genuine Perfetto data. Missing instrumentation is reported, never inferred."""
import json
from pathlib import Path
O=Path('qa/liquid/native-output/performance')
try:
 from perfetto.trace_processor import TraceProcessor
 with TraceProcessor(trace=str(O/'cuki.perfetto-trace')) as tp:
  queries={
   'frameTimeline':'''SELECT layer_name,jank_type,present_type,COUNT(*) AS frames,
     AVG(dur)/1e6 AS meanSliceMs, MAX(dur)/1e6 AS maxSliceMs
     FROM actual_frame_timeline_slice
     JOIN process USING(upid)
     WHERE process.name GLOB '*exp.exponent*' AND dur>0
     GROUP BY layer_name,jank_type,present_type''',
   'threadCPU':'''SELECT thread.name,COUNT(*) AS slices,SUM(sched.dur)/1e6 AS cpuMs
     FROM sched JOIN thread USING(utid) JOIN process USING(upid)
     WHERE process.name GLOB '*exp.exponent*' AND sched.dur>0
     GROUP BY thread.name ORDER BY cpuMs DESC LIMIT 15''',
   'renderSlices':'''SELECT slice.name,COUNT(*) AS count,AVG(slice.dur)/1e6 AS meanMs,
      MAX(slice.dur)/1e6 AS maxMs
      FROM slice JOIN thread_track ON slice.track_id=thread_track.id
      JOIN thread USING(utid) JOIN process USING(upid)
      WHERE process.name GLOB '*exp.exponent*' AND slice.dur>0
      AND (slice.name GLOB '*Draw*' OR slice.name GLOB '*draw*' OR slice.name GLOB '*Frame*' OR slice.name GLOB '*swap*')
      GROUP BY slice.name ORDER BY SUM(slice.dur) DESC LIMIT 25'''}
  result={}
  for name,sql in queries.items():
   try:result[name]=[vars(row) for row in tp.query(sql)]
   except Exception as e:result[name]={'error':str(e)}
  (O/'trace-report.json').write_text(json.dumps(result,indent=2))
except Exception as e:
 (O/'trace-report-error.txt').write_text(str(e))
 print('Perfetto report unavailable; raw trace and SurfaceFlinger retained:',e)
