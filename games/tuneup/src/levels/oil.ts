// Level 4, Oil's Well (the oil pan: dark umber, amber oil, bronze). The engine's squeaky parts
// are Squeaks, friendly critters of rusty nuts, pacing a five-line staff over Doc Leo's head.
// It's a treble clef staff in 4/4, so each line is a note, and the key for a line is its note's
// letter: E G B D F, bottom to top (each line's letter is at its right end). Each squirts the
// oil can into its own line (the frame that fires a drop picks its row; Doc Leo stays put on his
// step at the right, and the drop flies left). A drop that meets a Squeak oils it: the
// Squeak becomes a calm note that floats down to Doc Leo, and its touch counts it. Ten Squeaks,
// two a line, one quick; then two more waves of quick ones squeak out of the clef end of every
// line (blocks that give birth once, on a timetable). When every note is home, the gate under
// the staff opens. Across the top, a row of lamps counts down to each wave (fuse.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { kit, AIR, countedDoor, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { fuseBlocks } from './fuse';
import { MapBuilder, at, type Level } from './maps';

/** The staff's lines, bottom (Z) to top (B). */
export const LINES = [6, 5, 4, 3, 2];
export const OIL = { w: 16, floor: 9, step: 13, gate: 2, exit: 1 } as const;
/** The staff's columns: the clef (two wide), the time signature, then the lines from `from`. */
export const STAFF = { clef: 0, time: 2, from: 3 } as const;
/** Each line's note, bottom to top (a treble clef's lines: Every Good Boy Does Fine). */
export const LINE_NOTES = ['E', 'G', 'B', 'D', 'F'] as const;
/** Ticks into the level each later wave squeaks out (a quick Squeak on every line). */
export const WAVES = [260, 440];
/** The countdown's lamps across the top row (level x of the first), one span a wave. */
export const FUSE = { x: 4, cells: 8 } as const;
/** Every Squeak there will be: the first ten and the waves. */
export const ALL_SQUEAKS = 10 + WAVES.length * 5;
/** The Squeaks: line, column it starts at, quick or not. */
export const SQUEAKS: { line: number; x: number; fast: boolean }[] = [
  { line: 0, x: 3, fast: false },
  { line: 1, x: 5, fast: false },
  { line: 2, x: 3, fast: false },
  { line: 3, x: 6, fast: false },
  { line: 4, x: 4, fast: false },
  { line: 0, x: 7, fast: true },
  { line: 1, x: 8, fast: true },
  { line: 2, x: 6, fast: true },
  { line: 3, x: 8, fast: true },
  { line: 4, x: 7, fast: true },
];

export function oilBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'engine');
  const { book, c } = k;
  // a line of the staff: a bright amber line across the dark (the lines a Squeak walks)
  const line = k.pic('bay');
  line.rect(0, 9, 20, 2, c('pipe', 3)).rect(0, 9, 20, 1, c('pipe', 4));
  book.add('line', line, AIR);
  // the staff's left end: a big treble clef curled round the G line, and 4/4 (two blocks wide,
  // seven tall: the row over the staff to the row under it), drawn whole and cut into blocks
  const head = new Pixels(60, 140);
  for (let r = 0; r < 7; r++) for (let x = 0; x < 3; x++) head.blit(k.pic(r && r < 6 ? 'line' : 'bay'), x * 20, r * 20);
  const ink = c('lamp', 4);
  const dark = c('ink', 0);
  // the clef's path, from the inside of its curl out round the G line (local y 89), up the stem
  // to the loop at the top, and down to the hook and its ball under the staff
  const CLEF: [number, number, number][] = [
    [21, 90, 1.5],
    [25, 86, 1.5],
    [21, 80, 2],
    [13, 84, 2.5],
    [11, 95, 3],
    [17, 106, 3],
    [28, 107, 2.5],
    [34, 97, 2],
    [32, 83, 1.5],
    [24, 72, 1.5],
    [14, 60, 2.5],
    [10, 44, 2.5],
    [14, 24, 2],
    [22, 8, 1.5],
    [27, 4, 1.5],
    [29, 12, 1.5],
    [24, 28, 1.5],
    [21, 50, 1.5],
    [22, 80, 1.5],
    [24, 110, 1.5],
    [23, 126, 1.5],
    [18, 133, 1.5],
    [12, 130, 1.5],
  ];
  const along = (t: number) => {
    const i = Math.min(CLEF.length - 2, Math.floor(t));
    const f = t - i;
    const at = (j: number) => CLEF[Math.max(0, Math.min(CLEF.length - 1, j))];
    // Catmull-Rom through the points
    return [0, 1, 2].map((d) => {
      const [p0, p1, p2, p3] = [at(i - 1)[d], at(i)[d], at(i + 1)[d], at(i + 2)[d]];
      return 0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
    });
  };
  for (const [r, col] of [
    [1.2, dark],
    [0, ink],
  ] as const)
    for (let t = 0; t <= CLEF.length - 1; t += 0.02) {
      const [x, y, w] = along(t);
      head.disc(Math.round(x), Math.round(y), w + r, col);
    }
  head.disc(13, 125, 4.2, dark).disc(13, 125, 3.4, ink);
  // the time signature, each 4 two spaces tall (drawn 8x8, stretched)
  const four = (top: number) => {
    const g = new Pixels(8, 8, 255);
    text(g, 0, 0, '4', 1, 1, true);
    for (let y = 0; y < 34; y++)
      for (let x = 0; x < 16; x++) {
        if (g.get(x >> 1, Math.floor((y * 8) / 34)) !== 1) continue;
        head.rect(43 + x - 1, top + y - 1, 3, 3, dark);
      }
    for (let y = 0; y < 34; y++) for (let x = 0; x < 16; x++) if (g.get(x >> 1, Math.floor((y * 8) / 34)) === 1) head.set(43 + x, top + y, ink);
  };
  four(32);
  four(72);
  for (let r = 0; r < 7; r++) for (let x = 0; x < 3; x++) book.add(`clef${x}.${r}`, head.crop(x * 20, r * 20, 20, 20), AIR);
  // each line's letter at its right end, on a plaque: the key that squirts it
  LINE_NOTES.forEach((n) => {
    const p = k.pic('line');
    p.rect(4, 4, 12, 12, c('ink', 0)).rect(5, 5, 10, 10, c('pipe', 4));
    text(p, 6, 6, n, c('ink', 0), 1, true);
    book.add(`letter${n}`, p, AIR);
  });
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
  LINES.forEach((y, i) =>
    m
      .fill(STAFF.from, y, OIL.step - STAFF.from, 1, '-')
      .set(STAFF.from, y, 'wave0')
      .set(OIL.step - 1, y, `letter${LINE_NOTES[i]}`),
  );
  for (let r = 0; r < 7; r++) for (let x = 0; x < 3; x++) m.set(STAFF.clef + x, LINES[4] - 1 + r, `clef${x}.${r}`);
  m.fill(w - 1, 0, 1, floor, '#');
  // Doc Leo's step at the right: he squirts left along the lines. The gate and the way out at the left
  m.set(OIL.step, floor, 'step').set(OIL.step + 1, floor, 'step');
  m.set(OIL.gate, 7, 'gate.top').set(OIL.gate, 8, 'gate');
  m.link(OIL.exit, 8);
  for (const s of SQUEAKS) m.mon(s.fast ? MON.squeakFast : MON.squeak, s.x, LINES[s.line]);
  m.mon(MON.dreamWalk, 4, 8);
  // he starts mid-screen (the view, which never scrolls, is centered on where he starts) and drops to the floor
  return { m, start: at(8, 5), size: [w, 10] };
}
