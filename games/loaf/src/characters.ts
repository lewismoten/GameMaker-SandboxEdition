// LOAF.CHR and BUNDLE.CHR (Loaf #13: roll steady, rise as high as good dough will, hunker
// down, and sing "I'm still bread!"; its crust, lives, holy crumbs and baskets) and the .MON file
// each level loads.
//
// Gravity does the platforming: air blocks pull down, so rising is an upward push each tick Up is
// held (gravity takes one more away every tick), and Q/E rise up and sideways at once (Game-Maker
// follows one key at a time). The weave inside a basket has no gravity, so in it Up and Down climb.
// The loaf has no way to fight: big hungry things (power 150, solid) take a bite when you bump
// into them and push you back; a brother loaf or the mustard seed (under 100) is just a hello.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { CHARBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { BASKETS, CRUMBS, KEY, MON, SEQ, SND } from './ids';
import type { buildCharBlocks, buildMonsterBlocks, Form } from './sprites/sprites';

export type { Form };

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right

/** Pixels a tick rolling: steady (a block in five ticks), as quick as rising sideways. */
export const STEP = 4;
/** Pixels a tick sideways while rising. */
export const RISE_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const RISE = 12;
/** Pixels a tick down (climbing down the weave, hunkering). */
export const DOWN_STEP = 3;

