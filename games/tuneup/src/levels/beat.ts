// Level 3, The Timing Beat (inside the distributor, as a player piano: dark wood, brass, glass
// and ivory). The engine's timing is off, so Doc Leo resets it by ear. Across the top a paper
// roll turns (a crank wheel at its left end, a bellows breathing under it); its holes let notes
// drop down four glass tubes onto four keys, and he boops each key (Space) as its note lands,
// while the organ pipes at the right speak each lane's note. Three verses, a scene each: a
// straight one; a syncopated one where a Y-tube splits one hole into two lanes and a slow tube
// takes a bend; and a double-time one. No monsters: the blocks do it all.
//
// - A tube cell `d` cells above its key shows a ring of `period` blocks, a step (STEP ticks) each,
//   started at member (d - r) mod period, where the lane's notes are a ring's pattern turned by
//   r: a cell shows the note that lands d steps later, so a note walks down the tube a cell a
//   step. Lanes whose notes are the same pattern turned share a ring (and so do the cells of the
//   Y-tube two lanes share).
// - The roll's cell is each tube's top cell, under the same rule: its ring scrolls the paper 5
//   pixels a step and brings each hole toward you over the 4 steps before its note drops (a
//   sliver at the crest, full size on the step the note enters the tube). The paper's turn is
//   part of a roll ring's name, so every cell of the row scrolls together. The plain paper, its
//   ragged edges, the wheel and the bellows are 4-step rings started in step with it.
// - A key is a ring of the same period, lit for the step its note lands, in three grades: early
//   (1 tick, +5), on the beat (3 ticks, +20) and late (2 ticks, +5). A touch reads the frame on
//   show, so the key itself judges the timing. A boop on an unlit key takes back what a hit gives.
// - Each lane's hit is its own kind of change, so its own pitch (sounds.ts): energy up, a hit, a
//   tip, points. The first two count toward the verse's gate (each verse its own counter).
// - Across the top, a cell of the song's meter fills every eighth of the verse; then the lid at
//   the end becomes a gate that opens for enough hits. The notes keep falling for anyone who
//   needs more.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob, gradient } from '../../../snowbound/src/art/draw';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { AIR, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON, MONEY } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** Ticks a step (an eighth) lasts: a beat of 12 ticks. */
export const STEP = 6;
/** Ticks a verse plays before its lid becomes a gate. */
export const VERSE_TICKS = 288;
/** Rows: the meter, the pipes' top, the keys, Doc Leo's head and feet, the rail. */
export const ROW = { meter: 0, top: 1, key: 6, head: 7, feet: 8, rail: 9 } as const;
/** The room's width on screen, and the side room's beyond it (the way out). */
const ROOM = 16;
export const W = 22;
export const GATE_X = 13;
export const EXIT_X = 21;

export type LaneKind = 'hp' | 'count' | 'tip' | 'score';
type Art = 'v' | 'elbow' | 'roll';
interface Cell {
  x: number;
  y: number;
  art: Art;
}
export interface Lane {
  id: 'a' | 'b' | 'c' | 'd';
  /** The key's column. */
  x: number;
  /** The steps of the period its notes land on. */
  notes: number[];
  kind: LaneKind;
  /** The tube from just over the key up to the row under the roll (straight up if left out). */
  path?: Cell[];
}
export interface Verse {
  file: string;
  /** Steps in the ring. */
  period: number;
  lanes: Lane[];
  /** Hits (the first two lanes' notes) the gate takes. */
  need: number;
  /** What sits in the side room's nook: the tin heart (the first verse). */
  nook?: 'heart';
}

const up = (x: number, from: number, to: number): Cell[] => Array.from({ length: from - to + 1 }, (_, i) => ({ x, y: from - i, art: 'v' as Art }));
/** A tube up from key column `x` that steps over to column `to` at row 3. */
const bend = (x: number, to: number): Cell[] => [...up(x, 5, 4), { x, y: 3, art: 'elbow' }, { x: to, y: 3, art: 'elbow' }, ...up(to, 2, 2)];

/** The roll: its paper's columns (two wider than the keys) between its two ragged edges. */
export const ROLL = { x: 5, w: 6 } as const;
/** The crank wheel and the bellows (2x2 blocks each, top left), and the organ pipes' columns. */
const WHEEL: [number, number] = [2, 1];
const BELLOWS: [number, number] = [2, 4];
const ORGAN = { x: 12, tops: [2, 2, 3, 4] } as const;

