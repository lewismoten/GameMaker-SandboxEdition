// Level 3, The Timing Beat (inside the distributor, as a player piano: dark wood, brass, glass
// and ivory). The engine's timing is off, so Doc Leo resets it by ear: notes drop down four glass
// pipes onto four keys, and he boops each key (Space) as its note lands. Three verses, a scene
// each: a straight one; a syncopated one where a Y-pipe splits one note into two lanes and a slow
// pipe takes a bend; and a double-time one where the pipes are short and a crossover pipe brings
// the first lane's notes over the top of the others. No monsters: the blocks do it all.
//
// - A pipe cell `d` cells above its key shows a ring of `period` blocks, a step (STEP ticks) each,
//   started at member (d - r) mod period, where the lane's notes are a ring's pattern turned by
//   r: a cell shows the note that lands d steps later, so a note walks down the pipe a cell a
//   step. Lanes whose notes are the same pattern turned share a ring (and so do the cells of the
//   Y-pipe two lanes share).
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
import { saveSignBlocks } from '../../../kit/saveSign';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { AIR, kit, LEDGE, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import { rubberEgg } from '../art/egg';
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
/** The egg's block number (about.json "egg" and web/src/eggs/eggs.ts carry it too). */
export const EGG_BLOCK = 149;

export type LaneKind = 'hp' | 'count' | 'tip' | 'score';
type Art = 'v' | 'h' | 'elbow';
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
  /** The pipe from just over the key upward (straight up to the top row if left out). */
  path?: Cell[];
}
export interface Verse {
  file: string;
  /** Steps in the ring. */
  period: number;
  lanes: Lane[];
  /** Hits (the first two lanes' notes) the gate takes. */
  need: number;
  /** What sits in the side room's nook: the tin heart, the felt egg or the save sign. */
  nook?: 'heart' | 'egg' | 'sign';
}

const up = (x: number, from: number, to: number): Cell[] => Array.from({ length: from - to + 1 }, (_, i) => ({ x, y: from - i, art: 'v' as Art }));

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
      // the Y-pipe: one trunk over b, splitting at row 4 into b and c (both keys light at once)
      { id: 'b', x: 7, notes: [7], kind: 'count' },
      { id: 'c', x: 8, notes: [7], kind: 'tip', path: [{ x: 8, y: 5, art: 'v' }, { x: 8, y: 4, art: 'elbow' }, ...up(7, 3, 1)] },
      // the slow pipe: up from d, a bend to the right along row 3, and up again
      {
        id: 'd',
        x: 9,
        notes: [15],
        kind: 'score',
        path: [
          ...up(9, 5, 4),
          { x: 9, y: 3, art: 'elbow' },
          { x: 10, y: 3, art: 'h' },
          { x: 11, y: 3, art: 'h' },
          { x: 12, y: 3, art: 'elbow' },
          ...up(12, 2, 1),
        ],
      },
    ],
    need: 6,
    nook: 'egg',
  },
  {
    file: 'beat3',
    period: 12,
    lanes: [
      // the crossover: a's notes come from over d and cross the top of the others
      {
        id: 'a',
        x: 6,
        notes: [0],
        kind: 'hp',
        path: [...up(6, 5, 3), { x: 6, y: 2, art: 'elbow' }, { x: 7, y: 2, art: 'h' }, { x: 8, y: 2, art: 'h' }, { x: 9, y: 2, art: 'elbow' }, ...up(9, 1, 1)],
      },
      { id: 'b', x: 7, notes: [2, 10], kind: 'count', path: up(7, 5, 3) },
      { id: 'c', x: 8, notes: [4, 8], kind: 'tip', path: up(8, 5, 3) },
      { id: 'd', x: 9, notes: [6], kind: 'score', path: up(9, 5, 3) },
    ],
    need: 8,
    nook: 'sign',
  },
];

/** A lane's pipe, from the cell over its key upward. */
export const pathOf = (l: Lane): Cell[] => l.path ?? up(l.x, ROW.key - 1, ROW.top);

