import type { ReactNode, ReactElement } from 'react';
import { Defs, G, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

// The approved SVG remains the single source of geometry, color and reflection.
// This adapter serializes ONLY those known primitives; no DOM/WebView or native view capture.
const names = new Map<unknown, string>([
  [Defs,'defs'],[G,'g'],[LinearGradient,'linearGradient'],[RadialGradient,'radialGradient'],
  [Rect,'rect'],[Stop,'stop'],
]);
const camel = new Set(['gradientUnits','gradientTransform','viewBox','preserveAspectRatio']);
const escape = (v: unknown) => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
export function materialXml(node: ReactNode): string {
  if(node == null || typeof node === 'boolean') return '';
  if(Array.isArray(node)) return node.map(materialXml).join('');
  if(typeof node !== 'object' || !('props' in node)) throw new Error('Unsupported material node');
  const element=node as ReactElement<Record<string,unknown>>;
  const tag=names.get(element.type);
  if(!tag) throw new Error('Unsupported material primitive');
  const {children,...p}=element.props;
  if(tag==='radialGradient' && p.rx!=null){
    // RN-SVG elliptical radii -> standard SVG affine radial gradient.
    p.gradientTransform=`translate(${p.cx ?? 0} ${p.cy ?? 0}) scale(${p.rx} ${p.ry})`;
    p.cx=0;p.cy=0;p.fx=0;p.fy=0;p.r=1;delete p.rx;delete p.ry;
  }
  if(tag==='stop' && p.offset==null)p.offset=0;
  const attrs=Object.entries(p).filter(([k,v])=>k!=='key' && v!=null)
    .map(([k,v])=>`${camel.has(k)?k:k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())}="${escape(v)}"`).join(' ');
  return `<${tag} ${attrs}>${materialXml(children as ReactNode)}</${tag}>`;
}
