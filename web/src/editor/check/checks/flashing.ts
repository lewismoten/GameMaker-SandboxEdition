// The level check's flashing: animated blocks that swap between a light and a dark picture faster
// than three flashes a second over a quarter of the screen or more, the limit the W3C sets for
// flashing that can bring on seizures (WCAG 2.3.1, NOTICE.md). Every copy of a block animates on
// one clock, so a field of them flashes together.
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import { luminance, type SceneData } from '../sceneData';
import { blockCycle } from './blockChecks';

/** Ticks between changes at three flashes a second (a flash is a change and back: six changes). */
const FAST_TICKS = Math.floor(18.2 / 6);
/** A change of light this big is a flash (WCAG's general flash threshold). */
const FLASH = 0.1;
/** A quarter of the 16 × 10 screen. */
const AREA = 40;

const meanLight = (d: SceneData, n: number) => {
  let sum = 0;
  let count = 0;
  for (const p of d.bbl[n].pixels)
    if (p !== 255) {
      sum += luminance(d.palette, p);
      count++;
    }
  return count ? sum / count : 0;
};

/** The most cells of `set` in any one screen (16 × 10 blocks), and where. */
function mostOnScreen(d: SceneData, set: Set<number>): { count: number; cell: number } {
  const has = (x: number, y: number) => (set.has(d.map.blocks[(y % MWID) * MLEN + (x % MLEN)]) ? 1 : 0);
  let best = { count: 0, cell: 0 };
  for (let y = 0; y < MWID; y++) {
    // a running count along the row of 16 × 10 windows
    const col = new Array<number>(MLEN + 16).fill(0);
    for (let x = 0; x < MLEN + 16; x++) for (let dy = 0; dy < 10; dy++) col[x] += has(x, y + dy);
    let run = 0;
    for (let x = 0; x < MLEN + 16; x++) {
      run += col[x] - (x >= 16 ? col[x - 16] : 0);
      if (x >= 15 && run > best.count) best = { count: run, cell: y * MLEN + ((x - 15) % MLEN) };
    }
  }
  return best;
}

export function flashing(d: SceneData): Finding[] {
  const out: Finding[] = [];
  const done = new Set<number>();
  const used = new Set(d.map.blocks);
  for (const n of used) {
    if (done.has(n)) continue;
    const cycle = blockCycle(d.bbl, n);
    if (cycle.length < 2) continue;
    cycle.forEach((c) => done.add(c.n));
    // a fast change between pictures of very different light
    const fast = cycle.some((c, i) => {
      const next = cycle[(i + 1) % cycle.length];
      const a = meanLight(d, c.n);
      const b = meanLight(d, next.n);
      return c.ticks <= FAST_TICKS && Math.abs(a - b) >= FLASH && Math.min(a, b) < 0.8;
    });
    if (!fast) continue;
    const where = mostOnScreen(d, new Set(cycle.map((c) => c.n)));
    if (where.count < AREA) continue;
    const per = (18.2 / (cycle.reduce((t, c) => t + c.ticks, 0) / (cycle.length / 2))).toFixed(1);
    out.push({
      check: 'flashing',
      severity: 'warning',
      title: `Block ${n} flashes light and dark about ${per} times a second over ${where.count} blocks of one screen, from ${at(where.cell)}`,
      detail: `More than three flashes a second over a quarter of the screen (${AREA} of its 160 blocks) can bring on seizures in some players. Slow the animation to ${FAST_TICKS + 1} ticks or more a picture, bring its pictures’ light closer together, or use it over a smaller area.`,
      where: { scene: d.scene, map: d.names.map, cell: where.cell, block: { file: d.names.bbl ?? '', n } },
    });
  }
  return out;
}
