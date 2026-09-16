"""Parse app-layer presentation metrics, NOT refresh rate, UI Hz or MP4 frame count.
Histogram quantiles are bucket estimates, not exact trace durations. No cherry picking.
"""
import math,re,statistics

def layer_stats(text):
    result=[]
    for block in re.split(r'(?m)^layerName = ',text)[1:]:
        name=block.splitlines()[0].strip()
        if 'host.exp.exponent' not in name or 'ExperienceActivity' not in name:continue
        def val(k,default=0):
            m=re.search(r'(?m)^'+re.escape(k)+r' = ([\d.]+)',block)
            return float(m.group(1)) if m else default
        frames=int(val('totalFrames'))
        if frames<2:continue
        m=re.search(r'present2present histogram is as below:\n([^\n]+)',block)
        histogram=[(int(a),int(b))for a,b in re.findall(r'(\d+)ms=(\d+)',m.group(1))] if m else []
        def quantile(q):
            target=math.ceil(sum(n for _,n in histogram)*q);c=0
            for ms,n in histogram:
                c+=n
                if c>=target:return ms
            return None
        result.append(dict(layer=name,frames=frames,fps=val('averageFPS'),
            p50BucketMs=quantile(.5),p95BucketMs=quantile(.95),p99BucketMs=quantile(.99),
            timelineFrames=int(val('totalTimelineFrames')),jankyFrames=int(val('jankyFrames')),
            appBufferStuffing=int(val('appBufferStuffingJankyFrames')),histogram=histogram))
    return result

def summarize(samples):
    groups={}
    for s in samples:
        layers=s['layers']
        # A fragmented layer is reported, not silently replaced with the fastest one.
        if len(layers)!=1:
            s['validForAB']=False;continue
        s['validForAB']=True
        groups.setdefault(s['mode'],[]).append(layers[0]['fps'])
    return {m:dict(n=len(v),medianFPS=statistics.median(v),minFPS=min(v),maxFPS=max(v),values=v)for m,v in groups.items()}