/** The three verses. Keys sit side by side (x 6..9), so the next lane is a step away. */
export const VERSES: Verse[] = [
  {
    file: 'beat1',
    period: 16,
    lanes: [
      { id: 'a', x: 6, notes: [4], kind: 'hp' },
      { id: 'b', x: 7, notes: [8], kind: 'count' },
      { id: 'c', x: 8, notes: [12], kind: 'tip' },
      { id: 'd', x: 9, notes: [0], kind: 'score' },
    ],
    need: 4,
    nook: 'heart',
  },
  {
    file: 'beat2',
    period: 16,
    lanes: [
      { id: 'a', x: 6, notes: [3, 11], kind: 'hp' },
      // the Y-tube: one trunk over b, splitting at row 4 into b and c (both keys light at once)
      { id: 'b', x: 7, notes: [7], kind: 'count' },
      { id: 'c', x: 8, notes: [7], kind: 'tip', path: [{ x: 8, y: 5, art: 'v' }, { x: 8, y: 4, art: 'elbow' }, ...up(7, 3, 2)] },
      // the slow tube: up from d, a bend to the right, and up to the roll's last column
      { id: 'd', x: 9, notes: [15], kind: 'score', path: bend(9, 10) },
    ],
    need: 6,
  },
  {
    file: 'beat3',
    period: 12,
    lanes: [
      { id: 'a', x: 6, notes: [0], kind: 'hp' },
      { id: 'b', x: 7, notes: [2, 10], kind: 'count' },
      { id: 'c', x: 8, notes: [4, 8], kind: 'tip' },
      { id: 'd', x: 9, notes: [6], kind: 'score' },
    ],
    need: 8,
  },
];

/** A lane's tube, from the cell over its key upward, ending in its hole in the roll. */
export const pathOf = (l: Lane): Cell[] => {
  const tube = l.path ?? up(l.x, ROW.key - 1, ROW.top + 1);
  return [...tube, { x: tube[tube.length - 1].x, y: ROW.top, art: 'roll' }];
};

/** The pattern turned so it starts as low as it can (its ring), and the turn. */
function base(notes: number[], period: number): { key: string; turn: number; pattern: number[]; ring: number } {
  // a pattern that repeats within the period needs only a ring that long (notes every 8 steps: 8)
  const ring = Array.from({ length: period }, (_, q) => q + 1).find((q) => period % q === 0 && notes.every((n) => notes.includes((n + q) % period)))!;
  let best: { key: string; turn: number; pattern: number[]; ring: number } | undefined;
  for (const r of notes) {
    const pattern = [...new Set(notes.map((n) => (n - r + period) % ring))].sort((a, b) => a - b);
    const key = `${pattern.join('.')}p${ring}`;
    if (!best || key < best.key) best = { key, turn: r, pattern, ring };
  }
  return best!;
}

/** Sub-frames of a lit step: early, on the beat, late (ticks, points). */
const GRADES: [number, number][] = [
  [1, 5],
  [3, 20],
  [STEP - 4, 5],
];

/** A verse's own hit counter (so no verse's gate opens on another's notes). */
export const hitCounter = (v: Verse) => [CTR.hits, CTR.hits2, CTR.hits3][VERSES.indexOf(v)];
const hit = (kind: LaneKind, ctr: number): { hp?: number; effect?: number; eamt?: number } =>
  kind === 'hp' ? { hp: 1, effect: ctr, eamt: 1 } : kind === 'count' ? { effect: ctr, eamt: 1 } : kind === 'tip' ? { effect: MONEY, eamt: 1 } : {};
const miss = (kind: LaneKind, ctr: number): { effect?: number; eamt?: number; score?: number } =>
  kind === 'tip' ? { effect: MONEY, eamt: -1 } : kind === 'score' ? { score: -5 } : { effect: ctr, eamt: -1 };
/** Each lane's key color when lit. */
const LANE_INK: Record<Lane['id'], string> = { a: 'red', b: 'blue', c: 'green', d: 'purple' };

