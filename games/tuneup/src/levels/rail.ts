// Level 2, The Player Piano (inside it). Notes drop down two glass tubes onto two keys, and
// Teddy, on the rail below, boops each key (Space) as its note lands. No monsters: the blocks
// do it all ("Hammer Rail", DESIGN.md).
//
// - Each tube is a ring of 16 blocks, one an eighth (STEP ticks), shown with or without a note
//   head. Row r of the tube holds ring member (-r mod 16), so every row shows the ring a step
//   behind the row above it and a note walks down the tube, one row an eighth.
// - Each key is a second ring with the same 16 eighths, lit for the eighth its note lands. A
//   touch reads the frame on show at that tick, so the key itself judges the timing: a lit
//   eighth is "early" (1 tick, +5), "on the beat" (3 ticks, +20) and "late" (1 tick, +5), and
//   each is a hit (counter 20). A boop on an unlit key takes a hit back (refused at none).
// - The low key's hit is a counter up (slot 7, C); the high key's also gives a hit point,
//   which PLAYGAME sounds first (slot 0, G): two keys, two pitches.
// - Across the top, a note fills in every 20 ticks: 16 of them while the phrase plays four
//   times. Then the lid at the end turns into a door that opens for HITS_NEEDED hits; the
//   notes keep falling for anyone who needs more.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR, HITS_NEEDED } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** Ticks an eighth (a step of the tubes) lasts: half a beat at 109.2 BPM. */
export const STEP = 5;
/** Eighths in the phrase. */
export const STEPS = 16;
/** Tube rows above each key. */
const TUBE = 6;
/** The eighths each key's note lands on. */
export const LANES = [
  { id: 'lo', x: 7, notes: [4, 10], high: false },
  { id: 'hi', x: 9, notes: [1, 7, 13], high: true },
] as const;
/** Ticks the phrase plays before the lid at the end opens (four times through). */
export const SONG_TICKS = STEP * STEPS * 4;
/** The keys' row and the rail's row (level blocks). */
export const KEY_ROW = TUBE + 1;
export const RAIL_ROW = KEY_ROW + 1;
/** Sub-frames of a lit eighth: early, on the beat, late (ticks, points). */
const GRADES: [string, number, number][] = [
  ['early', 1, 5],
  ['beat', 3, 20],
  ['late', 1, 5],
];
/** The level is one screen. */
const W = 16;

