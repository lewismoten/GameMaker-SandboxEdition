// Final Curtain's paper spyglass: a magnifying glass drawn in black ink (a knurled rim, an
// engraved handle with its maker's mark, a moon and star), with a round hole where the lens
// goes. On paper you cut it out and tape red cellophane behind the hole. On screen the same
// drawing is the red film: `spyglassElement()` is what the box viewer drags over the evidence
// sheet (RedFilm takes it in place of the plain rectangle), its lens the same red view the
// hint book's circle uses (redFilm.ts ensureRedView, .rf-lens in paper.css).
import { ensureRedView } from './redFilm';

const NS = 'http://www.w3.org/2000/svg';
const INK = '#141414';
const PAPER = '#f3ead2';

/** The drawing's size and where its lens is. */
const GLASS = { w: 200, h: 340, cx: 100, cy: 100, hole: 78 };

/** The cut line: round the rim, down the handle and back. */
const OUTLINE = 'M70,199.6A104,104 0 1,1 130,199.6L134,320Q134,338 116,338L84,338Q66,338 66,320Z';

function el(tag: string, attrs: Record<string, string | number>, ...kids: Node[]): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  e.append(...kids);
  return e;
}

/** The ring around the lens as an even-odd path (outer circle minus the hole). */
const ring = (r1: number, r2: number): string =>
  `M${GLASS.cx - r1},${GLASS.cy}a${r1},${r1} 0 1,0 ${2 * r1},0a${r1},${r1} 0 1,0 ${-2 * r1},0M${GLASS.cx - r2},${GLASS.cy}a${r2},${r2} 0 1,0 ${2 * r2},0a${r2},${r2} 0 1,0 ${-2 * r2},0`;

/** The handle's outline: a little narrower at the collar, rounder at the end. */
const HANDLE = 'M82,196L118,196L124,318Q124,330 112,330L88,330Q76,330 76,318Z';

/** A five-point star centered at (x, y). */
function star(x: number, y: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    const d = i % 2 ? r * 0.42 : r;
    return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
}

/**
 * The spyglass in black ink. With `cut`, the paper's version: a dashed line to cut along and
 * another round the lens hole; without it, the cut-out as it lies on the desk, its card filled.
 */
export function spyglassSvg(cut: boolean): SVGSVGElement {
  const g = GLASS;
  const svg = el('svg', {
    viewBox: `0 0 ${g.w} ${g.h}`,
    class: cut ? 'sg-art sg-cut' : 'sg-art',
    role: 'img',
    'aria-label': 'A paper spyglass drawn in black ink, its lens a round hole',
  }) as SVGSVGElement;
  const line = (attrs: Record<string, string | number>) => el('path', { fill: 'none', stroke: INK, 'stroke-linecap': 'round', ...attrs });
  const word = (s: string, y: number, size: number) =>
    el(
      'text',
      { x: 100, y, 'font-size': size, 'text-anchor': 'middle', fill: INK, 'font-family': 'Georgia, serif', 'letter-spacing': 0.4 },
      document.createTextNode(s),
    );
  if (cut) {
    svg.append(
      el('path', { d: OUTLINE, fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }),
      el('circle', { cx: g.cx, cy: g.cy, r: g.hole, fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }),
      el('text', { x: 4, y: 20, 'font-size': 14, fill: INK, 'font-family': 'serif' }, document.createTextNode('✂')),
    );
  } else {
    svg.append(el('path', { d: ring(94, g.hole), fill: PAPER, 'fill-rule': 'evenodd' }));
  }
  // handle: outline, collar, grip hatching, engraved lines, maker's mark
  svg.append(el('path', { d: HANDLE, fill: cut ? 'none' : PAPER, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  svg.append(line({ d: 'M77,196h46M76,206h48', 'stroke-width': 2.2 }), line({ d: 'M79,212h42', 'stroke-width': 1 }));
  const hatch: string[] = [];
  for (let y = 286; y < 322; y += 5) hatch.push(`M${84 - (y - 286) * 0.05},${y}l32,-8`, `M${84 - (y - 286) * 0.05},${y - 8}l32,8`);
  svg.append(line({ d: hatch.join(''), 'stroke-width': 0.9, opacity: 0.8 }));
  svg.append(line({ d: 'M93,216V268M107,216V268', 'stroke-width': 1.2 }), line({ d: 'M97,216V268M103,216V268', 'stroke-width': 0.6 }));
  svg.append(line({ d: 'M82,276h36', 'stroke-width': 1 }));
  svg.append(el('rect', { x: 86, y: 224, width: 28, height: 46, rx: 14, fill: cut ? 'none' : PAPER, stroke: INK, 'stroke-width': 1.2 }));
  svg.append(word('P.E.O.', 238, 7.5), word('CO.', 246, 6.5), word('No. 36', 264, 6.5), el('path', { d: star(100, 254, 2.6), fill: INK }));
  // knurled rim: two edges, a ring each side of the ticks, rivets at the quarters
  svg.append(el('path', { d: ring(94, g.hole), fill: 'none', stroke: INK, 'stroke-width': 3.2, 'fill-rule': 'evenodd' }));
  svg.append(el('circle', { cx: g.cx, cy: g.cy, r: 88.5, fill: 'none', stroke: INK, 'stroke-width': 0.9 }));
  svg.append(el('circle', { cx: g.cx, cy: g.cy, r: 83.5, fill: 'none', stroke: INK, 'stroke-width': 0.9 }));
  const ticks: string[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI) / 36;
    const p = (r: number) => `${(g.cx + Math.cos(a) * r).toFixed(1)},${(g.cy + Math.sin(a) * r).toFixed(1)}`;
    ticks.push(`M${p(84.5)}L${p(87.7)}`);
  }
  svg.append(line({ d: ticks.join(''), 'stroke-width': 1 }));
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])
    svg.append(el('circle', { cx: g.cx + dx * 91, cy: g.cy + dy * 91, r: 2.4, fill: INK }));
  return svg;
}

/** The glass on screen: the drawing over a round red lens that shows the sheet as red film would. */
export function spyglassElement(): HTMLElement {
  ensureRedView();
  const box = document.createElement('div');
  box.className = 'sg-glass';
  box.hidden = true;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', 'Spyglass with a red film lens (drag it over the evidence sheet)');
  const lens = document.createElement('div');
  lens.className = 'sg-lens';
  box.append(lens, spyglassSvg(false));
  return box;
}
