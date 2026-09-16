import { PREMIUM_PRESS as P } from './premiumPress.tokens';
/** A frame-anchored face, not a dark contact disk. At full pressure the ORIGINAL
 * inner border travels 2.5dp downward/1.5dp upward at the contact column. Those
 * distances are constraints of the mapping, not nominal strengths attenuated
 * by pin/radial masks. Native baseline stays underneath; REST is exact alpha zero. */
export const VOLUME_SKSL = `
uniform shader material;
uniform shader substrate;
uniform float2 size;
uniform float2 touch;
uniform float3 protectedCircle;
uniform float pressure;
uniform float depth;
uniform float radius;
uniform float lighting;
uniform float contentTravel;
uniform float proof;
uniform float debug;

half4 over(half4 a,half4 b){return a+b*(1.0-a.a);}
half4 opticalDifference(half3 before,half3 after){
  float3 b=clamp(float3(before),0.0,1.0),d=clamp(float3(after),0.0,1.0)-b;
  float3 room=mix(b,float3(1.0)-b,step(float3(0.0),d));
  float3 coverage=abs(d)/max(room,float3(.00001));
  float alpha=clamp(max(coverage.r,max(coverage.g,coverage.b)),0.0,1.0);
  if(alpha<=.000001)return half4(0.0);
  return half4(half3(clamp(alpha*b+d,float3(0.0),float3(alpha))),half(alpha));
}
float hermite(float x,float x0,float x1,float y0,float y1,float m0,float m1){
  float len=max(.0001,x1-x0),t=clamp((x-x0)/len,0.0,1.0),t2=t*t,t3=t2*t;
  return (2.0*t3-3.0*t2+1.0)*y0+(t3-2.0*t2+t)*len*m0+(-2.0*t3+3.0*t2)*y1+(t3-t2)*len*m1;
}
half4 main(float2 p){
  if(pressure==0.0) return half4(0.0);
  // A rigid insert translation uses the same cached vector pixels with no scale,
  // mesh warp or repeated native SVG redraw. The old position is replaced, not
  // overdrawn as a second circle. The native text uses this SAME travel scalar.
  float insertDistance=length(p-protectedCircle.xy)-protectedCircle.z;
  float movedDistance=length(p-(protectedCircle.xy+float2(0.0,contentTravel)))-protectedCircle.z;
  if(contentTravel>0.0 && min(insertDistance,movedDistance)<2.5){
    half4 background=substrate.eval(p);
    half4 before=over(material.eval(p),background);
    half4 after=over(material.eval(p-float2(0.0,contentTravel)),background);
    float coverage=1.0-smoothstep(.5,2.5,min(insertDistance,movedDistance));
    return opticalDifference(before.rgb,after.rgb)*half(coverage);
  }
  float2 d=p-touch;
  float q=abs(d.x)/(radius*1.5);
  if(q>=1.0) return half4(0.0);
  float rr=size.y*.5,ex=p.x-clamp(p.x,rr,size.x-rr);
  float inset=size.y*${P.innerBevelDesignInset}/122.0;
  if(abs(ex)>=rr-inset-1.0)return half4(0.0);
  float outer=rr-sqrt(max(0.0,rr*rr-ex*ex));
  float lo=outer+${P.pinStart},hi=size.y-outer-${P.pinStart};
  if(p.y<=lo||p.y>=hi)return half4(0.0);
  float a=rr-sqrt(max(.01,(rr-inset)*(rr-inset)-ex*ex)),b=size.y-a;
  if(a<=lo)return half4(0.0);
  float envelope=1.0-smoothstep(0.0,1.0,q);
  float weight=envelope*clamp(pressure,0.0,1.0)*clamp(depth/${P.depth},0.0,1.0)*smoothstep(16.0,28.0,b-a);
  if(weight==0.0)return half4(0.0);
  float bias=clamp((touch.y/size.y-.5)*2.0,-1.0,1.0);
  float at=a+min(${P.faceTopTravel}*(1.0-.15*bias)*weight,(a-lo)*1.65);
  float bt=b-min(${P.faceBottomTravel}*(1.0+.15*bias)*weight,(a-lo)*1.65);
  float slope=(b-a)/max(1.0,bt-at);
  float sampleY=p.y<at?hermite(p.y,lo,at,lo,a,1.0,slope)
    :p.y>bt?hermite(p.y,bt,hi,b,hi,slope,1.0):a+(p.y-at)*slope;
  float2 sampleAt=float2(p.x,sampleY);
  // The complete moving insert remains rigid; this guard also includes the
  // source sampling footprint. It does NOT attenuate the upper/lower face rim.
  float insertMask=protectedCircle.z>0.0?smoothstep(${P.maxRefraction+P.contentTravel+1},${P.maxRefraction+P.contentTravel+2.3},insertDistance):1.0;
  if(insertMask==0.0)return half4(0.0);
  half4 face=material.eval(sampleAt);
  float alpha=max(float(face.a),.0001);
  float3 rgb=float3(face.rgb)/alpha;
  // A CONTACT SHADOW confined to the exposed upper shoulder. It is a consequence
  // of the frame/face separation, never a uniform dim or a circular overlay.
  float shoulder=smoothstep(lo,at,p.y)*(1.0-smoothstep(at+1.0,at+6.0,p.y));
  float lower=(1.0-smoothstep(bt-4.0,bt,p.y))*smoothstep(bt-8.0,bt-4.0,p.y);
  rgb*=clamp(1.0+lighting*weight*(-.16*shoulder+.035*lower),.80,1.05);
  if(debug>.5){float mark=1.0-smoothstep(.3,.8,abs(abs(d.x)-radius));rgb=mix(rgb,float3(.3,.85,.65),mark*.7);}
  half4 deformed=half4(half3(clamp(rgb,0.0,1.0)*alpha),face.a);
  half4 background=substrate.eval(p);
  half4 before=over(material.eval(p),background),after=over(deformed,background);
  if(proof>0.0){half3 delta=substrate.eval(sampleAt).rgb-substrate.eval(p).rgb;after.rgb+=delta*(1.0-deformed.a);}
  return opticalDifference(before.rgb,after.rgb)*half(insertMask);
}
`;
export const EMPTY_SUBSTRATE_SKSL=`half4 main(float2 p){return half4(0.0);}`;