export function railBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  // everything pulls down, so Teddy drops onto the rail from where he starts (mid-screen,
  // which puts the whole piano on screen) and a boop comes straight back down
  const still = { grav: GRAV.down };
  // the piano's insides: dark wood with the brass strings running down it
  const inside = () => {
    const p = P(c('wood', 0));
    for (const x of [3, 8, 13, 17]) p.rect(x, 0, 1, 20, c('gold', 0));
    return p;
  };
  book.add('inside', inside(), still);
  book.add('case', P(c('wood', 1)).rect(0, 0, 20, 2, c('wood', 2)).rect(0, 18, 20, 2, c('wood', 0)), { solid: SOLID });
  // the rail Teddy walks: green felt, and the brass bar under it
  book.add('felt', P(c('wood', 0)).rect(0, 14, 20, 6, c('green', 0)).rect(0, 14, 20, 1, c('green', 1)), still);
  book.add('bar', P(c('gold', 1)).rect(0, 0, 20, 3, c('gold', 2)).rect(0, 17, 20, 3, c('gold', 0)), { solid: SOLID });

  // a big note head, nearly the tube's width, tipped like a written note, with its shine
  const head = (p: Pixels, cx: number, cy: number, ink: number, shine: number) => {
    blob(p, cx, cy, 6.4, 4.6, [c('ink', 0), ink, ink], 0, 2);
    p.rect(cx - 3, cy - 2, 2, 1, shine).set(cx - 4, cy - 1, shine);
    return p;
  };
  // the tubes: round glass, shaded dark at the edges to a bright streak, a brass collar at each joint
  const GLASS = [0, 2, 4, 5, 4, 3, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0];
  for (const lane of LANES) {
    const ink = lane.high ? c('red', 2) : c('blue', 2);
    const tube = (note: boolean) => {
      const p = inside();
      GLASS.forEach((s, i) => p.rect(2 + i, 0, 1, 20, c('sky', s)));
      p.rect(1, 0, 1, 20, c('ink', 0)).rect(18, 0, 1, 20, c('ink', 0));
      p.rect(1, 18, 18, 2, c('gold', 1)).rect(1, 18, 18, 1, c('gold', 2));
      if (note) head(p, 10, 9, ink, c('cloud', 2));
      return p;
    };
    // member j shows a note if a note lands on the key TUBE eighths after it shows in the top row
    for (let j = 0; j < STEPS; j++) {
      const note = (lane.notes as readonly number[]).includes((j + TUBE) % STEPS);
      book.add(`${lane.id}.t${j}`, tube(note), { ...still, ntime: STEP, next: `${lane.id}.t${(j + 1) % STEPS}` });
    }
    // the key: a long white key; lit, it glows (brightest on the beat) with the note on it
    const key = (glow: number) => {
      const p = inside();
      p.rect(2, 2, 16, 18, glow ? c('yellow', glow) : c('paint', 3)).frame(2, 2, 16, 18, c('ink', 0));
      p.rect(3, 17, 14, 2, glow ? c('yellow', glow - 1) : c('paint', 1));
      if (glow) head(p, 10, 9, ink, c('cloud', 2));
      return p;
    };
    // the ring: unlit stretches as one block each, a lit eighth as its three grades
    const ring: { name: string; pic: Pixels; ticks: number; hit?: number }[] = [];
    let run = 0;
    const flush = () => {
      if (run) ring.push({ name: `${lane.id}.k${ring.length}`, pic: key(0), ticks: run });
      run = 0;
    };
    for (let s = 0; s < STEPS; s++) {
      if (!(lane.notes as readonly number[]).includes(s)) {
        run += STEP;
        continue;
      }
      flush();
      for (const [grade, ticks, score] of GRADES) ring.push({ name: `${lane.id}.k${ring.length}`, pic: key(grade === 'beat' ? 3 : 2), ticks, hit: score });
    }
    flush();
    ring.forEach((r, i) => {
      const next = ring[(i + 1) % ring.length].name;
      // a hit: one more for the door, the grade's points, and (high key) a hit point first, for its pitch
      const lit = { effect: CTR.hits, eamt: 1, score: r.hit, hp: lane.high ? 1 : 0 };
      const miss = { effect: CTR.hits, eamt: -1 };
      book.add(r.name, r.pic, { ...still, ntime: r.ticks, next, ...(r.hit ? lit : miss) });
    });
    if (ring.reduce((n, r) => n + r.ticks, 0) !== STEP * STEPS) throw new Error(`rail: lane ${lane.id} is out of step`);
  }

  // the song's meter across the top: a note fills in every 20 ticks
  const slot = (full: boolean) => {
    const p = P(c('wood', 1)).rect(0, 18, 20, 2, c('wood', 0));
    if (full) blob(p, 9, 11, 5, 4, [c('ink', 0), c('yellow', 3), c('yellow', 3)], 0, 2);
    else p.ring(9, 11, 4, c('wood', 3));
    p.rect(13, 2, 1, 9, full ? c('ink', 0) : c('wood', 3));
    return p;
  };
  const per = SONG_TICKS / W;
  for (let i = 0; i < W; i++) book.add(`meter${i}`, slot(false), { solid: SOLID, ntime: per * (i + 1), next: 'meter.full' });
  book.add('meter.full', slot(true), { solid: SOLID });

  // the lid at the end, shut while the song plays; then a door that opens for enough hits
  const lid = (open: boolean, ready: boolean) => {
    const p = inside();
    if (open) return p.rect(2, 0, 3, 20, c('wood', 2));
    p.rect(2, 0, 16, 20, c('wood', 2)).frame(2, 0, 16, 20, c('wood', 0));
    if (ready) {
      // a note on the door: it opens for enough notes
      blob(p, 9, 13, 3.4, 2.6, [c('ink', 0), c('yellow', 3), c('yellow', 3)], 0, 2);
      p.rect(12, 4, 1, 9, c('ink', 0));
    } else p.rect(5, 9, 10, 2, c('wood', 0));
    return p;
  };
  book.add('lid', lid(false, false), { solid: SOLID, ntime: SONG_TICKS, next: 'gate' });
  book.add('gate', lid(false, true), { solid: SOLID, effect: CTR.hits, eamt: -HITS_NEEDED, touch: 'gate.open' });
  book.add('gate.open', lid(true, true), still);
  // the seventh keyboard, stuck in the piano all along (the shop's door has counted its six, so
  // this one doesn't count: no spare is left over to open a later door early)
  pickups(k, ['tine-glass'], 'felt', false);
  return k;
}

const LEGEND: Record<string, string> = { '.': 'inside', '#': 'case', f: 'felt', _: 'bar' };

export function rail(book: Kit['book']): Level {
  const m = new MapBuilder(book, LEGEND, 'case');
  m.fill(0, 0, W, 10, '.')
    .fill(0, RAIL_ROW, W, 1, 'f')
    .fill(0, RAIL_ROW + 1, W, 1, '_');
  for (let i = 0; i < W; i++) m.set(i, 0, `meter${i}`);
  for (const lane of LANES) {
    for (let r = 0; r < TUBE; r++) m.set(lane.x, 1 + r, `${lane.id}.t${(STEPS - r) % STEPS}`);
    m.set(lane.x, KEY_ROW, `${lane.id}.k0`);
  }
  m.set(13, RAIL_ROW, 'lid').set(14, RAIL_ROW, 'pick-tine-glass').set(15, RAIL_ROW, 'felt');
  m.link(15, RAIL_ROW);
  // he starts mid-screen between the tubes (the view is centered on him) and drops to the rail
  return { m, start: at(8, 5), size: [W, 10] };
}
