// kitchen.mbl, the monster blocks every room shares, and the kinds of monster a room can
// put in its .MON. A monster block carries what touching it does (hit points), so a mouse's
// two frames both bite. The power ladder decides every fight:
// Mice and ants only cost points (a mouse nips, then runs); everything else is one touch.
//   scared mouse 72 > squawk 70 > redcoat 50 > mouse, ant 40      (a squawk sends them off)
//   kazoo 75: louder, and it takes on the same crowd
//   flying things 80: they beat a squawk, and burst on Doc Leo (under 100, so once each)
//   rolling pins, knives 150: they keep hurting while they touch him
//   Teddy and Gwinn 200: harmless, and nothing in the kitchen can move them
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import {
  ant,
  bubble,
  cork,
  corgi,
  fireball,
  flyingCap,
  gwinn,
  icicle,
  kazooWave,
  knife,
  mouse,
  redcoat,
  rollingPin,
  spark,
  squawkWave,
  steam,
} from '../art/kit';
import { BlockSet, Bestiary, type BlockDef, type MonDef } from '../blocks/sets';
import { MON } from '../ids';

/** Every hazard in the kitchen is one touch: Doc Leo plays dead and the room starts over. */
export const KILL = -100;

function rot90(src: Pixels): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(19 - y, x, src.get(x, y));
  return p;
}

/** Monster block frames by kind: [pixels, block def]. */
const FRAMES: Record<string, [Pixels, BlockDef][]> = {
  squawk: [0, 1].map((i) => [squawkWave(i), {}]),
  kazooH: [0, 1].map((i) => [kazooWave(i), {}]),
  kazooV: [0, 1].map((i) => [rot90(kazooWave(i)), {}]),
  mouse: [0, 1].map((i) => [mouse(i), { score: -25 }]),
  mouseScared: [0, 1].map((i) => [mouse(i, true), {}]),
  pin: [0, 1, 2].map((i) => [rollingPin(i), { hp: KILL }]),
  knife: [0, 1].map((i) => [knife(i), { hp: KILL }]),
  redcoat: [0, 1].map((i) => [redcoat(i), { hp: KILL }]),
  redcoatRun: [0, 1].map((i) => [redcoat(i, true), {}]),
  ant: [0, 1].map((i) => [ant(i), { score: -10 }]),
  fireball: [0, 1].map((i) => [fireball(i), { hp: KILL }]),
  steam: [0, 1].map((i) => [steam(i), { hp: KILL }]),
  bubble: [0, 1].map((i) => [bubble(i), { hp: KILL }]),
  cork: [0, 1].map((i) => [cork(i), { hp: KILL }]),
  spark: [0, 1].map((i) => [spark(i), { hp: KILL }]),
  icicle: [[icicle(), { hp: KILL }]],
  flyingCap: [0, 1].map((i) => [flyingCap(i), { hp: KILL }]),
  teddy: [
    [corgi(0), {}],
    [corgi(1), {}],
  ],
  teddyL: [
    [corgi(0, true), {}],
    [corgi(1, true), {}],
  ],
  gwinn: [
    [gwinn(0), {}],
    [gwinn(1), {}],
  ],
};

export function buildMonsterBlocks(): BlockSet {
  const mb = new BlockSet(100, true);
  for (const [kind, frames] of Object.entries(FRAMES)) frames.forEach(([p, d], i) => mb.add(`${kind}#${i}`, p, d));
  return mb;
}

const pics = (kind: string, t: number): [string, number][] => FRAMES[kind].map((_, i) => [`${kind}#${i}`, t]);

/** A loop of moves [dx, dy, speed, orient?] (each from the last corner) as Game-Maker stores it. */
export function loop(name: string, moves: [number, number, number, number?][]): [number, number, number, number?][] {
  let x = 0;
  let y = 0;
  const out = moves.map(([dx, dy, speed, o]): [number, number, number, number?] => {
    x += dx;
    y += dy;
    return [x, y, speed, o];
  });
  if (x || y) throw new Error(`${name}: its patrol does not come back to where it started`);
  if (out.length > 10) throw new Error(`${name}: more than 10 corners`);
  return out;
}

/** What the rooms' spouts and tricks can make. */
export type Projectile = 'fireball' | 'steam' | 'bubble' | 'cork' | 'spark' | 'icicle' | 'flyingCap' | 'ant';
export type Dir = 'e' | 'w' | 's' | 'n';
const DIR = { e: [1, 0, 0], w: [-1, 0, 4], s: [0, 1, 1], n: [0, -1, 3] } as const;

