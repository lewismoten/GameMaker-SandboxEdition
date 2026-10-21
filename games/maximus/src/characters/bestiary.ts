// Monster sets: a .MBL of 100 monster blocks and a .MON of 64 monsters, built from a list
// of creature designs. Slots 44..63 are the same in every set: the courier's shots, the
// loot creatures drop and the sparks (see common.ts MON), drawn in shared colors.
import { Pixels } from '../../../kit/pixels';
import { MONBL, SOLTOP, emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { LASTMON, LASTSL, MAXMARCH, emptyMonster, type Monster } from '../../../../web/src/formats/monster';
import { CLEAR, Mask, fill, outline, shade, sprite } from '../art/draw';
import { MBL_SHARED_BASE, MON, MONEY } from '../ids';
import { drawCreature, type Archetype, type Paint } from '../sprites/creatures';
import { drawPickup } from '../blocks/items';
import { OUTLINE, S, WHITE, shared } from '../art/palette';
import { R } from '../blocks/surface';

export type Corner = [dx: number, dy: number, speed: number, orient?: number];

export type Move =
  | { kind: 'still' }
  | { kind: 'path'; corners: Corner[] }
  | { kind: 'towards'; speed: number }
  | { kind: 'away'; speed: number }
  | { kind: 'random'; speed: number };

export type Placement = 'ground' | 'cave' | 'air' | 'sky' | 'ceiling' | 'liquid' | 'birth' | 'rare' | 'vault' | 'platform' | 'none';

export interface Creature {
  name: string;
  /** What the manual says about it. */
  note: string;
  arch: Archetype;
  hide: string;
  accent?: string;
  size?: number;
  spikes?: boolean;
  horns?: boolean;
  /** Frames of art to use (1..3). */
  frames?: number;
  /** Ticks per animation frame. */
  anim?: number;
  /** Use the art of another creature (by name) instead of drawing (palette twins). */
  artOf?: string;
  move: Move;
  /** Attack path when the courier comes near: relative to the courier (2) or the monster (1). */
  attack?: { relative: boolean; corners: Corner[] };
  power: number;
  /** Hit points taken on contact (positive number). */
  dmg: number;
  score: number;
  /** Lifetime in ticks (0 = until killed, -1 = dies when its path ends, -2 never dies). */
  end?: number;
  /** Creature (by name) or shared monster slot (by number) it turns into when killed. */
  becomes?: string | number;
  /** Walls stop it (default true). */
  walls?: boolean;
  place: Placement;
  /** Extra block attributes (loot creatures give money, platforms are solid). */
  block?: Partial<Block>;
}

export interface MonsterSet {
  name: string;
  mbl: Block[];
  mon: Monster[];
  creatures: Creature[];
  /** monster index by creature name */
  index: Map<string, number>;
  blocksUsed: number;
}

const ramp = (n: string) => shared.get(n) ?? R(n);
const paintOf = (c: Creature): Paint => ({ hide: ramp(c.hide), accent: ramp(c.accent ?? 'accent'), eye: R('eye') });

/** Build the set. `creatures` fills slots 0..43. */
export function monsterSet(name: string, creatures: Creature[]): MonsterSet {
  if (creatures.length !== MON.creatures) throw new Error(`${name}: ${creatures.length} creatures, need ${MON.creatures}`);
  const mbl: Block[] = Array.from({ length: MONBL }, (_, i) => emptyBlock(i, true));
  const mon: Monster[] = Array.from({ length: LASTMON }, () => emptyMonster());
  const index = new Map<string, number>();
  creatures.forEach((c, i) => index.set(c.name, i));
  let next = 0;
  const art = new Map<string, number[]>();
  const addBlock = (p: Pixels, props: Partial<Block>): number => {
    if (next >= MBL_SHARED_BASE) throw new Error(`${name}: monster blocks overflow`);
    const b = mbl[next];
    b.pixels.set(p.px);
    Object.assign(b, props);
    return next++;
  };
  creatures.forEach((c, i) => {
    // monsters nothing can kill keep hurting every tick you touch them: they bite softly
    const dmg = c.power >= 100 ? Math.min(c.dmg, 5) : c.dmg;
    const props: Partial<Block> = { chHitPt: -dmg, ...c.block };
    let pics: number[];
    if (c.artOf && art.has(c.artOf) && !c.block && creatures[index.get(c.artOf)!].dmg === c.dmg) pics = art.get(c.artOf)!;
    else {
      const frames = drawCreature({ arch: c.arch, paint: paintOf(c), size: c.size, spikes: c.spikes, horns: c.horns, seed: i * 13 + 5 }).slice(
        0,
        c.frames ?? 2,
      );
      pics = frames.map((f) => addBlock(f, props));
    }
    art.set(c.name, pics);
    mon[i] = makeMonster(c, pics, c.becomes === undefined ? undefined : typeof c.becomes === 'number' ? c.becomes : index.get(c.becomes));
  });
  const blocksUsed = next;
  // fill any spare creature slots with alternate frames so every block holds art
  const spare = MBL_SHARED_BASE - next;
  for (let k = 0; k < spare; k++) {
    const c = creatures[k % creatures.length];
    const f = drawCreature({ arch: c.arch, paint: paintOf(c), size: (c.size ?? 1) * 0.85, seed: 900 + k })[k % 2];
    addBlock(f, { chHitPt: -c.dmg });
  }
  sharedMonsters(mbl, mon);
  return { name, mbl, mon, creatures, index, blocksUsed };
}

function makeMonster(c: Creature, pics: number[], becomes: number | undefined): Monster {
  const m = emptyMonster();
  m.used = 1;
  m.power = c.power;
  m.thru = c.walls === false ? 0 : 1;
  m.upscore = c.score;
  m.newmon = becomes ?? LASTMON;
  m.end = c.end ?? 0;
  const anim = c.anim ?? 6;
  // PLAYGAME steps through 20 animation slots (the 21st is never reached): fill them all,
  // the drawn frames cycling with a little swing in their timing so no two monsters of a
  // kind flap in lockstep for long
  const swing = [0, 1, 0, -1, 0, 2, 0, -1, 1, 0, 0, 1, 0, -1, 0, 2, -1, 0, 1, 0];
  m.pic = Array.from(
    { length: LASTSL + 1 },
    (_, k) => (k < LASTSL ? [pics[k % pics.length], Math.max(1, anim + (pics.length > 1 ? swing[k] : 0))] : [100, 1]) as [number, number],
  );
  switch (c.move.kind) {
    case 'still':
      break;
    case 'path':
      setPath(m, 0, c.move.corners);
      break;
    case 'towards':
      m.towards = c.move.speed;
      break;
    case 'away':
      m.towards = -c.move.speed;
      break;
    case 'random':
      m.towards = 64 * c.move.speed;
      break;
  }
  if (c.attack) {
    m.activate = c.attack.relative ? 2 : 1;
    // attack paths start at corner 1; corner 0 is the reference point
    setPath(m, 1, [[0, 0, 1], ...c.attack.corners]);
  }
  return m;
}

function setPath(m: Monster, which: 0 | 1, corners: Corner[]): void {
  if (corners.length > MAXMARCH) throw new Error('too many corners');
  m.march[which] = Array.from({ length: MAXMARCH }, (_, k) =>
    k < corners.length ? { x: corners[k][0], y: corners[k][1], pic: corners[k][2], orient: corners[k][3] ?? 0 } : { x: 0, y: 0, pic: 0, orient: 0 },
  );
}

// ------------------------------------------------------------------ paths

/** Back and forth along a run of `n` blocks (art faces right; mirrored going left). */
export const pace = (n: number, speed: number): Corner[] => [
  [n, 0, speed, 0],
  [0, 0, speed, 4],
];
/** Up and down. */
export const bob = (n: number, speed: number): Corner[] => [
  [0, -n, speed, 0],
  [0, 0, speed, 0],
];
/** Hopping arcs along a run. */
export const hops = (n: number, speed: number, h = 1): Corner[] => {
  const c: Corner[] = [];
  const steps = Math.min(4, n);
  for (let i = 1; i <= steps; i++) c.push([Math.round((n * (i - 0.5)) / steps), -h, speed, 0], [Math.round((n * i) / steps), 0, speed, 0]);
  return c.slice(0, 8).concat([
    [Math.round(n / 2), -h, speed, 4],
    [0, 0, speed, 4],
  ]);
};
/** A loop around a square of side n. */
export const loop = (n: number, speed: number): Corner[] => [
  [n, 0, speed, 0],
  [n, n, speed, 0],
  [0, n, speed, 4],
  [0, 0, speed, 4],
];
/** A figure eight. */
export const eight = (n: number, speed: number): Corner[] => [
  [n, -n, speed, 0],
  [2 * n, 0, speed, 0],
  [n, n, speed, 4],
  [0, 0, speed, 4],
  [-n, -n, speed, 4],
  [-2 * n, 0, speed, 4],
  [-n, n, speed, 0],
  [0, 0, speed, 0],
];

// ------------------------------------------------------------------ shared slots 44..63

function sharedArt(): Pixels[] {
  const out: Pixels[] = [];
  const P = (fn: (p: Pixels) => void) => {
    const p = sprite();
    fn(p);
    out.push(p);
  };
  const R2 = (n: string) => shared.get(n)!;
  // 80, 81 bolt
  for (const k of [0, 1])
    P((p) => {
      fill(p, new Mask().ellipse(11, 10, 7, 1.8 + k * 0.4), R2('laser')[2]);
      fill(p, new Mask().ellipse(12, 10, 5, 0.9), WHITE);
      p.set(3 - k, 10, R2('laser')[1]).set(1, 10, R2('laser')[0]);
    });
  // 82, 83 plasma
  for (const k of [0, 1])
    P((p) => {
      shade(p, new Mask().ellipse(12, 10, 5 + k, 4), R2('plasma'));
      fill(p, new Mask().ellipse(13, 10, 2, 2), WHITE);
      for (let i = 0; i < 3; i++) p.set(4 - i * 1.5, 8 + ((i + k) % 3) * 2, R2('plasma')[1]);
    });
  // 84, 85 shield orb
  for (const k of [0, 1])
    P((p) => {
      const ring = new Mask().ellipse(10, 10, 7, 7).minus(new Mask().ellipse(10, 10, 5, 5));
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (ring.get(x, y) && (x + y + k * 2) % 4 < 3) p.set(x, y, R2('visor')[(x + k) % 4]);
      fill(p, new Mask().ellipse(10, 10, 2, 2), WHITE);
    });
  // 86, 87 mine
  for (const k of [0, 1])
    P((p) => {
      shade(p, new Mask().ellipse(10, 14, 5, 4), R2('metal').slice(0, 5));
      p.line(10, 9, 10, 6, R2('metal')[3]);
      fill(p, new Mask().ellipse(10, 6, 1.6, 1.6), k ? R2('heart')[3] : R2('heart')[1]);
      p.set(6, 14, R2('flame')[3]).set(14, 14, R2('flame')[3]);
      outline(p, OUTLINE);
    });
  // 88, 89 nova spark
  for (const k of [0, 1])
    P((p) => {
      shade(p, new Mask().ellipse(10, 10, 4 - k, 4 - k), R2('nova'));
      for (let a = 0; a < 4; a++) p.line(10, 10, 10 + Math.cos(a * 1.57 + k * 0.78) * 7, 10 + Math.sin(a * 1.57 + k * 0.78) * 7, R2('nova')[3]);
      p.set(10, 10, WHITE);
    });
  // 90 flak shell
  P((p) => {
    shade(p, new Mask().ellipse(10, 9, 2.4, 4), R2('laser'));
    fill(
      p,
      new Mask().poly([
        [8, 13],
        [12, 13],
        [10, 18],
      ]),
      R2('flame')[4],
    );
    outline(p, OUTLINE);
  });
  // 91 heal pod, 92 heal glow
  P((p) => {
    shade(p, new Mask().rect(6, 6, 8, 8), [R2('metal')[4], R2('metal')[5], WHITE]);
    fill(p, new Mask().rect(9, 7, 2, 6).rect(7, 9, 6, 2), R2('heart')[2]);
    outline(p, OUTLINE);
  });
  P((p) => {
    for (let i = 0; i < 9; i++) p.set(4 + ((i * 7) % 12), 3 + ((i * 5) % 14), i % 2 ? R2('heart')[3] : WHITE);
    fill(p, new Mask().rect(9, 6, 2, 8).rect(6, 9, 8, 2), R2('heart')[3]);
  });
  // 93, 94 spark
  for (const k of [0, 1])
    P((p) => {
      for (let a = 0; a < 8; a++) {
        const rr = 2 + k * 3;
        p.set(10 + Math.cos(a * 0.785) * rr, 10 + Math.sin(a * 0.785) * rr, R2('flame')[5 - k * 2]);
      }
      p.set(10, 10, k ? R2('flame')[3] : WHITE);
    });
  // 95 credit, 96 heart, 97 gem (loot)
  out.push(drawPickup('credit'), drawPickup('heart'), drawPickup('gem'));
  // 98, 99 enemy shot
  for (const k of [0, 1])
    P((p) => {
      shade(p, new Mask().ellipse(10, 10, 4 + k, 4 + k), R2('flame').slice(1));
      fill(p, new Mask().ellipse(9, 9, 1.5, 1.5), WHITE);
      outline(p, OUTLINE);
    });
  return out;
}

export const SHARED_ART = {
  bolt: 80,
  plasma: 82,
  shield: 84,
  mine: 86,
  nova: 88,
  flak: 90,
  healPod: 91,
  healGlow: 92,
  spark: 93,
  credit: 95,
  heart: 96,
  gem: 97,
  shot: 98,
};

function sharedMonsters(mbl: Block[], mon: Monster[]): void {
  sharedArt().forEach((p, k) => {
    const b = mbl[MBL_SHARED_BASE + k];
    b.pixels.set(p.px.map((c) => (c === CLEAR ? CLEAR : c)));
  });
  const A = SHARED_ART;
  const blk = (i: number, props: Partial<Block>) => Object.assign(mbl[i], props);
  blk(A.healGlow, { chHitPt: 30 });
  blk(A.credit, { effect: MONEY, eamt: 5, scorePts: 25 });
  blk(A.heart, { chHitPt: 10 });
  blk(A.gem, { scorePts: 150 });
  blk(A.shot, { chHitPt: -6 });
  blk(A.shot + 1, { chHitPt: -6 });
  const M = (i: number, o: Partial<Monster> & { pics: [number, number][] }) => {
    const m = emptyMonster();
    m.used = 1;
    const { pics, ...rest } = o;
    m.pic = Array.from({ length: LASTSL + 1 }, (_, k) => (k < pics.length ? pics[k] : [100, 1]) as [number, number]);
    Object.assign(m, rest);
    mon[i] = m;
  };
  const path = (corners: Corner[]) => {
    const t = emptyMonster();
    setPath(t, 0, corners);
    return t.march;
  };
  M(MON.healPod, { pics: [[A.healPod, 1]], end: 2, power: 1, thru: 0, newmon: MON.healGlow });
  M(MON.healGlow, { pics: [[A.healGlow, 3]], end: 20, power: 1, thru: 0 });
  M(MON.flakL, { pics: [[A.flak, 2]], march: path([[-2, -8, 9]]), end: 16, power: 45, newmon: MON.spark });
  M(MON.flakR, { pics: [[A.flak, 2]], march: path([[2, -8, 9]]), end: 16, power: 45, newmon: MON.spark });
  M(MON.credit, { pics: [[A.credit, 4]], end: 240, power: 2, thru: 0 });
  M(MON.heart, { pics: [[A.heart, 4]], end: 240, power: 2, thru: 0 });
  M(MON.gem, { pics: [[A.gem, 4]], end: 240, power: 2, thru: 0 });
  M(MON.spark, {
    pics: [
      [A.spark, 2],
      [A.spark + 1, 2],
    ],
    end: 4,
    power: 1,
    thru: 0,
  });
  M(MON.bolt, {
    pics: [
      [A.bolt, 2],
      [A.bolt + 1, 2],
    ],
    towards: 10,
    end: 22,
    power: 40,
    newmon: MON.spark,
  });
  M(MON.plasma, {
    pics: [
      [A.plasma, 2],
      [A.plasma + 1, 2],
    ],
    towards: 8,
    end: 32,
    power: 75,
    newmon: MON.spark,
  });
  M(MON.shield, {
    pics: [
      [A.shield, 2],
      [A.shield + 1, 2],
    ],
    march: path([
      [1, -1, 4],
      [1, 1, 4],
      [-1, 1, 4],
      [-1, -1, 4],
      [0, 0, 4],
    ]),
    end: 140,
    power: 90,
    thru: 0,
  });
  M(MON.mine, {
    pics: [
      [A.mine, 6],
      [A.mine + 1, 3],
    ],
    end: 400,
    power: 70,
    thru: 0,
    newmon: MON.spark,
  });
  const dirs: [number, number][] = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];
  dirs.forEach(([dx, dy], k) =>
    M(MON.nova + k, {
      pics: [
        [A.nova, 2],
        [A.nova + 1, 2],
      ],
      march: path([[dx * 9, dy * 9, 9]]),
      end: 13,
      power: 60,
      newmon: MON.spark,
    }),
  );
}

export { SOLTOP, S };
