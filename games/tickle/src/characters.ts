// LEO.CHR (Doc Leo: walk, hop as high as a clown in red sneakers can, PIN, TICKLE and the
// maniacal laugh; his rapport, lives and the laughing carpet) and the .MON file each level loads.
//
// Gravity does the platforming: air pulls down, so a hop is an upward push each tick Up is held
// (gravity takes one more away every tick), and Q/E hop up and sideways at once (Game-Maker
// follows one key at a time). PIN and TICKLE send out a hand to each side (see ids.ts for how a
// pin, a tickle and the rats' shapes make "pin first, then tickle" the only way a rat laughs).
import { MONBL } from '../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { CARPET, KEY, MON, POWER, SEQ, SND } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right

/** Pixels a tick walking. */
export const STEP = 4;
/** Pixels a tick sideways while hopping. */
export const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const HOP = 12;
/** Pixels a tick a hand flies out, and how many blocks it reaches. */
export const HAND_SPEED = 4;
export const HAND_REACH = 2;

type F = { pose: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** A frame that gives birth to a monster in Doc Leo's bottom row. */
function birth(mon: number): Frame {
  return { ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 1 };
}

/** Doc Leo's character file. */
export function buildLeo(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => {
    const pose = cb.poses.get(o.pose);
    if (!pose) throw new Error(`No pose ${o.pose}`);
    return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: cb.n(pose[0]), pic2: cb.n(pose[1]), pause: o.pause ?? 1, orient: o.mirror ? MIRROR : 0 };
  };

  set(S[SEQ.idle], [
    f({ pose: 'front', pause: 30 }),
    f({ pose: 'blink', pause: 3 }),
    f({ pose: 'front', pause: 24 }),
    f({ pose: 'grin', pause: 14 }),
    f({ pose: 'front', pause: 18 }),
    f({ pose: 'blink', pause: 3 }),
    f({ pose: 'tickle0', pause: 3 }),
    f({ pose: 'tickle1', pause: 3 }),
    f({ pose: 'front', pause: 20 }),
  ]);
  set(S[SEQ.die], [f({ pose: 'hurt', pause: 3 }), f({ pose: 'die0', pause: 8 }), f({ pose: 'die1', pause: 30 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pose: 'hurt', pause: 2 }), f({ pose: 'front', pause: 1 }), f({ pose: 'hurt', pause: 2 }), f({ pose: 'front', pause: 1 })], {
    sound: SND.dread,
    jstkBut: 0,
  });
  set(S[3], [f({ pose: 'front' })], { key: 0 });
  set(S[4], [f({ pose: 'front' })], { key: 0 });

  // walking: a four-step stride in the red sneakers
  const walk = (dx: number, mirror: boolean) => [0, 1, 2, 3].map((s) => f({ pose: `walk${s}`, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right, sound: SND.step });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left, sound: SND.step });
  set(S[SEQ.rightD], walk(STEP, false), { key: KEY.d, sound: SND.step });
  set(S[SEQ.leftA], walk(-STEP, true), { key: KEY.a, sound: SND.step });
  // hopping
  const hop = [f({ pose: 'hop', y: -HOP })];
  set(S[SEQ.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SEQ.hopW], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f({ pose: 'hopSide', x: dx, y: -HOP, mirror }), f({ pose: 'hopSide', x: dx, y: -HOP, mirror })];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  set(S[SEQ.hopLeft7], side(-HOP_STEP, true), { key: KEY.home, sound: SND.hop });
  set(S[SEQ.hopRight9], side(HOP_STEP, false), { key: KEY.pgup, sound: SND.hop });
  // PIN: crouch, both hands press down to the sides (it can't be cut short)
  const pin = [f({ pose: 'pin', pause: 2 }), birth(MON.pinR), birth(MON.pinL), f({ pose: 'pin', pause: 6 }), f({ pose: 'front', pause: 2 })];
  set(S[SEQ.pin], pin, { key: KEY.down, sound: SND.pin, norepeat: 1, ground: 1, jstkMov: JOY.down });
  set(S[SEQ.pinZ], pin, { key: KEY.z, sound: SND.pin, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 });
  // TICKLE: fingers out to both sides, wiggling
  const tickle = [
    f({ pose: 'tickle0', pause: 2 }),
    birth(MON.tickleR),
    birth(MON.tickleL),
    f({ pose: 'tickle1', pause: 2 }),
    f({ pose: 'tickle0', pause: 2 }),
    f({ pose: 'tickle1', pause: 2 }),
    f({ pose: 'tickle0', pause: 2 }),
    f({ pose: 'front', pause: 1 }),
  ];
  set(S[SEQ.tickle], tickle, { key: KEY.space, sound: SND.tickle, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 2 });
  set(S[SEQ.tickleX], tickle, { key: KEY.x, sound: SND.tickle, norepeat: 1, ground: 1 });
  // the maniacal laugh: MWA-HA-HA-HA!
  const laugh = [
    f({ pose: 'laugh0', pause: 3 }),
    f({ pose: 'laugh1', pause: 3 }),
    f({ pose: 'laugh0', pause: 3 }),
    f({ pose: 'laugh1', pause: 3 }),
    f({ pose: 'laugh0', pause: 4 }),
    f({ pose: 'grin', pause: 3 }),
  ];
  set(S[SEQ.laugh], laugh, { key: KEY.l, sound: SND.laugh, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // rapport (health)
  ch.meter[1] = 3; // lives
  ch.meter[CARPET] = 1; // shown as meter - 1: no rats yet
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
const pace = (run: number, speed: number): March[] => [corner(0, 0, speed), corner(run, 0, speed, 0), corner(0, 0, speed, 4)];
const still: March[] = [corner(0, 0, 1), corner(0, 0, 1)];

export interface MonsterOptions {
  /** Blocks a slow rat pads along before turning round. */
  rat?: number;
  /** Blocks a tense rat dashes. */
  tense?: number;
  /** Blocks the floor buffer whirs. */
  buffer?: number;
  /** Blocks Dean Dour paces. */
  dean?: number;
  /** Blocks the alligator swims. */
  gator?: number;
  /** Blocks the pigeon flies. */
  pigeon?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  // Doc Leo's hands: out two blocks to each side, then gone
  const out = (dir: number): March[] => [corner(0, 0, HAND_SPEED), corner(dir * HAND_REACH, 0, HAND_SPEED, dir > 0 ? 0 : 4)];
  set[MON.pinR] = mon(anim('pin0', 'pin1', 2), { power: POWER.pin, thru: 0, end: -1 }, out(1));
  set[MON.pinL] = mon(anim('pin0', 'pin1', 2), { power: POWER.pin, thru: 0, end: -1 }, out(-1));
  set[MON.tickleR] = mon(anim('tickle0', 'tickle1', 1), { power: POWER.tickle, thru: 0, end: -1 }, out(1));
  set[MON.tickleL] = mon(anim('tickle0', 'tickle1', 1), { power: POWER.tickle, thru: 0, end: -1 }, out(-1));
  // the rats, white and wild: wary -> pinned -> giggling -> off to the carpet
  const rats = (fur: 'lab' | 'wild', ids: { rat: number; tense: number; pinned: number; giggle: number; off: number }) => {
    set[ids.rat] = mon(anim(`${fur}.rat0`, `${fur}.rat1`, 5), { power: POWER.rat, thru: 1, newmon: ids.pinned }, pace(o.rat ?? 3, 1));
    set[ids.tense] = mon(anim(`${fur}.tense0`, `${fur}.tense1`, 2), { power: POWER.rat, thru: 1, newmon: ids.pinned }, pace(o.tense ?? 4, 2));
    set[ids.pinned] = mon(anim(`${fur}.pinned0`, `${fur}.pinned1`, 3), { power: POWER.pinned, thru: 1, newmon: ids.giggle }, still);
    // it comes to Doc Leo's hand
    set[ids.giggle] = mon(anim(`${fur}.giggle0`, `${fur}.giggle1`, 3), { power: POWER.hello, thru: 1, towards: 2, newmon: ids.off });
    // and skips off to join the others
    set[ids.off] = mon(anim(`${fur}.off0`, `${fur}.off1`, 2), { power: 100, thru: 0, towards: -5, end: 24 });
  };
  rats('lab', { rat: MON.labRat, tense: MON.labTense, pinned: MON.labPinned, giggle: MON.labGiggle, off: MON.labOff });
  rats('wild', { rat: MON.wildRat, tense: MON.wildTense, pinned: MON.wildPinned, giggle: MON.wildGiggle, off: MON.wildOff });
  // hazards
  set[MON.buffer] = mon(anim('buffer0', 'buffer1', 2), { power: POWER.hazard, thru: 1 }, pace(o.buffer ?? 4, 2));
  set[MON.deanA] = mon(anim('deanA0', 'deanA1', 8), { power: POWER.hazard, thru: 0 }, pace(o.dean ?? 4, 1));
  set[MON.deanB] = mon(anim('deanB0', 'deanB1', 8), { power: POWER.hazard, thru: 0 }, pace(o.dean ?? 4, 1));
  set[MON.gatorA] = mon(anim('gatorA0', 'gatorA1', 6), { power: POWER.hazard, thru: 0 }, pace(o.gator ?? 4, 1));
  set[MON.gatorB] = mon(anim('gatorB0', 'gatorB1', 6), { power: POWER.hazard, thru: 0 }, pace(o.gator ?? 4, 1));
  const fly = o.pigeon ?? 6;
  set[MON.pigeon] = mon(anim('pigeon0', 'pigeon1', 3), { power: POWER.hazard, thru: 0 }, [
    corner(0, 0, 2),
    corner(fly, 1, 2, 0),
    corner(fly, -1, 2, 0),
    corner(0, 0, 2, 4),
  ]);
  set[MON.spark] = mon(anim('spark0', 'spark1', 2), { power: POWER.hazard, thru: 0 }, [corner(0, 0, 1), corner(0, 2, 2, 0), corner(0, 0, 1, 0)]);
  // a bat flutters about: say hello and off it flies
  set[MON.bat] = mon(anim('bat0', 'bat1', 2), { power: POWER.hello, thru: 0, newmon: MON.batOff }, [
    corner(0, 0, 1),
    corner(2, -1, 1, 0),
    corner(4, 0, 1, 0),
    corner(2, 1, 1, 4),
    corner(0, 0, 1, 4),
  ]);
  set[MON.batOff] = mon(anim('bat1', 'bat0', 1), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 4), corner(4, -6, 4, 0)]);
  // old friends: a hello for points, and off they go
  const friend = (id: number, off: number, a: string, t: number) => {
    set[id] = mon(anim(`${a}0`, `${a}1`, t), { power: POWER.hello, thru: 0, newmon: off }, still);
    set[off] = mon(anim(`${a}1`, `${a}0`, 2), { power: 100, thru: 0, end: 36 }, [corner(0, 0, 3), corner(2, -2, 3, 0), corner(5, 0, 3, 0)]);
  };
  friend(MON.loaf, MON.loafOff, 'loaf', 10);
  friend(MON.seed, MON.seedOff, 'seed', 5);
  friend(MON.goat, MON.goatOff, 'goat', 9);
  return set;
}