/** The pattern turned so it starts as low as it can (its ring), and the turn. */
function base(notes: number[], period: number): { key: string; turn: number; pattern: number[] } {
  let best: { key: string; turn: number; pattern: number[] } | undefined;
  for (const r of notes) {
    const pattern = notes.map((n) => (n - r + period) % period).sort((a, b) => a - b);
    const key = pattern.join('.');
    if (!best || key < best.key) best = { key, turn: r, pattern };
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
      const name = `${cell.art}${b.key}.${(((d - b.turn) % v.period) + v.period) % v.period}`;
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
    // an ivory note head, tipped like a written note
    const head = (p: Pixels, cx: number, cy: number) => {
      blob(p, cx, cy, 5.6, 4, [c('ink', 0), c('accent', 1), c('accent', 1)], 0, 2);
      p.rect(cx - 3, cy - 2, 2, 1, c('paint', 3));
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
      } else if (art === 'h') {
        GLASS.forEach((s, i) => p.rect(0, 3 + i, 20, 1, c('pipe', s)));
        p.rect(0, 2, 20, 1, c('ink', 0)).rect(0, 17, 20, 1, c('ink', 0));
        p.rect(18, 2, 2, 16, c('mach', 3));
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
    const rings = new Set([...pipeCells(v).values()].map((n) => n.replace(/\.\d+$/, '')));
    for (const ring of rings) {
      const art: Art = ring.startsWith('elbow') ? 'elbow' : (ring[0] as Art);
      const pattern = ring.slice(art.length).split('.').map(Number);
      for (let j = 0; j < v.period; j++)
        book.add(`${ring}.${j}`, pipe(art, pattern.includes(j)), { ...AIR, ntime: STEP, next: `${ring}.${(j + 1) % v.period}` });
    }
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
      const ring: { pic: Pixels; ticks: number; hit?: number }[] = [];
      let run = 0;
      const flush = () => {
        if (run) ring.push({ pic: key(0), ticks: run });
        run = 0;
      };
      for (let s = 0; s < v.period; s++) {
        if (!lane.notes.includes(s)) {
          run += STEP;
          continue;
        }
        flush();
        GRADES.forEach(([ticks, score], g) => ring.push({ pic: key(g === 1 ? 3 : 2), ticks, hit: score }));
      }
      flush();
      if (ring.reduce((n, r) => n + r.ticks, 0) !== STEP * v.period) throw new Error(`${v.file}: lane ${lane.id} is out of step`);
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
    if (v.nook === 'sign') {
      const s = saveSignBlocks(pal.pal, { board: [works(), works()], posts: [works(), works()] });
      book.add('sign.l', s.board[0], AIR);
      book.add('sign.r', s.board[1], AIR);
      book.add('post.l', s.posts![0], AIR);
      book.add('post.r', s.posts![1], AIR);
    }
    if (v.nook === 'egg') {
      // the felt egg Sir Reginald laid, in the last slot, a number no other map of the game shows
      while (book.index.size < EGG_BLOCK) book.add(`spare${book.index.size}`, P());
      book.add('egg', rubberEgg(works()), { ...AIR, obj: 1, score: 500, touch: 'works' });
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
    for (const [at, name] of pipeCells(v)) {
      const [x, y] = at.split(',').map(Number);
      m.set(x, y, name);
    }
    for (const lane of v.lanes) m.set(lane.x, ROW.key, `${lane.id}.k0`);
    m.set(GATE_X, ROW.head, 'lid.top').set(GATE_X, ROW.feet, 'lid');
    // the side room's ledges up to the nook
    m.fill(16, 6, 2, 1, 's').fill(19, 4, 2, 1, 's');
    if (v.nook === 'heart') m.set(...NOOK, 'tinHeart');
    if (v.nook === 'egg') {
      m.set(...NOOK, 'egg');
      m.mon(MON.reggie, 19, ROW.feet);
    }
    if (v.nook === 'sign') m.set(17, ROW.head, 'sign.l').set(18, ROW.head, 'sign.r').set(17, ROW.feet, 'post.l').set(18, ROW.feet, 'post.r');
    if (v.nook !== 'egg') m.mon(v.nook === 'sign' ? MON.regina : MON.reggie, 15, ROW.feet);
    m.link(EXIT_X, ROW.feet);
    // he starts mid-screen between the keys and drops onto the rail
    return { m, start: at(8, 5), size: [W, 10] };
  };
}
