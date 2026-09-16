import { Skia, TileMode, FilterMode, MipmapMode, type SkImage, type SkRuntimeEffect } from '@shopify/react-native-skia';
import { VOLUME } from './volumeField';

/** One invisible GPU preparation pass per native cache revision, never a user
 * gesture or per-frame readback. Exercise real texture sampling and the contact
 * branch before reporting ready; drawing a zero-pressure pixel alone cannot prove
 * that the expensive branch/textures are prepared. Unsupported offscreen contexts
 * retain the normal rendering path. This does not certify first-touch latency.
 */
export function prepareOpticalPipeline(effect:SkRuntimeEffect|null,empty:SkRuntimeEffect|null,
  material:SkImage,backdrop:SkImage|null,width:number,height:number,
  protectedCircle?:readonly [number,number,number]):boolean {
  if(!effect||!empty)return false;
  const surface=Skia.Surface.MakeOffscreen(material.width(),material.height());
  if(!surface)return false;
  const imageShader=(image:SkImage)=>image.makeShaderOptions(TileMode.Clamp,TileMode.Clamp,
    FilterMode.Linear,MipmapMode.None,Skia.Matrix().scale(width/image.width(),height/image.height()));
  const children=[imageShader(material),backdrop?imageShader(backdrop):empty.makeShader([])];
  const values:Record<string,number[]>={
    protectedCircle:protectedCircle?[...protectedCircle]:[0,0,0],size:[width,height],
    touch:[width*.55,height*.4],pressure:[1],depth:[VOLUME.depth],radius:[VOLUME.radius],
    lighting:[1],proof:[backdrop?2:0],debug:[0],
  };
  const uniforms=Array<number>(effect.getUniformFloatCount()).fill(0);
  for(let i=0;i<effect.getUniformCount();i++){
    const descriptor=effect.getUniform(i),v=values[effect.getUniformName(i)];
    if(!v)throw new Error('Missing optical warmup uniform');
    v.forEach((value,j)=>{uniforms[descriptor.slot+j]=value;});
  }
  const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));
  canvas.scale(material.width()/width,material.height()/height);
  const paint=Skia.Paint();paint.setShader(effect.makeShaderWithChildren(uniforms,children));
  canvas.drawRect(Skia.XYWHRect(0,0,width,height),paint);surface.flush();
  // Complete the preparation now, not on the user's first interaction.
  const output=surface.makeImageSnapshot();
  return output.readPixels(0,0,{...output.getImageInfo(),width:1,height:1})!==null;
}
