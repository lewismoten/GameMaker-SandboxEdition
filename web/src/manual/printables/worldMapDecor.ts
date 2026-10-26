// The little drawings the World Map's themes (worldMapGround.ts) scatter between places, each
// about 2 units across at (x, y): a star, a table and chairs, a rug, a potted plant, a
// bookshelf, a resistor, a capacitor, a chip, a chrome sphere, a wire cube, a tree and a house
// for town, and a door's swing for the key. Each returns one SVG group.
import { el } from './worldMapArt';
import { PAPER, mix } from './worldMapTerrain';

export type Decor = 'star' | 'table' | 'rug' | 'plant' | 'shelf' | 'resistor' | 'capacitor' | 'chip' | 'sphere' | 'cube' | 'tree' | 'house' | 'door';

const f = (n: number) => +n.toFixed(2);

/** One drawing of `kind` at (x, y), in `ink`; `k` varies its size a little. */
export function decor(kind: Decor, x: number, y: number, ink: string, k = 0): SVGElement {
  const s = 0.85 + (k % 3) * 0.12;
  const g = el('g', { fill: 'none', stroke: ink, 'stroke-width': 0.16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const p = (d: string, fill = 'none', extra: Record<string, string | number> = {}) => g.append(el('path', { d, fill, ...extra }));
  const pale = mix(ink, PAPER, 0.65);
  switch (kind) {
    case 'star': {
      const r = 0.7 * s;
      p(
        `M${f(x)},${f(y - r)} Q${f(x)},${f(y)} ${f(x + r)},${f(y)} Q${f(x)},${f(y)} ${f(x)},${f(y + r)} Q${f(x)},${f(y)} ${f(x - r)},${f(y)} Q${f(x)},${f(y)} ${f(x)},${f(y - r)} z`,
        ink,
        {
          stroke: 'none',
        },
      );
      break;
    }
    case 'table':
      g.append(el('circle', { cx: x, cy: y, r: 0.75 * s, fill: pale }));
      for (const [dx, dy] of [
        [0, -1.25],
        [1.25, 0],
        [0, 1.25],
        [-1.25, 0],
      ])
        g.append(el('rect', { x: f(x + dx * s - 0.3), y: f(y + dy * s - 0.3), width: 0.6, height: 0.6, fill: PAPER }));
      break;
    case 'rug':
      g.append(el('rect', { x: f(x - 1.3 * s), y: f(y - 0.8 * s), width: f(2.6 * s), height: f(1.6 * s), fill: pale }));
      g.append(el('rect', { x: f(x - 0.9 * s), y: f(y - 0.45 * s), width: f(1.8 * s), height: f(0.9 * s) }));
      p(
        `M${f(x - 1.3 * s)},${f(y - 0.8 * s)} h-0.3 M${f(x - 1.3 * s)},${f(y + 0.8 * s)} h-0.3 M${f(x + 1.3 * s)},${f(y - 0.8 * s)} h0.3 M${f(x + 1.3 * s)},${f(y + 0.8 * s)} h0.3`,
      );
      break;
    case 'plant':
      g.append(el('circle', { cx: x, cy: y, r: 0.45 * s, fill: pale }));
      for (let a = 0; a < 5; a++) {
        const t = (a / 5) * Math.PI * 2;
        p(`M${f(x)},${f(y)} q${f(Math.cos(t + 0.5) * 0.6 * s)},${f(Math.sin(t + 0.5) * 0.6 * s)} ${f(Math.cos(t) * 1.1 * s)},${f(Math.sin(t) * 1.1 * s)}`);
      }
      break;
    case 'shelf': {
      const w = 3 * s;
      g.append(el('rect', { x: f(x - w / 2), y: f(y - 0.55), width: f(w), height: 1.1, fill: pale }));
      for (let i = 1; i < 7; i++) p(`M${f(x - w / 2 + (i * w) / 7)},${f(y - 0.55)} v1.1`);
      break;
    }
    case 'resistor':
      p(`M${f(x - 1.5 * s)},${f(y)} h${f(0.6 * s)} M${f(x + 0.9 * s)},${f(y)} h${f(0.6 * s)}`);
      g.append(el('rect', { x: f(x - 0.9 * s), y: f(y - 0.4), width: f(1.8 * s), height: 0.8, rx: 0.3, fill: '#d9c08a', stroke: 'none' }));
      for (const [dx, c] of [
        [-0.45, '#8a3a1a'],
        [0, '#222'],
        [0.45, '#c8962a'],
      ] as const)
        g.append(el('rect', { x: f(x + dx * s - 0.1), y: f(y - 0.4), width: 0.2, height: 0.8, fill: c, stroke: 'none' }));
      break;
    case 'capacitor':
      g.append(el('circle', { cx: x, cy: y, r: 0.8 * s, fill: '#3e5f8a', stroke: ink }));
      p(`M${f(x + 0.35 * s)},${f(y - 0.7 * s)} v${f(1.4 * s)}`, 'none', { stroke: '#cfd8e3' });
      break;
    case 'chip':
      g.append(el('rect', { x: f(x - 1.1 * s), y: f(y - 0.7 * s), width: f(2.2 * s), height: f(1.4 * s), fill: '#20262a', stroke: 'none' }));
      for (let i = 0; i < 4; i++) {
        const px = x - 0.8 * s + i * 0.53 * s;
        p(`M${f(px)},${f(y - 0.7 * s)} v-0.35 M${f(px)},${f(y + 0.7 * s)} v0.35`);
      }
      break;
    case 'sphere':
      g.append(el('circle', { cx: x, cy: y, r: 0.9 * s, fill: mix(ink, PAPER, 0.75) }));
      g.append(el('circle', { cx: f(x - 0.3 * s), cy: f(y - 0.3 * s), r: f(0.28 * s), fill: '#ffffff', stroke: 'none' }));
      p(`M${f(x - 1.3 * s)},${f(y + 1 * s)} h${f(2.6 * s)}`, 'none', { opacity: 0.5 });
      break;
    case 'cube': {
      const a = 0.8 * s;
      p(
        `M${f(x)},${f(y - a)} l${f(a)},${f(a / 2)} v${f(a)} l${f(-a)},${f(a / 2)} l${f(-a)},${f(-a / 2)} v${f(-a)} z M${f(x)},${f(y)} l${f(a)},${f(-a / 2)} M${f(x)},${f(y)} l${f(-a)},${f(-a / 2)} M${f(x)},${f(y)} v${f(a)}`,
      );
      break;
    }
    case 'tree':
      g.append(el('circle', { cx: x, cy: f(y - 0.3 * s), r: f(0.75 * s), fill: mix('#4f7a3a', PAPER, 0.35) }));
      p(`M${f(x)},${f(y + 0.45 * s)} v${f(0.6 * s)}`);
      break;
    case 'house':
      p(
        `M${f(x - 0.9 * s)},${f(y + 0.8 * s)} v${f(-1 * s)} l${f(0.9 * s)},${f(-0.8 * s)} l${f(0.9 * s)},${f(0.8 * s)} v${f(1 * s)} z`,
        mix('#b46a4a', PAPER, 0.45),
      );
      p(`M${f(x - 0.2 * s)},${f(y + 0.8 * s)} v${f(-0.6 * s)} h${f(0.4 * s)} v${f(0.6 * s)}`);
      break;
    case 'door':
      p(`M${f(x - 1)},${f(y)} v-1.8 A1.8,1.8 0 0 1 ${f(x + 0.8)},${f(y)}`, 'none', { 'stroke-dasharray': '0.25 0.2' });
      break;
  }
  return g;
}
