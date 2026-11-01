// Level 4, Oil's Well (the oil pan: dark umber, amber oil, bronze). The engine's squeaky parts
// are Squeaks, friendly critters of rusty nuts, pacing a five-line staff over Doc Leo's head.
// Z X C V B each squirt the oil can into its own line, bottom to top (the frame that fires a
// drop picks its row; Doc Leo stays put on his step at the right, and the drop flies left). A drop that meets a Squeak oils it: the
// Squeak becomes a calm note that floats down to Doc Leo, and its touch counts it. Ten Squeaks,
// two a line, one quick; then two more waves of quick ones squeak out of the clef end of every
// line (blocks that give birth once, on a timetable). When every note is home, the gate under
// the staff opens. Across the top, a row of lamps counts down to each wave (fuse.ts).
import { kit, AIR, countedDoor, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { fuseBlocks } from './fuse';
import { MapBuilder, at, type Level } from './maps';

/** The staff's lines, bottom (Z) to top (B). */
export const LINES = [6, 5, 4, 3, 2];
export const OIL = { w: 16, floor: 9, step: 13, gate: 2, exit: 1 } as const;
/** Ticks into the level each later wave squeaks out (a quick Squeak on every line). */
export const WAVES = [260, 440];
/** The countdown's lamps across the top row (level x of the first), one span a wave. */
export const FUSE = { x: 4, cells: 8 } as const;
/** Every Squeak there will be: the first ten and the waves. */
export const ALL_SQUEAKS = 10 + WAVES.length * 5;
/** The Squeaks: line, column it starts at, quick or not. */
export const SQUEAKS: { line: number; x: number; fast: boolean }[] = [
  { line: 0, x: 1, fast: false },
  { line: 1, x: 3, fast: false },
  { line: 2, x: 1, fast: false },
  { line: 3, x: 4, fast: false },
  { line: 4, x: 2, fast: false },
  { line: 0, x: 5, fast: true },
  { line: 1, x: 6, fast: true },
  { line: 2, x: 4, fast: true },
  { line: 3, x: 6, fast: true },
  { line: 4, x: 5, fast: true },
];

export function oilBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'engine');
  const { book, c } = k;
  // a line of the staff: a bright amber line across the dark (the lines a Squeak walks)
  const line = k.pic('bay');
  line.rect(0, 9, 20, 2, c('pipe', 3)).rect(0, 9, 20, 1, c('pipe', 4));
  book.add('line', line, AIR);
  // the staff's clef at the left end of the bottom line, the bar line at the right
  const clef = k.pic('line');
  clef.rect(8, 0, 2, 20, c('pipe', 4)).disc(10, 13, 4, c('pipe', 4)).disc(10, 13, 2, c('wall', 1));
  book.add('clef', clef, AIR);
  // Doc Leo's step: where he stands with the oil can
  const step = k.pic('casting.top');
  step.rect(4, 6, 12, 3, c('pipe', 2));
  book.add('step', step, { solid: SOLID });
  // the waves: the line's left end waits, then gives birth to a quick Squeak for one tick
  WAVES.forEach((t, i) => {
    const after = i + 1 < WAVES.length ? `wave${i + 1}` : 'line';
    book.add(`wave${i}`, k.pic('line'), { ...AIR, ntime: t - (i ? WAVES[i - 1] + 1 : 0), next: `wave${i}.go` });
    book.add(`wave${i}.go`, k.pic('line'), { ...AIR, birthMon: MON.squeakFast, birthTime: 1, ntime: 1, next: after });
  });
  // the countdown to the next wave: amber lamps that go out right to left, and an hourglass before them
  fuseBlocks(k, 'fuse', FUSE.cells, [WAVES[0], WAVES[1] - WAVES[0]], (lit) => {
    const p = k.pic('bay.ribs');
    p.rect(2, 5, 16, 10, c('ink', 0)).rect(4, 7, 12, 6, lit ? c('lamp', 4) : c('shade', 1));
    if (lit) p.rect(5, 8, 4, 1, c('paint', 3));
    return p;
  });
  const glass = k.pic('bay.ribs');
  glass.rect(5, 2, 10, 2, c('pipe', 4)).rect(5, 16, 10, 2, c('pipe', 4));
  for (let y = 4; y < 16; y++) {
    const half = Math.max(1, Math.round(Math.abs(y - 10) * 0.7));
    glass.rect(10 - half, y, half * 2, 1, y < 10 ? c('lamp', 1) : c('lamp', 4));
  }
  book.add('hourglass', glass, AIR);
  countedDoor(k, 'gate', 'bay', CTR.oiled, ALL_SQUEAKS, (p) => {
    p.disc(10, 12, 3, c('pipe', 3)).rect(12, 4, 1, 8, c('ink', 0));
  });
  return k;
}

export function oil(book: Kit['book']): Level {
  const { w, floor } = OIL;
  const m = new MapBuilder(book, { '.': 'bay', r: 'bay.ribs', '#': 'casting', '=': 'casting.top', '-': 'line' }, 'casting');
  m.fill(0, 0, w, floor, '.').fill(0, floor, w, 1, '=');
  m.fill(0, 0, w, 1, 'r');
  m.set(FUSE.x - 1, 0, 'hourglass');
  for (let i = 0; i < FUSE.cells; i++) m.set(FUSE.x + i, 0, `fuse${i}`);
  for (const y of LINES) m.fill(1, y, OIL.step - 1, 1, '-').set(1, y, 'wave0');
  m.set(OIL.step - 1, LINES[2], 'clef');
  m.fill(w - 1, 0, 1, floor, '#');
  // Doc Leo's step at the right: he squirts left along the lines. The gate and the way out at the left
  m.set(OIL.step, floor, 'step').set(OIL.step + 1, floor, 'step');
  m.set(OIL.gate, 7, 'gate.top').set(OIL.gate, 8, 'gate');
  m.link(OIL.exit, 8);
  for (const s of SQUEAKS) m.mon(s.fast ? MON.squeakFast : MON.squeak, s.x, LINES[s.line]);
  m.mon(MON.reggie, 4, 8);
  // he starts mid-screen (the view, which never scrolls, is centered on where he starts) and drops to the floor
  return { m, start: at(8, 5), size: [w, 10] };
}
