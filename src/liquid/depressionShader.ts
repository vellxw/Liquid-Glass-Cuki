/** Stationary negative height field; analytic gradient, no time/wave uniform.
 * Material coordinates really move. Native text/icon/rim do not become a rigid tap.
 */
export const DEPRESSION_SKSL = `
uniform shader material;
uniform float2 size;
uniform float2 touch;
uniform float2 velocity;
uniform float pressure;
uniform float radius;
uniform float depth;
uniform float refraction;
uniform float debug;

half4 main(float2 p) {
  if(pressure==0.0) return material.eval(p);
  float r=size.y*.5;
  float2 edgeVector=p-float2(clamp(p.x,r,size.x-r),r);
  float edgeLength=length(edgeVector);
  float edge=r-edgeLength;
  float2 d=p-touch;
  float distanceToTouch=length(d);
  // The outer rim is an unchanged native-vector sibling, never resampled.
  if(edge<=2.4) return half4(0.0);
  if(distanceToTouch>radius*1.90) return material.eval(p);

  // Analytic product derivative, instead of 5 expensive height evaluations.
  float2 stretch=1.0+min(abs(velocity)/1600.0,float2(1.0))*.025;
  float2 normalized=d/(radius*stretch);
  float q=length(normalized);
  float t=clamp((q-1.35)/.50,0.0,1.0);
  float cutoff=1.0-t*t*(3.0-2.0*t);
  float dc=-12.0*t*(1.0-t);
  float exponential=exp(-q*q);
  float influence=exponential*cutoff;
  float2 dq=d/(radius*radius*stretch*stretch*max(.0001,q));
  float2 df=exponential*(dc-2.0*q*cutoff)*dq;

  float u=clamp((edge-2.4)/7.0,0.0,1.0);
  float pin=u*u*(3.0-2.0*u);
  float2 gradPin=6.0*u*(1.0-u)/7.0*(-edgeVector/max(.0001,edgeLength));
  float z=-depth*pressure*influence*pin;
  float2 gradient=-depth*pressure*(df*pin+influence*gradPin);
  float3 normal=normalize(float3(-gradient,1.0));
  float2 offset=(gradient*refraction+float2(0.0,z*.4))*pin;
  offset*=min(1.0,3.6/max(.0001,length(offset)));
  // Only one bilinear texture lookup per fragment. Never warp the letters.
  half4 refracted=material.eval(clamp(p+offset,float2(.5),size-float2(.5)));
  float alpha=max(float(refracted.a),.0001);
  float3 rgb=float3(refracted.rgb)/alpha;
  float support=influence*pin;
  float amount=clamp(abs(pressure),0.0,1.0);
  // A near-normal environment lobe reveals small INWARD slopes. Difference from
  // the original flat normal, not an added permanent highlight or dark disk.
  float3 lightA=normalize(float3(-.09,-.12,1.0));
  float3 lightB=normalize(float3(.08,.065,1.0));
  float specA=pow(max(0.0,dot(normal,lightA)),120.0)-pow(lightA.z,120.0);
  float specB=pow(max(0.0,dot(normal,lightB)),150.0)-pow(lightB.z,150.0);
  float diffuse=dot(normal,normalize(float3(-.45,-.65,1.0)))-.7845;
  rgb*=1.0-.025*support*amount;
  rgb+=support*(float3(.67,.85,.93)*specA*.30 + float3(.92,.81,.68)*specB*.12 + diffuse*.16);
  if(debug>0.5){
    float ring=1.0-smoothstep(.5,1.1,abs(distanceToTouch-radius));
    rgb=mix(rgb,float3(.32,.92,.65),ring*.7);
  }
  return half4(half3(clamp(rgb,0.0,1.0)*alpha),refracted.a);
}
`;
