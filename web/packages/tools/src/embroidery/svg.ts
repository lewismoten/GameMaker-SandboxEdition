// The vector source of a design as an SVG, in millimeters (y flipped to the page's downward y): fills as filled
// shapes, satin columns and running lines as strokes of their width, in the thread colors and sewing order.
import type { Design, Pt, RGB } from './types';

const hex = (c: RGB) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const num = (v: number) => (Math.round(v * 100) / 100).toString();
const d = (pts: Pt[], closed: boolean) => `M${pts.map((p) => `${num(p[0])} ${num(-p[1])}`).join('L')}${closed ? 'Z' : ''}`;

/** The SVG text of the design, `margin` mm of backing around a square of `size` mm. */
export function designSvg(design: Design, size: number, backing: RGB = [214, 208, 196]): string {
  const h = size / 2;
  const body = design.blocks.map((b) => {
    const c = hex(b.thread.rgb);
    const parts = b.items.map((it) => {
      if (it.kind === 'fill') return `<path d="${it.polys.map((p) => d(p, true)).join('')}" fill="${c}" fill-rule="evenodd"/>`;
      const w = it.kind === 'satin' ? it.width : 0.4;
      return `<path d="${d(it.path, !!it.closed)}" fill="none" stroke="${c}" stroke-width="${num(w)}" stroke-linejoin="round" stroke-linecap="butt"/>`;
    });
    return `<g id="${b.thread.name.replace(/\W+/g, '-')}">\n${parts.join('\n')}\n</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" viewBox="${-h} ${-h} ${size} ${size}">
<title>${design.name}</title>
<rect x="${-h}" y="${-h}" width="${size}" height="${size}" fill="${hex(backing)}"/>
${body.join('\n')}
</svg>
`;
}