type F = { pic: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** The loaf's character file, plain or wrapped in the child's cloth. */
export function buildLoaf(cb: ReturnType<typeof buildCharBlocks>, form: Form): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const n = (pic: string) => cb.n(`${form}.${pic}`);
  const f = (o: F): Frame => ({ ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: CHARBL, pic2: n(o.pic), pause: o.pause ?? 1, orient: o.mirror ? MIRROR : 0 });

  set(S[SEQ.idle], [
    f({ pic: 'front', pause: 30 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 24 }),
    f({ pic: 'hunker', pause: 4 }),
    f({ pic: 'rise', pause: 4 }),
    f({ pic: 'front', pause: 18 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 20 }),
  ]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 3 }), f({ pic: 'crumble0', pause: 8 }), f({ pic: 'crumble1', pause: 30 })], { sound: SND.crumble, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'front', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'front', pause: 1 })], {
    sound: SND.hurt,
    jstkBut: 0,
  });
  set(S[3], [f({ pic: 'front' })], { key: 0 });
  set(S[4], [f({ pic: 'front' })], { key: 0 });

  // rolling: four quarter turns (the bundle waddles)
  const roll = (dx: number, mirror: boolean) => ['roll0', 'roll1', 'roll2', 'roll3'].map((pic) => f({ pic, x: dx, mirror }));
  set(S[SEQ.right], roll(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], roll(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], roll(STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], roll(-STEP, true), { key: KEY.a });
  // rising, like good dough
  const rise = [f({ pic: 'rise', y: -RISE })];
  set(S[SEQ.rise], rise, { key: KEY.up, jstkMov: JOY.up, sound: SND.rise });
  set(S[SEQ.riseW], rise, { key: KEY.w, sound: SND.rise });
  const side = (dx: number, mirror: boolean) => [f({ pic: 'riseSide', x: dx, y: -RISE, mirror }), f({ pic: 'riseSide', x: dx, y: -RISE, mirror })];
  set(S[SEQ.riseLeft], side(-RISE_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.rise });
  set(S[SEQ.riseRight], side(RISE_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.rise });
  set(S[SEQ.riseLeft7], side(-RISE_STEP, true), { key: KEY.home, sound: SND.rise });
  set(S[SEQ.riseRight9], side(RISE_STEP, false), { key: KEY.pgup, sound: SND.rise });
  // Down: hunker down (and climb down the weave)
  const down = [f({ pic: 'hunker', y: DOWN_STEP, pause: 2 }), f({ pic: 'front', y: DOWN_STEP, pause: 2 })];
  set(S[SEQ.down], down, { key: KEY.down, jstkMov: JOY.down, sound: SND.roll });
  set(S[SEQ.downS], down, { key: KEY.s, sound: SND.roll });
  // "I'm still bread!": it puffs up and sings
  const bread = [
    f({ pic: 'bread0', pause: 5 }),
    f({ pic: 'bread1', pause: 6 }),
    f({ pic: 'bread0', pause: 5 }),
    f({ pic: 'bread1', pause: 8 }),
    f({ pic: 'front', pause: 2 }),
  ];
  set(S[SEQ.bread], bread, { key: KEY.space, sound: SND.bread, norepeat: 1, jstkMov: JOY.any, jstkBut: 1 });
  set(S[SEQ.breadB], bread, { key: KEY.b, sound: SND.bread, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // crust (health)
  ch.meter[1] = 3; // lives
  ch.meter[CRUMBS] = 1; // shown as meter - 1: none yet
  ch.meter[BASKETS] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

/** Back and forth `run` blocks (to the right first) at `speed`, facing the way it goes. */
const pace = (run: number, speed: number, dy = 0): March[] => [corner(0, 0, speed), corner(run, dy, speed, 0), corner(0, 0, speed, 4)];

/** Game ticks a march segment of `blocks` takes at `speed` (PLAYGAME's Bresenhams: one more tick to see it's done). */
const segTicks = (blocks: number, speed: number): number => {
  const px = Math.abs(blocks) * 20;
  return px % speed === 0 ? px / speed + 1 : Math.ceil(px / speed);
};

type Pic = [number, number];

/** Pictures for a run of `ticks`: `frames` in turn, `t` ticks each, the last taking what is left. */
function phase(ticks: number, frames: number[], t: number): Pic[] {
  const out: Pic[] = [];
  for (let left = ticks, i = 0; left > 0; i++) {
    const n = left < 2 * t ? left : t;
    out.push([frames[i % frames.length], n]);
    left -= n;
  }
  return out;
}

/**
 * A walker that stops at each end of its beat before it turns: back and forth `run` blocks at
 * `speed`, and at each end it pushes down against the ground it stands on (a march corner a block
 * down: it can't go, so it stands still for 21 ticks) and shows its `stop` picture, so you see it
 * stop and know when it sets off. Its pictures run in step with the march (MOVEALLMONS animates
 * and moves every monster each tick, from the moment the level starts), `t` ticks a step or more
 * so they fit Game-Maker's 20 picture slots.
 */
function patrol(run: number, speed: number, walk: [number, number], stop: number, t: number): { path: March[]; pics: Pic[] } {
  const go = segTicks(run, speed);
  const rest = segTicks(1, 1);
  const path = [corner(0, 0, speed), corner(run, 0, speed, 0), corner(run, 1, 1, 0), corner(0, 1, speed, 4), corner(0, 2, 1, 4)];
  for (let tt = t; ; tt++) {
    const pics = [...phase(1 + go, walk, tt), [stop, rest] as Pic, ...phase(go, walk, tt), [stop, rest] as Pic];
    if (pics.length <= 20) return { path, pics };
  }
}

export interface MonsterOptions {
  /** Blocks a hungry man stomps before turning round. */
  feet?: number;
  /** Blocks a mouse runs before it sits up and turns round. */
  mouse?: number;
  /** Blocks the fox trots before it stops to sniff and turns round. */
  fox?: number;
  /** How far a hand reaches down (blocks). */
  reach?: number;
  /** How far the fish fly (blocks). */
  fish?: number;
  /** Blocks the girl walks before turning back. */
  girl?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  const reach = o.reach ?? 3;
  // A hand winds up first: it draws back a block, a fist shaking, then reaches down open and
  // comes back up closing on nothing.
  const windUp = 1 + segTicks(1, 1);
  set[MON.hand] = mon(
    [...phase(windUp, [n('fist0'), n('fist1')], 3), [n('hand0'), segTicks(reach + 1, 2)], [n('hand1'), segTicks(reach, 2)]],
    { power: 150, thru: 0 },
    [corner(0, 0, 1), corner(0, -1, 1), corner(0, reach, 2), corner(0, 0, 2)],
  );
  // Fish fly out of a fish basket in an arc and flop where they land.
  const far = o.fish ?? 7;
  const arc = (dir: number): March[] => [
    corner(0, 0, 4),
    corner(dir, -2, 4, dir > 0 ? 0 : 4),
    corner(dir * 3, -4, 4, dir > 0 ? 0 : 4),
    corner(dir * (far - 2), -3, 4, dir > 0 ? 0 : 4),
    corner(dir * far, 0, 4, dir > 0 ? 0 : 4),
  ];
  set[MON.fishR] = mon(anim('fish0', 'fish1', 2), { power: 150, thru: 0, end: -1, newmon: MON.flop }, arc(1));
  set[MON.fishL] = mon(anim('fish0', 'fish1', 2), { power: 150, thru: 0, end: -1, newmon: MON.flop }, arc(-1));
  set[MON.flop] = mon([[n('flop'), 4]], { power: 100, thru: 0, end: 10 });
  // Brother loaves passed hand to hand overhead: say hello and off he goes.
  set[MON.brother] = mon(anim('brother0', 'brother1', 4), { power: 50, thru: 0, newmon: MON.brotherOff }, [
    corner(0, 0, 2),
    corner(4, -1, 2, 0),
    corner(8, 0, 2, 0),
    corner(4, -1, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  set[MON.brotherOff] = mon(anim('brotherOff0', 'brotherOff1', 2), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 5), corner(5, -6, 5, 0)]);
  set[MON.gull] = mon(anim('gull0', 'gull1', 3), { power: 150, thru: 0 }, [corner(0, 0, 2), corner(6, -1, 2, 0), corner(6, 1, 2, 0), corner(0, 0, 2, 4)]);
  const walker = (run: number, speed: number, a: string, stop: string, t: number, o2: Partial<Monster> = {}) => {
    const p = patrol(run, speed, [n(`${a}0`), n(`${a}1`)], n(stop), t);
    return mon(p.pics, { power: 150, thru: 1, ...o2 }, p.path);
  };
  set[MON.man] = walker(o.feet ?? 4, 1, 'feet', 'feetStand', 5);
  set[MON.goat] = mon(anim('goat0', 'goat1', 10), { power: 200, thru: 1 }, pace(3, 1));
  set[MON.weevil] = walker(3, 1, 'weevil', 'weevilStop', 4);
  set[MON.mouse] = walker(o.mouse ?? 4, 2, 'mouse', 'mouseSit', 3);
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 0, newmon: MON.seedOff }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.seedOff] = mon(anim('seed1', 'seed0', 3), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(3, -2, 3, 0), corner(6, 0, 3, 0)]);
  set[MON.fox] = walker(o.fox ?? 5, 2, 'fox', 'foxSniff', 3);
  set[MON.owl] = mon(anim('owl0', 'owl1', 4), { power: 150, thru: 0 }, [
    corner(0, 0, 2),
    corner(4, 3, 3, 0),
    corner(8, 0, 2, 0),
    corner(4, 3, 3, 4),
    corner(0, 0, 2, 4),
  ]);
  set[MON.dog] = walker(4, 2, 'dog', 'dogSniff', 3);
  set[MON.moth] = mon(anim('moth0', 'moth1', 2), { power: 150, thru: 0 }, [
    corner(0, 0, 1),
    corner(1, -1, 1, 0),
    corner(2, 0, 1, 0),
    corner(1, 1, 1, 4),
    corner(0, 0, 1, 4),
  ]);
  set[MON.camelA] = mon(anim('camelA0', 'camelA1', 30), { power: 200, thru: 1 }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.camelB] = mon(anim('camelB0', 'camelB1', 30), { power: 200, thru: 1 }, [corner(0, 0, 1), corner(0, 0, 1)]);
  const girl = o.girl ?? 6;
  set[MON.girlA] = mon(anim('girlA0', 'girlA1', 6), { power: 200, thru: 0 }, pace(girl, 1));
  set[MON.girlB] = mon(anim('girlB0', 'girlB1', 6), { power: 200, thru: 0 }, pace(girl, 1));
  return set;
}

export { MON };