/** Every pipe cell's block: the ring member it starts at. */
export function pipeCells(v: Verse): Map<string, string> {
  const cells = new Map<string, string>();
  for (const l of v.lanes) {
    const b = base(l.notes, v.period);
    pathOf(l).forEach((cell, i) => {
      const d = i + 1;
      const name = `${cell.art}${b.key}.${(((d - b.turn) % b.ring) + b.ring) % b.ring}`;
      const at = `${cell.x},${cell.y}`;
      const was = cells.get(at);
      if (was && was !== name) throw new Error(`${v.file}: pipes cross at ${at} out of step (${was}, ${name})`);
      cells.set(at, name);
    });
  }
  return cells;
}

export function beatBlocks(v: Verse) {
  return (pal: Pal): Kit => {
    const k = kit(pal);
    baseSet(k, 'engine');
    const { book, c, R, P } = k;
    // the piano's insides: dark wood, brass strings down it
    const inside = () => {
      const p = P(c('wall', 2));
      for (const x of [3, 8, 13, 17]) p.rect(x, 0, 1, 20, c('mach', 2));
      return p;
    };
    book.add('inside', inside(), AIR);
    // the rail Doc Leo walks: green felt over brass
    book.add('rail', P(c('floor', 2)).rect(0, 0, 20, 5, c('green', 1)).rect(0, 0, 20, 1, c('green', 2)).rect(0, 17, 20, 3, c('floor', 0)), { solid: SOLID });
    // a black note head, tipped like a written note, with its shine
    const head = (p: Pixels, cx: number, cy: number) => {
      blob(p, cx, cy, 6, 4.4, [c('ink', 0), c('ink', 1), c('ink', 1)], 0, 2);
      p.rect(cx - 3, cy - 2, 3, 1, c('paint', 3)).set(cx - 4, cy - 1, c('paint', 3));
      return p;
    };
    // the glass: shaded dark at the edges to a bright streak; an elbow is a brass box with a window
    const GLASS = [0, 1, 2, 4, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0];
    const pipe = (art: Art, note: boolean) => {
      const p = inside();
      if (art === 'v') {
        GLASS.forEach((s, i) => p.rect(3 + i, 0, 1, 20, c('pipe', s)));
        p.rect(2, 0, 1, 20, c('ink', 0)).rect(17, 0, 1, 20, c('ink', 0));
        p.rect(2, 18, 16, 2, c('mach', 3)).rect(2, 18, 16, 1, c('mach', 5));
      } else {
        p.rect(1, 1, 18, 18, c('mach', 3)).frame(1, 1, 18, 18, c('ink', 0));
        p.rect(4, 4, 12, 12, c('pipe', 1)).frame(4, 4, 12, 12, c('mach', 1));
        for (const [x, y] of [
          [2, 2],
          [16, 2],
          [2, 16],
          [16, 16],
        ])
          p.set(x, y, c('mach', 6));
      }
      if (note) head(p, 10, 10);
      return p;
    };
    // the roll's paper: ivory, darker where it curves away at the crest and at the brass tracker
    // bar it runs over at the bottom
    const curve = (y: number) => (y < 2 ? 1 : y < 5 ? 2 : y < 13 ? 4 : y < 16 ? 3 : 2);
    const paper = () => {
      const p = inside();
      for (let y = 0; y < 18; y++) p.rect(0, y, 20, 1, c('accent', curve(y)));
      return p.rect(0, 18, 20, 2, c('mach', 3)).rect(0, 18, 20, 1, c('mach', 5));
    };
    book.add('paper', paper(), AIR);
    // a hole coming toward you over 4 steps: a sliver at the crest, full size at the tracker bar
    const HOLES: [number, number][] = [
      [1, 1],
      [5, 2],
      [9, 3],
      [14, 4],
    ];
    const rollPic = (j: number, pattern: number[], ring: number) => {
      const p = paper();
      for (const n of pattern) {
        const s = (((j - n + 3) % ring) + ring) % ring;
        if (s < 4) p.rect(7, HOLES[s][0], 6, HOLES[s][1], c('wall', 0)).rect(7, HOLES[s][0], 6, 1, c('ink', 0));
      }
      return p;
    };
    const rings = new Set([...pipeCells(v).values()].map((n) => n.replace(/\.\d+$/, '')));
    for (const ring of rings) {
      const [, art, key, len] = /^(v|elbow|roll)([\d.]+)p(\d+)$/.exec(ring)!;
      const pattern = key.split('.').map(Number);
      const n = Number(len);
      for (let j = 0; j < n; j++)
        book.add(`${ring}.${j}`, art === 'roll' ? rollPic(j, pattern, n) : pipe(art as Art, pattern.includes(j)), {
          ...AIR,
          ntime: STEP,
          next: `${ring}.${(j + 1) % n}`,
        });
    }
    // the turning parts, 4 steps a turn, every one started with the scene so they keep together
    const turning = (name: string, pic: (phase: number) => Pixels) => {
      for (let f = 0; f < 4; f++) book.add(`${name}.${f}`, pic(f), { ...AIR, ntime: STEP, next: `${name}.${(f + 1) % 4}` });
    };
    // the roll's ends: the paper's thin, ragged edge (its nicks running down toward you as it
    // turns), a dark gap, the wooden spool end and its axle; drawn for the left end, mirrored
    const JAG = [0, 1, 1, 2, 1, 0, 0, 1, 2, 2, 1, 0, 1, 1, 0, 2, 1, 0, 0, 1];
    const edge = (phase: number) => {
      const p = inside();
      p.rect(0, 8, 6, 4, c('mach', 2)).rect(0, 8, 6, 1, c('mach', 4));
      p.rect(5, 0, 4, 20, c('mach', 3)).rect(6, 0, 1, 20, c('mach', 5)).rect(8, 0, 1, 20, c('mach', 1));
      p.rect(9, 0, 3, 18, c('wall', 0));
      for (let y = 0; y < 18; y++) {
        const x0 = 11 + JAG[(y + 20 - phase * 5) % 20];
        p.rect(x0, y, 20 - x0, 1, c('accent', curve(y))).set(x0, y, c('accent', 0));
      }
      return p.rect(9, 18, 11, 2, c('mach', 3)).rect(9, 18, 11, 1, c('mach', 5));
    };
    turning('edge.l', edge);
    turning('edge.r', (f) => edge(f).flipX());
    // the crank wheel (2x2 blocks): a brass rim and spokes, a belt from its hub up to the roll's
    // axle, and the red handle going round it a quarter a step (a block's ring shows the handle
    // for the step it is in that quarter, so the wheel costs ten blocks, not sixteen)
    const wheel = (handle: number) => {
      const p = new Pixels(40, 40);
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.blit(inside(), x * 20, y * 20);
      p.line(20, 17, 39, 8, c('ink', 0)).line(20, 23, 39, 11, c('ink', 0));
      p.disc(20, 20, 17, c('ink', 0)).disc(20, 20, 16, c('mach', 3)).disc(20, 20, 13, c('wall', 1));
      for (let i = 0; i < 3; i++) {
        const t = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
        const [x, y] = [Math.round(20 + 13 * Math.cos(t)), Math.round(20 + 13 * Math.sin(t))];
        p.line(20, 20, x, y, c('mach', 4)).line(21, 20, x + 1, y, c('mach', 2));
      }
      p.disc(20, 20, 4, c('mach', 5)).disc(20, 20, 2, c('mach', 1));
      if (handle >= 0) {
        // quarters clockwise from the top left: the handle's knob at the middle of each
        const t = Math.PI + Math.PI / 4 + (handle * Math.PI) / 2;
        const [hx, hy] = [Math.round(20 + 12 * Math.cos(t)), Math.round(20 + 12 * Math.sin(t))];
        p.disc(hx, hy, 4, c('ink', 0))
          .disc(hx, hy, 3, c('red', 2))
          .set(hx - 1, hy - 1, c('red', 3));
      }
      return p;
    };
    // block q of the 2x2 (left to right, top to bottom) and the quarter it holds (clockwise from the top left)
    const QUARTER = [0, 1, 3, 2];
    for (let q = 0; q < 4; q++) {
      const cut = (handle: number) => wheel(handle).crop((q % 2) * 20, (q >> 1) * 20, 20, 20);
      const k = QUARTER[q];
      const ring: [Pixels, number][] = [...(k ? [[cut(-1), k * STEP] as [Pixels, number]] : []), [cut(k), STEP]];
      if (k < 3) ring.push([cut(-1), (3 - k) * STEP]);
      ring.forEach(([pic, ticks], i) => book.add(`wheel${q}.${i}`, pic, { ...AIR, ntime: ticks, next: `wheel${q}.${(i + 1) % ring.length}` }));
    }
    // the bellows (1x2 blocks): leather folds between two wooden boards; the top board rides up
    // and down with the wheel, so only the top block turns
    const bellows = (open: number) => {
      const p = new Pixels(20, 40);
      p.blit(inside(), 0, 0).blit(inside(), 0, 20);
      const top = 33 - open;
      for (let y = top + 3; y < 34; y++) {
        const fold = Math.floor((y - top - 3) / 3) % 2;
        p.rect(2 + (fold ? 2 : 0), y, 16 - (fold ? 4 : 0), 1, c('red', fold ? 0 : 1));
      }
      p.rect(1, top, 18, 3, c('mach', 4)).rect(1, top, 18, 1, c('mach', 6));
      return p.rect(1, 34, 18, 4, c('wall', 4)).rect(1, 34, 18, 1, c('wall', 5));
    };
    turning('bellows', (f) => bellows([20, 16, 12, 16][f]).crop(0, 0, 20, 20));
    book.add('bellows.foot', bellows(12).crop(0, 20, 20, 20), AIR);
    // the organ pipes, a lane's each (its color banded under the mouth), on a wooden wind chest
    const organ = (part: 'top' | 'body' | 'mouth', ink?: string, speak = false) => {
      const p = inside();
      const y0 = part === 'top' ? 6 : 0;
      p.rect(6, y0, 8, 20 - y0, c('gray', 2))
        .rect(7, y0, 1, 20 - y0, c('gray', 3))
        .rect(13, y0, 1, 20 - y0, c('gray', 0));
      if (part === 'top') p.rect(5, 4, 10, 2, c('gray', 3)).rect(5, 5, 10, 1, c('gray', 1));
      if (ink)
        p.rect(7, 6, 6, 4, c('ink', 0))
          .rect(7, 10, 6, 1, c('gray', 3))
          .rect(6, 14, 8, 2, c(ink, speak ? 3 : 1));
      // speaking: its band lit and its breath puffing out both sides of the mouth
      if (speak)
        for (const [x, y, w] of [
          [1, 5, 4],
          [15, 5, 4],
          [0, 8, 5],
          [15, 8, 5],
          [2, 11, 3],
          [15, 11, 3],
        ])
          p.rect(x, y, w, 1, c('paint', 3));
      return p;
    };
    book.add('organ.top', organ('top'), AIR);
    book.add('organ.body', organ('body'), AIR);
    // each lane's pipe speaks on the step its note lands, with its key
    for (const lane of v.lanes) {
      const ring: { speak: boolean; ticks: number }[] = [];
      for (let s = 0, q = base(lane.notes, v.period).ring; s < q; s++) {
        const speak = lane.notes.some((n) => n % q === s);
        const last = ring[ring.length - 1];
        if (last?.speak === speak) last.ticks += STEP;
        else ring.push({ speak, ticks: STEP });
      }
      ring.forEach((r, i) =>
        book.add(`${lane.id}.m${i}`, organ('mouth', LANE_INK[lane.id], r.speak), { ...AIR, ntime: r.ticks, next: `${lane.id}.m${(i + 1) % ring.length}` }),
      );
    }
    book.add('chest', inside().rect(0, 3, 20, 17, c('wall', 3)).rect(0, 3, 20, 2, c('mach', 4)).frame(0, 3, 20, 17, c('wall', 0)), AIR);
    // the keys: a long ivory key; lit, it glows in the lane's color with the note on it
    for (const lane of v.lanes) {
      const ink = LANE_INK[lane.id];
      const key = (glow: number) => {
        const p = inside();
        p.rect(2, 1, 16, 19, glow ? c(ink, glow) : c('accent', 3)).frame(2, 1, 16, 19, c('ink', 0));
        p.rect(3, 16, 14, 3, glow ? c(ink, glow - 1) : c('accent', 1));
        if (glow) head(p, 10, 9);
        return p;
      };
      // a ring as long as the lane's pattern takes to repeat
      const q = base(lane.notes, v.period).ring;
      const ring: { pic: Pixels; ticks: number; hit?: number }[] = [];
      let run = 0;
      const flush = () => {
        if (run) ring.push({ pic: key(0), ticks: run });
        run = 0;
      };
      for (let s = 0; s < q; s++) {
        if (!lane.notes.some((n) => n % q === s)) {
          run += STEP;
          continue;
        }
        flush();
        GRADES.forEach(([ticks, score], g) => ring.push({ pic: key(g === 1 ? 3 : 2), ticks, hit: score }));
      }
      flush();
      if (ring.reduce((n, r) => n + r.ticks, 0) !== STEP * q) throw new Error(`${v.file}: lane ${lane.id} is out of step`);
      ring.forEach((r, i) => {
        const next = `${lane.id}.k${(i + 1) % ring.length}`;
        book.add(`${lane.id}.k${i}`, r.pic, {
          ...AIR,
          ntime: r.ticks,
          next,
          ...(r.hit ? { ...hit(lane.kind, hitCounter(v)), score: r.hit } : miss(lane.kind, hitCounter(v))),
        });
      });
    }
    // the song's meter across the top: a cell fills every eighth of the verse
    const slot = (full: boolean) => {
      const p = P(c('wall', 1)).rect(0, 18, 20, 2, c('wall', 0));
      if (full) blob(p, 9, 11, 5, 4, [c('ink', 0), c('lamp', 3), c('lamp', 4)], 0, 2);
      else p.ring(9, 11, 4, c('wall', 3));
      p.rect(13, 2, 1, 9, full ? c('ink', 0) : c('wall', 3));
      return p;
    };
    const per = VERSE_TICKS / 8;
    for (let i = 0; i < 8; i++) book.add(`meter${i}`, slot(false), { solid: SOLID, ntime: per * (i + 1), next: 'meter.full' });
    book.add('meter.full', slot(true), { solid: SOLID });
    book.add('meter.end', P(c('wall', 1)).rect(0, 18, 20, 2, c('wall', 0)), { solid: SOLID });
    // the lid: shut while the verse plays; then a gate that opens for enough hits
    const lid = (open: boolean, ready: boolean) => {
      const p = inside();
      if (open) return p.rect(2, 0, 3, 20, c('mach', 2));
      p.rect(2, 0, 16, 20, c('wall', 3)).frame(2, 0, 16, 20, c('wall', 0));
      if (ready) {
        blob(p, 9, 13, 3.4, 2.6, [c('ink', 0), c('lamp', 3), c('lamp', 3)], 0, 2);
        p.rect(12, 4, 1, 9, c('ink', 0));
      } else p.rect(5, 9, 10, 2, c('wall', 0));
      return p;
    };
    book.add('lid', lid(false, false), { solid: SOLID, ntime: VERSE_TICKS, next: 'gate' });
    book.add('gate', lid(false, true), { solid: SOLID, effect: hitCounter(v), eamt: -v.need, touch: 'gate.open' });
    book.add('gate.open', lid(true, true), AIR);
    book.add('lid.top', inside().rect(2, 6, 16, 14, c('wall', 3)).frame(2, 6, 16, 14, c('wall', 0)), AIR);
    // the side room: the brass works behind the piano, a ledge or two up to its nook
    const works = () => {
      const p = P(c('wall', 1));
      gradient(p, 0, 0, 20, 20, R('wall'), 0, 2);
      p.disc(6, 6, 4, c('mach', 2)).disc(6, 6, 2, c('wall', 0)).disc(15, 14, 3, c('mach', 3)).disc(15, 14, 1.4, c('wall', 0));
      return p;
    };
    book.add('works', works(), AIR);
    // the way out, at the side room's end: a doorway in the works, a lit EXIT sign over it
    // a lit EXIT sign (letters 3 pixels wide, drawn by hand: the DOS font is too wide) over a doorway
    const GLYPH: Record<string, string[]> = {
      E: ['111', '100', '110', '100', '111'],
      X: ['101', '101', '010', '101', '101'],
      I: ['111', '010', '010', '010', '111'],
      T: ['111', '010', '010', '010', '010'],
    };
    const exitTop = works().rect(2, 12, 16, 8, c('ink', 0)).frame(2, 12, 16, 8, c('mach', 4)).rect(5, 14, 10, 6, c('wall', 0));
    exitTop.rect(1, 1, 18, 9, c('green', 1)).frame(1, 1, 18, 9, c('ink', 0));
    [...'EXIT'].forEach((ch, i) => GLYPH[ch].forEach((row, y) => [...row].forEach((on, x) => on === '1' && exitTop.set(3 + i * 4 + x, 3 + y, c('paint', 3)))));
    book.add('exit.top', exitTop, AIR);
    book.add(
      'exit.door',
      works().rect(2, 0, 16, 20, c('ink', 0)).frame(2, 0, 16, 20, c('mach', 4)).rect(5, 0, 10, 18, c('wall', 0)).rect(13, 9, 2, 2, c('lamp', 3)),
      AIR,
    );
    book.add('shelf', works().rect(0, 0, 20, 4, c('mach', 4)).rect(0, 0, 20, 1, c('mach', 6)), { solid: LEDGE, ...AIR });
    if (v.nook === 'heart') {
      // the engine's ticker, at the top of the works: it ticks; touched, it leaves the wall
      const tin = { ink: c('ink', 0), tin: [c('gray', 1), c('gray', 2), c('gray', 3)], white: c('paint', 3), dark: c('gray', 0) };
      for (let f = 0; f < SHINE_FRAMES; f++)
        book.add(`tinHeart${f || ''}`, drawTinHeart(works(), tin, f), {
          ...AIR,
          next: `tinHeart${(f + 1) % SHINE_FRAMES || ''}`,
          ntime: f ? 2 : 50,
          touch: 'works',
          score: 100,
        });
    }
    return k;
  };
}

