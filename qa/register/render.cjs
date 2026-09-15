/** Vector diagnostics ONLY. Does not execute RN, BlurView or platform text. */
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('../load-ts.cjs');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const attr = key => ['viewBox','gradientUnits','gradientTransform','preserveAspectRatio','clipPathUnits'].includes(key)
  ? key : key.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`);
function serialize(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(serialize).join('');
  if (typeof node !== 'object') return escape(node);
  if (typeof node.type === 'function') return serialize(node.type(node.props));
  const { children = [], ...props } = node.props;
  if (node.type === 'fragment') return children.map(serialize).join('');
  if (node.type === 'stop' && props.offset == null) props.offset = 0;
  if (node.type === 'radialGradient' && props.rx != null) {
    // Convert RN-SVG elliptical gradients into standard SVG; focus = center.
    props.gradientTransform = `translate(${props.cx || 0} ${props.cy || 0}) scale(${props.rx} ${props.ry})`;
    props.cx = 0; props.cy = 0; props.r = 1;
    props.fx = 0; props.fy = 0;
    delete props.rx; delete props.ry;
  }
  const attrs = Object.entries(props).filter(([k,v]) => !['key','pointerEvents','style','accessible'].includes(k) && v != null)
    .map(([k,v]) => `${attr(k)}="${escape(v)}"`).join(' ');
  return `<${node.type} ${attrs}>${children.map(serialize).join('')}</${node.type}>`;
}
function expand(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(expand);
  if (typeof node.type === 'function') return expand(node.type(node.props));
  return { type: node.type, props: { ...node.props, children: (node.props.children || []).map(expand) } };
}
function walk(n) { return !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(walk) : [n, ...(n.props?.children || []).flatMap(walk)]; }
function render(root, variant = 'primary') {
  const loader = createLoader();
  const { GlassButton } = loader.load(path.join(root, 'src/home/GlassButton.tsx'));
  const tree = loader.render(GlassButton, { variant, scale: 2, label: variant === 'primary' ? 'Registrar +' : 'Ver rutina' });
  const svgNode = walk(tree).find(n => n.type === 'svg');
  const material = serialize(svgNode);
  const w = variant === 'primary' ? 460 : 297, h = variant === 'primary' ? 122 : 79;
  // Neutral background is explicit, not sampled from the reference. NO native blur emulation.
  const text = `<text x="${variant === 'primary' ? 193 : 71}" y="${variant === 'primary' ? 75 : 49}" font-family="Arial,Arimo,sans-serif" font-size="${variant === 'primary' ? 34 : 26}" fill="#F4F6F8">${variant === 'primary' ? 'Registrar +' : 'Ver rutina'}</text>`;
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 24}" height="${h + 24}" viewBox="-12 -12 ${w + 24} ${h + 24}"><rect x="-12" y="-12" width="${w + 24}" height="${h + 24}" fill="#0B1315"/>${material}${text}</svg>`;
  return { doc, tree, expanded: expand(tree) };
}
if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
  const output = process.argv[3] || path.join(__dirname, 'output/button.svg');
  const variant = process.argv[4] || 'primary';
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, render(root, variant).doc);
  console.log(`Vector diagnostic, NOT a native screenshot: ${output}`);
}
module.exports = { render, serialize, expand, walk };