/**
 * A room's bestiary with the fixed numbers filled in: the squawk (0), the kazoo blasts
 * (1..4), and whatever the room's spouts make (10..13: east, west, south, north), each
 * flying `reach` blocks before it fizzles.
 */
export function roomBestiary(mb: BlockSet, born: Partial<Record<Dir, { kind: Projectile; reach: number; speed?: number }>>): Bestiary {
  const b = new Bestiary(mb);
  b.add('squawk', { pics: pics('squawk', 2), power: 70, towards: 6, end: 12, thru: true }, MON.squawk);
  const kaz = (n: number, dx: number, dy: number, v: boolean, o: number) =>
    b.add(`kazoo${n}`, { pics: pics(v ? 'kazooV' : 'kazooH', 2), power: 75, path: [[dx * 5, dy * 5, 6, o]], end: -1, thru: true }, n);
  kaz(MON.kazooN, 0, -1, true, 0);
  kaz(MON.kazooE, 1, 0, false, 0);
  kaz(MON.kazooS, 0, 1, true, 0);
  kaz(MON.kazooW, -1, 0, false, 0);
  const slot = { e: MON.bornE, w: MON.bornW, s: MON.bornS, n: MON.bornN };
  for (const d of ['e', 'w', 's', 'n'] as const) {
    const spec = born[d] ?? { kind: 'steam' as Projectile, reach: 1 };
    const [dx, dy, o] = DIR[d];
    const speed = spec.speed ?? (spec.kind === 'ant' ? 1 : 3);
    const orient = spec.kind === 'icicle' || spec.kind === 'steam' || spec.kind === 'bubble' ? 0 : o;
    b.add(
      `born_${d}`,
      {
        pics: pics(spec.kind, 4),
        power: spec.kind === 'ant' ? 40 : 80,
        path: [[dx * spec.reach, dy * spec.reach, speed, orient]],
        end: -1,
        thru: spec.kind !== 'spark',
      },
      slot[d],
    );
  }
  return b;
}

/** The other kinds a room can place: walkers on patrols, chasers, and the dogs. */
export const KINDS = {
  mouse: (b: Bestiary) => {
    if (!b.has('mouseScared')) b.add('mouseScared', { pics: pics('mouseScared', 3), power: 72, towards: -3, end: 64, becomes: 'mouse', thru: true });
    if (!b.has('mouse')) b.add('mouse', { pics: pics('mouse', 5), power: 40, towards: 1, becomes: 'mouseScared', thru: true, upscore: 25 });
    return 'mouse';
  },
  pin: (b: Bestiary, path: [number, number, number][], tag = '') => patrol(b, `pin${tag}`, { pics: pics('pin', 3), power: 150, thru: true }, path),
  knife: (b: Bestiary, path: [number, number, number][], tag = '') => patrol(b, `knife${tag}`, { pics: pics('knife', 2), power: 150, thru: true }, path),
  ant: (b: Bestiary, path: [number, number, number][], tag = '') => patrol(b, `ant${tag}`, { pics: pics('ant', 4), power: 40, thru: true, upscore: 10 }, path),
  redcoat: (b: Bestiary, path: [number, number, number][], tag = '') => {
    const full = `redcoat${tag}@${path.map((p) => p.join(',')).join(';')}`;
    const run = `${full}~run`;
    if (!b.has(run)) b.add(run, { pics: pics('redcoatRun', 4), power: 72, towards: -2, end: 91, becomes: full, thru: true });
    if (!b.has(full)) b.add(full, { pics: pics('redcoat', 6), power: 50, becomes: run, thru: true, upscore: 50, path: loop(full, path) });
    return full;
  },
  teddy: (b: Bestiary, flip = false) => {
    const name = flip ? 'teddyL' : 'teddy';
    if (!b.has(name))
      b.add(name, {
        pics: [
          [`${name}#0`, 30],
          [`${name}#1`, 4],
          [`${name}#0`, 12],
          [`${name}#1`, 4],
        ],
        power: 200,
      });
    return name;
  },
  gwinn: (b: Bestiary) => {
    if (!b.has('gwinn')) b.add('gwinn', { pics: pics('gwinn', 5), power: 200, towards: 64, thru: true });
    return 'gwinn';
  },
};

function patrol(b: Bestiary, name: string, def: MonDef, path: [number, number, number][]): string {
  const full = `${name}@${path.map((p) => p.join(',')).join(';')}`;
  if (!b.has(full)) b.add(full, { ...def, path: loop(full, path) });
  return full;
}
