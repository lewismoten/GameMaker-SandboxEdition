// Ebenezer's lazy Susan (the PARLOR set; the Clock Room has it): a round oak counter, three
// blocks across, with a spice caddy and a wooden spoon at the hub and the hours painted at
// XII, III, VI and IX by its brass handles. The sign beside it says STIR COUNTER CLOCKWISE,
// so you turn the COUNTER CLOCKWISE: push XII, then III, VI and IX. Each handle is a short
// touch chain on counter 21 (CTR.turns, which reads one more than the quarter turns made):
// the handle for quarter k first takes k turns away, which Game-Maker refuses unless there
// are k already (so a handle pushed out of turn does not budge: the counter is jammed that
// way), then hands back k + 1. XII has nothing to check. A pushed handle lights up and its
// arrow crawls round clockwise. The fourth quarter tips the spoon out of the caddy into Doc
// Leo's hand (counter 20 up, like any spoon) for the latch by the cloves.
// A death starts the room over with every handle back but the turns counted, which only
// makes the counter easier to turn.
import { Pixels } from '../../../kit/pixels';
import { micro } from '../art/draw';
import { c } from '../art/pal';
import { CTR } from '../ids';
import { SOLID, type BlockSet } from './sets';

/** The four handles clockwise from twelve: the cell (in blocks) and where its numeral and arrow go. */
const HANDLES = [
  {
    name: 'susan12',
    cell: [1, 0],
    label: 'XII',
    at: [25, 10],
    arrow: [
      [23, 16],
      [37, 16],
    ],
  },
  {
    name: 'susan3',
    cell: [2, 1],
    label: 'III',
    at: [43, 28],
    arrow: [
      [49, 23],
      [49, 37],
    ],
  },
  {
    name: 'susan6',
    cell: [1, 2],
    label: 'VI',
    at: [27, 44],
    arrow: [
      [37, 51],
      [23, 51],
    ],
  },
  {
    name: 'susan9',
    cell: [0, 1],
    label: 'IX',
    at: [10, 28],
    arrow: [
      [13, 37],
      [13, 23],
    ],
  },
] as const;

const CORNERS = [
  ['susanNW', 0, 0],
  ['susanNE', 2, 0],
  ['susanSW', 0, 2],
  ['susanSE', 2, 2],
  ['susanHub', 1, 1],
] as const;

/** The whole counter, 60x60, on the floor; `lit` handles drawn pushed, their arrows `phase` along. */
function counter(fl: Pixels, lit: number, phase: number): Pixels {
  const p = new Pixels(60, 60);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) p.blit(fl, x * 20, y * 20);
  p.disc(32, 32, 28.5, c('dark', 0));
  p.disc(30, 30, 28.5, c('trim', 1));
  p.disc(30, 30, 27, c('trim', 3));
  p.disc(30, 30, 26, c('wood', 2));
  p.disc(29, 29, 24, c('wood', 3));
  for (const rad of [9, 15, 21]) p.ring(30, 30, rad, c('wood', 2));
  for (let a = 0; a < 10; a++) p.set(14 + a, 12 - Math.round(a * 0.4), c('wood', 4));
  // spice jars between the hours
  const jars = ['accent', 'liquid', 'floor2', 'hazard'];
  [45, 135, 225, 315].forEach((deg, i) => {
    const t = (deg * Math.PI) / 180;
    const x = Math.round(30 + Math.cos(t) * 18) - 2;
    const y = Math.round(30 + Math.sin(t) * 18) - 3;
    p.rect(x, y, 5, 6, c('ink', 0))
      .rect(x + 1, y + 1, 3, 4, c('glass', 3))
      .rect(x + 1, y + 3, 3, 2, c(jars[i], 2))
      .rect(x + 1, y, 3, 1, c('trim', 3));
  });
  // the hub: a brass caddy with the wooden spoon standing in it
  p.disc(30, 31, 6, c('ink', 0)).disc(30, 30, 5, c('trim', 2)).ring(30, 30, 5, c('trim', 4)).disc(30, 30, 3, c('dark', 1));
  p.line(29, 31, 35, 22, c('ink', 0)).line(30, 30, 35, 21, c('paper', 2)).line(31, 30, 36, 21, c('paper', 3));
  p.disc(36, 19, 2.6, c('ink', 0)).disc(36, 19, 2, c('paper', 3)).set(35, 18, c('paper', 4));
  HANDLES.forEach((h, i) => {
    const on = i < lit;
    const cx = h.cell[0] * 20 + 10;
    const cy = h.cell[1] * 20 + 10;
    // the brass peg, out at the rim
    const px = Math.round(30 + (cx - 30) * 1.25);
    const py = Math.round(30 + (cy - 30) * 1.25);
    p.disc(px, py, 2.6, c('ink', 0))
      .disc(px, py, 2, on ? c('hazard', 4) : c('trim', 3))
      .set(px - 1, py - 1, c('paper', 4));
    micro(p, h.at[0], h.at[1], h.label, on ? c('accent', 3) : c('ink', 0));
    if (!on) return;
    // the arrow, clockwise, crawling one pixel a frame
    const [[x0, y0], [x1, y1]] = h.arrow;
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    const s = phase * 2;
    const col = c('hazard', 4);
    p.line(x0 + dx * s, y0 + dy * s, x1, y1, col);
    const tx = x1;
    const ty = y1;
    p.line(tx, ty, tx - dx * 3 - dy * 3, ty - dy * 3 + dx * 3, col).line(tx, ty, tx - dx * 3 + dy * 3, ty - dy * 3 - dx * 3, col);
  });
  return p;
}

const cell = (p: Pixels, x: number, y: number) => p.crop(x * 20, y * 20, 20, 20);

export function addLazySusan(t: BlockSet, fl: Pixels): void {
  const idle = counter(fl, 0, 0);
  for (const [name, x, y] of CORNERS) t.add(name, cell(idle, x, y), { solid: SOLID });
  HANDLES.forEach((h, k) => {
    const [x, y] = h.cell;
    const pic = cell(idle, x, y);
    const lit = [0, 1].map((ph) => cell(counter(fl, k + 1, ph), x, y));
    const on = `${h.name}On`;
    // the chain: check there are k turns (take them), give k + 1 back, (IX: the spoon), lit
    const steps: { effect: number; eamt: number; score?: number }[] = [];
    if (k > 0) steps.push({ effect: CTR.turns, eamt: -k });
    steps.push({ effect: CTR.turns, eamt: k + 1 });
    if (k === 3) steps.push({ effect: CTR.keys, eamt: 1, score: 10 });
    steps.forEach((s, i) => t.add(`${h.name}_${i}`, pic, { solid: SOLID, ...s, touch: i + 1 < steps.length ? `${h.name}_${i + 1}` : on }));
    t.add(on, lit[0], { solid: SOLID, next: `${on}1`, ntime: 5 });
    t.add(`${on}1`, lit[1], { solid: SOLID, next: on, ntime: 5 });
  });
}
