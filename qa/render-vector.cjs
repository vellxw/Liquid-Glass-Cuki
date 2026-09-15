/**
 * Serializes the SAME material/icon JSX into standalone SVG for geometry review.
 * It does not render native BlurView, CoreText, Android text or native compositing.
 * No browser, HTML, canvas or reference-image pixels are used to produce this SVG.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./load-ts.cjs');
const loader = createLoader();
const root = path.resolve(__dirname, '..');
const { GlassMaterial } = loader.load(path.join(root, 'src/bottom-nav/GlassMaterial.tsx'));
const { GlassIcon } = loader.load(path.join(root, 'src/bottom-nav/GlassIcons.tsx'));
const { DESIGN, REFERENCE, TABS, ICON_BOXES, COLORS } = loader.load(path.join(root, 'src/bottom-nav/tokens.ts'));
const selected = process.argv[2] || 'hoy';
const output = process.argv[3] || path.join(__dirname, 'output', `vector-${selected}.svg`);
if (!TABS.some(tab => tab.id === selected)) throw new Error('Invalid selected tab.');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const attribute = key => ['viewBox', 'gradientUnits', 'gradientTransform', 'preserveAspectRatio'].includes(key)
  ? key : key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
function svg(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (Array.isArray(node)) return node.map(svg).join('');
  if (typeof node.type === 'function') return svg(node.type(node.props));
  const { children = [], ...props } = node.props;
  if (node.type === 'fragment') return children.map(svg).join('');
  if (node.type === 'radialGradient' && props.rx !== undefined) {
    // RN-SVG's rx/ry API -> equivalent standards-compliant elliptical gradient.
    props.gradientTransform = `${props.gradientTransform || ''} translate(${props.cx || 0} ${props.cy || 0}) scale(${props.rx} ${props.ry})`;
    props.cx = 0; props.cy = 0; props.r = 1;
    delete props.rx; delete props.ry;
  }
  const attrs = Object.entries(props)
    .filter(([key, value]) => !['key', 'accessible', 'pointerEvents', 'style'].includes(key) && value !== undefined)
    .map(([key, value]) => `${attribute(key)}="${escape(value)}"`).join(' ');
  return `<${node.type} ${attrs}>${children.map(svg).join('')}</${node.type}>`;
}
const material = svg(GlassMaterial({ width: DESIGN.width, height: DESIGN.height, activeTab: selected }));
const icons = TABS.map(tab => {
  const box = ICON_BOXES[tab.id];
  const color = tab.id === selected || tab.id === 'registrar' ? COLORS.whiteIcon : COLORS.inactiveIcon;
  return `<g transform="translate(${box.x} ${box.y})">${svg(GlassIcon({ name: tab.id, color, width: box.width, height: box.height }))}</g>`;
}).join('');
const labels = TABS.map(tab => {
  const size = tab.id === 'hoy' ? 58 : DESIGN.label.fontSize;
  const color = tab.id === selected ? COLORS.activeText : COLORS.inactiveText;
  return `<text x="${tab.center}" y="${DESIGN.label.baseline}" text-anchor="middle" font-family="Arial,Arimo,sans-serif" font-size="${size}" fill="${color}">${tab.label}</text>`;
}).join('');
const document = `<svg xmlns="http://www.w3.org/2000/svg" width="${REFERENCE.width}" height="${REFERENCE.height}" viewBox="0 0 ${REFERENCE.width} ${REFERENCE.height}"><rect width="100%" height="100%" fill="#000000"/><g transform="translate(${REFERENCE.barX} ${REFERENCE.barY})">${material}${icons}${labels}</g></svg>`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, document);
console.log(`Vector-only review (not a native screenshot): ${output}`);