/** Where each verse's nook item sits (level blocks): up the side room's ledges. */
export const NOOK: [number, number] = [20, 3];

export function beat(v: Verse) {
  return (book: Kit['book']): Level => {
    const m = new MapBuilder(book, { '.': 'inside', _: 'rail', w: 'works', s: 'shelf' }, 'rail');
    m.fill(0, 0, ROOM, ROW.rail, '.').fill(ROOM, 0, W - ROOM, ROW.rail, 'w');
    m.fill(0, ROW.rail, W, 1, '_');
    for (let i = 0; i < 8; i++) m.set(4 + i, ROW.meter, `meter${i}`);
    m.fill(0, ROW.meter, 4, 1, 'meter.end').fill(12, ROW.meter, ROOM - 12, 1, 'meter.end');
    // the roll and what turns it; the organ at the right
    m.set(ROLL.x - 1, ROW.top, 'edge.l.0')
      .fill(ROLL.x, ROW.top, ROLL.w, 1, 'paper')
      .set(ROLL.x + ROLL.w, ROW.top, 'edge.r.0');
    for (let q = 0; q < 4; q++) m.set(WHEEL[0] + (q % 2), WHEEL[1] + (q >> 1), `wheel${q}.0`);
    m.set(...BELLOWS, 'bellows.0').set(BELLOWS[0], BELLOWS[1] + 1, 'bellows.foot');
    v.lanes.forEach((lane, i) => {
      const x = ORGAN.x + i;
      m.set(x, ORGAN.tops[i], 'organ.top').fill(x, ORGAN.tops[i] + 1, 1, ROW.key - 2 - ORGAN.tops[i], 'organ.body');
      m.set(x, ROW.key - 1, `${lane.id}.m0`).set(x, ROW.key, 'chest');
    });
    for (const [at, name] of pipeCells(v)) {
      const [x, y] = at.split(',').map(Number);
      m.set(x, y, name);
    }
    for (const lane of v.lanes) m.set(lane.x, ROW.key, `${lane.id}.k0`);
    m.set(GATE_X, ROW.head, 'lid.top').set(GATE_X, ROW.feet, 'lid');
    // the side room's ledges up to the nook
    m.fill(16, 6, 2, 1, 's').fill(19, 4, 2, 1, 's');
    if (v.nook === 'heart') m.set(...NOOK, 'tinHeart');
    m.mon(MON.dreamBird, 15, ROW.feet);
    m.set(EXIT_X, ROW.head, 'exit.top').set(EXIT_X, ROW.feet, 'exit.door');
    m.link(EXIT_X, ROW.feet);
    // he starts mid-screen between the keys and drops onto the rail
    return { m, start: at(8, 5), size: [W, 10] };
  };
}
