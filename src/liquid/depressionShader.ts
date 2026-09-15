/** A stationary negative Gaussian height field. No time uniform, ripple, global
 * transform or painted touch disk. The same height/gradient drives refraction,
 * normal-dependent reflection and occlusion. Coordinates are dp, not texture px. */
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

float rimDistance(float2 p) {
  float r=size.y*.5;
  return r-length(p-float2(clamp(p.x,r,size.x-r),r));
}
float pinned(float2 p) { return smoothstep(2.4,9.4,rimDistance(p)); }
float heightAt(float2 p) {
  float2 d=p-touch;
  // Microscopic, bounded anisotropy. The maximum stays exactly at touch.
  float2 stretch=1.0+min(abs(velocity)/1600.0,float2(1.0))*.025;
  float q=length(d/stretch)/radius;
  float influence=exp(-q*q)*(1.0-smoothstep(1.35,1.85,q));
  return -depth*pressure*influence*pinned(p);
}
half4 main(float2 p) {
  half4 original=material.eval(p);
  if(pressure==0.0) return original;
  float distanceToTouch=length(p-touch);
  float pin=pinned(p);
  if(pin==0.0 || distanceToTouch>radius*1.90) return original;

  const float e=.35;
  float z=heightAt(p);
  float2 g=float2(heightAt(p+float2(e,0))-heightAt(p-float2(e,0)),
                  heightAt(p+float2(0,e))-heightAt(p-float2(0,e)))/(2.0*e);
  float3 normal=normalize(float3(-g,1.0));
  // A concave lens samples outward around its center. True coordinate displacement
  // of the runtime material texture, not a moving highlight drawn over static pixels.
  float2 offset=(g*refraction+float2(0.0,z*.4))*pin;
  offset*=min(1.0,3.6/max(.0001,length(offset)));
  half4 refracted=material.eval(clamp(p+offset,float2(.5),size-float2(.5)));
  float alpha=max(float(refracted.a),.0001);
  float3 rgb=float3(refracted.rgb)/alpha;

  float2 d=(p-touch)/radius;
  float support=exp(-dot(d,d))*(1.0-smoothstep(1.35,1.85,length(d)))*pin;
  float amount=clamp(abs(pressure),0.0,1.0);
  // Difference from the flat normal: exactly zero added lighting in REST.
  float3 lightA=normalize(float3(-.22,-.32,1.0));
  float3 lightB=normalize(float3(.28,.20,1.0));
  float specA=pow(max(0.0,dot(normal,lightA)),120.0)-pow(lightA.z,120.0);
  float specB=pow(max(0.0,dot(normal,lightB)),150.0)-pow(lightB.z,150.0);
  float diffuse=dot(normal,normalize(float3(-.45,-.65,1.0)))-.7845;
  // Paired shade/highlight makes the inward-facing slopes readable. Very low AO;
  // removing reflection alone must not remove the coordinate displacement.
  rgb*=1.0-.045*support*amount;
  rgb+=support*(float3(.67,.85,.93)*specA*.35 + float3(.92,.81,.68)*specB*.18 + diffuse*.16);
  if(debug>0.5){
    float ring=1.0-smoothstep(.5,1.1,abs(distanceToTouch-radius));
    rgb=mix(rgb,float3(.32,.92,.65),ring*.7);
  }
  return half4(half3(clamp(rgb,0.0,1.0)*alpha),refracted.a);
}
`;
