/** One persistent rendering path in REST, CONTACT, HOLD and RELEASE.
 * No bitmap-view switching, no wave/time uniform and no global shape transform.
 * A negative local height is added to a resting bevel. The same differential drives
 * geometry projection, texture refraction and lighting against the original normal.
 */
export const VOLUME_SKSL = `
uniform shader material;
uniform shader substrate;
uniform float2 size;
uniform float2 touch;
uniform float pressure;
uniform float depth;
uniform float radius;
uniform float lighting;
uniform float proof;
uniform float debug;

float spec(float3 n,float3 h){
  float v=max(0.0,dot(n,h));float v2=v*v;float v4=v2*v2;float v8=v4*v4;
  float v16=v8*v8; float v32=v16*v16; return v32*v32; // environmental lobe, exponent 64
}
half4 over(half4 a,half4 b){return a+b*(1.0-a.a);}
half4 resting(float2 p){
  half4 m=material.eval(p);
  return proof==1.0?over(m,substrate.eval(p)):m;
}
half4 main(float2 p){
  if(pressure==0.0) return resting(p);
  float rr=size.y*.5;
  float2 ev=p-float2(clamp(p.x,rr,size.x-rr),rr);
  float el=length(ev),edge=rr-el;
  // The silhouette/outermost rim are the SAME pixels in every interaction state.
  if(edge<=2.4) return resting(p);
  float2 d=p-touch;
  float q=dot(d,d)/(radius*radius);
  if(q>=2.25) return resting(p);

  float a=max(0.0,1.0-q),b=max(0.0,1.0-q/2.25);
  float k=.65*a*a*a+.35*b*b*b;
  float dk=(-1.95*a*a-1.05*b*b/2.25)*2.0/(radius*radius);
  float u=clamp((edge-2.4)/5.6,0.0,1.0);
  float pin=u*u*(3.0-2.0*u),dpin=6.0*u*(1.0-u)/5.6;
  float2 en=-ev/max(.0001,el);
  float z=-depth*pressure*k*pin;
  float2 grad=-depth*pressure*(dk*d*pin+k*dpin*en);

  // Surface in REST has a rounded shoulder. Evaluate change against this normal,
  // rather than pretending every point of the approved bevel was a flat sheet.
  float v=clamp(edge/10.0,0.0,1.0);
  float2 baseGrad=2.8*6.0*v*(1.0-v)/10.0*en;
  float3 n0=normalize(float3(-baseGrad,1.0));
  float3 n=normalize(float3(-(baseGrad+grad),1.0));
  // Inward height shifts the inner face in perspective. Slopes refract independently.
  float2 shift=(grad*9.5+float2(0.0,z*.78))*pin;
  shift*=3.4/sqrt(3.4*3.4+dot(shift,shift));
  float2 sampleAt=clamp(p+shift,float2(.5),size-float2(.5));
  half4 face=material.eval(sampleAt);
  // Preserve alpha/coverage: no opaque pressure disk, no changed outer silhouette.
  float alpha=max(float(face.a),.0001);
  float3 rgb=float3(face.rgb)/alpha;
  float3 cold=normalize(float3(-.06,-.15,1.0));
  float3 warm=normalize(float3(.24,.18,1.0));
  float coldDelta=spec(n,cold)-spec(n0,cold);
  float warmDelta=spec(n,warm)-spec(n0,warm);
  float slopeDelta=dot(n,float3(-.34,-.48,.808))-dot(n0,float3(-.34,-.48,.808));
  float support=k*pin;
  // Signed redistribution of reflection, with very weak center AO. No isolated circle.
  rgb+=lighting*(float3(.65,.82,.92)*coldDelta*.50+float3(.89,.80,.68)*warmDelta*.12+slopeDelta*.16)*pin;
  rgb*=1.0-lighting*.035*abs(pressure)*support;
  if(debug>.5){
    float mark=1.0-smoothstep(.35,.85,abs(length(d)-radius));
    rgb=mix(rgb,float3(.3,.85,.65),mark*.7);
  }
  half4 deformed=half4(half3(clamp(rgb,0.0,1.0)*alpha),face.a);
  // Controlled underlay is a distinct layer genuinely sampled through the lens.
  if(proof==1.0) return over(deformed,substrate.eval(sampleAt));
  if(proof==2.0){
    // Native underlay is a captured layout-time source. Apply only its refracted
    // color difference so REST and the native blur's baseline remain unchanged.
    half3 delta=substrate.eval(sampleAt).rgb-substrate.eval(p).rgb;
    deformed.rgb=clamp(deformed.rgb+delta*(1.0-deformed.a),half3(0.0),half3(deformed.a));
  }
  return deformed;
}
`;
/** Only a transparent fallback. A real controlled underlay is passed as ImageShader. */
export const EMPTY_SUBSTRATE_SKSL = `half4 main(float2 p){return half4(0.0);}`;
