// LEO.CHR and HELL.CHR (the man: tiptoe, hop as high as a desperate man can, sneak, and declaim a
// line of the monologue; in the reckoning, Space throws almond milk instead; his dignity, lives
// and counters) and the .MON file each level loads.
//
// Gravity does the platforming, as in the Bard's other side-on games: air pulls down, so a hop
// is an upward push each tick Up is held (gravity takes one more away every tick), and Q/E hop
// up and sideways at once (Game-Maker follows one key at a time). He has no way to fight until
// the reckoning, where a splash of almond milk (power 220, two of them, at his head and his feet)
// beats the Devil's milkshakes (200) and knocks the Devil (200, both halves) a stage further
// each time; the Devil's top half, beaten, drops his last straw.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { KEY, MILK_START, MON, ROLLS, SEQ, SND, STRAW, WILL } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

export type Form = 'leo' | 'hell';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right

/** Pixels a tick tiptoeing. */
export const STEP = 4;
/** Pixels a tick sideways while hopping. */
export const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const HOP = 12;
/** Pixels a tick sneaking (Down). */
export const SNEAK_STEP = 2;

type F = { pic: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** A frame that gives birth to a monster: row 0 = his row, -1 the row above. */
const birth = (mon: number, row = 0): Frame => ({ ...emptyFrame(), x: 0, y: (row + 1) * 20, pic1: mon, pic2: MONBL, pause: 1 });

/** The man's character file: in the house (leo) or in the reckoning (hell, where Space throws almond milk). */
export function buildMan(cb: ReturnType<typeof buildCharBlocks>, form: Form): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => ({ ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: CHARBL, pic2: cb.n(o.pic), pause: o.pause ?? 1, orient: o.mirror ? MIRROR : 0 });

  set(S[SEQ.idle], [
    f({ pic: 'front', pause: 30 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 20 }),
    f({ pic: 'worry', pause: 14 }),
    f({ pic: 'front', pause: 18 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 22 }),
  ]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 3 }), f({ pic: 'faint0', pause: 8 }), f({ pic: 'faint1', pause: 30 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'worry', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'front', pause: 1 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f({ pic: 'front' })], { key: 0 });
  set(S[4], [f({ pic: 'front' })], { key: 0 });

  // tiptoeing: four steps
  const walk = (dx: number, mirror: boolean) => ['walk0', 'walk1', 'walk2', 'walk3'].map((pic) => f({ pic, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], walk(STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-STEP, true), { key: KEY.a });
  // hopping
  const hop = [f({ pic: 'hop', y: -HOP })];
  set(S[SEQ.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SEQ.hopW], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f({ pic: 'hopSide', x: dx, y: -HOP, mirror }), f({ pic: 'hopSide', x: dx, y: -HOP, mirror })];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  set(S[SEQ.hopLeft7], side(-HOP_STEP, true), { key: KEY.home, sound: SND.hop });
  set(S[SEQ.hopRight9], side(HOP_STEP, false), { key: KEY.pgup, sound: SND.hop });
  // Down: sneak (slowly, crouched)
  const down = [f({ pic: 'sneak0', x: SNEAK_STEP, pause: 2 }), f({ pic: 'sneak1', x: SNEAK_STEP, pause: 2 })];
  set(S[SEQ.down], down, { key: KEY.down, jstkMov: JOY.down, sound: SND.step });
  set(S[SEQ.downS], down, { key: KEY.s, sound: SND.step });
  // the monologue (Space, B), or in the reckoning: Space throws almond milk to the right
  const speak = [f({ pic: 'speak0', pause: 8 }), f({ pic: 'speak1', pause: 10 }), f({ pic: 'speak0', pause: 6 }), f({ pic: 'front', pause: 2 })];
  if (form === 'hell') {
    // the throw's first frame steps right a pixel (and back), so the splashes fly to the right
    set(S[SEQ.speak], [f({ pic: 'throw0', x: 1, pause: 3 }), birth(MON.splash, 0), birth(MON.splash, -1), f({ pic: 'throw1', x: -1, pause: 4 }), f({ pic: 'front', pause: 2 })], {
      key: KEY.space,
      sound: SND.speak,
      norepeat: 1,
      jstkMov: JOY.any,
      jstkBut: 1,
    });
  } else set(S[SEQ.speak], speak, { key: KEY.space, sound: SND.speak, norepeat: 1, jstkMov: JOY.any, jstkBut: 1 });
  set(S[SEQ.speakB], speak, { key: KEY.b, sound: SND.wail, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // dignity (hit points)
  ch.meter[1] = 3; // lives
  ch.meter[WILL] = 1; // shown as meter - 1: none yet
  ch.meter[ROLLS] = 1;
  ch.meter[STRAW] = 1;
  if (form === 'hell') ch.meter[SEQ.speak] = MILK_START;
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
const still: March[] = [corner(0, 0, 1), corner(0, 0, 1)];

export interface MonsterOptions {
  /** Blocks the dairy slide along their shelves. */
  shelf?: number;
  /** Pixels a tick the gurgle chases him. */
  gurgle?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  // 3:17 a.m.
  set[MON.teddy] = mon(anim('teddy0', 'teddy1', 20), { power: 200, thru: 1 }, still);
  set[MON.gwinn] = mon(anim('gwinn0', 'gwinn1', 24), { power: 200, thru: 1 }, still);
  set[MON.zzz] = mon(anim('zzz0', 'zzz1', 6), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -2, 1, 0), corner(0, -4, 1, 0)]);
  // the dairy
  const shelf = o.shelf ?? 3;
  set[MON.milk] = mon(anim('milk0', 'milk1', 3), { power: 150, thru: 1 }, pace(shelf, 1));
  set[MON.yogurt] = mon(anim('yogurt0', 'yogurt1', 4), { power: 150, thru: 1 }, pace(Math.max(1, shelf - 1), 1));
  set[MON.cheese] = mon(anim('cheese0', 'cheese1', 9), { power: 150, thru: 1 }, pace(shelf + 1, 1));
  set[MON.cream] = mon(anim('cream0', 'cream1', 5), { power: 150, thru: 0 }, [corner(0, 0, 1), corner(2, -1, 1, 0), corner(4, 0, 1, 0), corner(2, 1, 1, 4), corner(0, 0, 1, 4)]);
  set[MON.butter] = mon(anim('butter0', 'butter1', 4), { power: 150, thru: 1 }, pace(shelf, 2));
  // friends from other songs: a hello (a touch) is points, and off they go
  set[MON.carl] = mon(anim('carl0', 'carl1', 1), { power: 50, thru: 0, newmon: MON.carlOff }, [corner(0, 0, 2), corner(3, -1, 2, 0), corner(5, 1, 2, 0), corner(2, 2, 2, 4), corner(0, 0, 2, 4)]);
  set[MON.carlOff] = mon(anim('carl0', 'carl1', 1), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 5), corner(6, -6, 5, 0)]);
  set[MON.loaf] = mon(anim('loaf0', 'loaf1', 8), { power: 50, thru: 0, newmon: MON.loafOff }, still);
  set[MON.loafOff] = mon(anim('loaf1', 'loaf0', 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, 0, 3, 4)]);
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 0, newmon: MON.seedOff }, still);
  set[MON.seedOff] = mon(anim('seed1', 'seed0', 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, 0, 3, 4)]);
  // the dash
  set[MON.gurgle] = mon(anim('gurgle0', 'gurgle1', 4), { power: 150, thru: 0, towards: o.gurgle ?? 2 });
  set[MON.teddyUp] = mon(anim('teddyUp0', 'teddyUp1', 3), { power: 150, thru: 1 }, pace(4, 2));
  set[MON.gwinnUp] = mon(anim('gwinnUp0', 'gwinnUp1', 3), { power: 150, thru: 1 }, pace(3, 2));
  // the reckoning: the Devil (both halves, four stages each), lounging where he stands
  const stages = ['A', 'B'] as const;
  for (const half of stages)
    for (let s = 0; s < 4; s++) {
      const slot = MON[`devil${half}${s}` as keyof typeof MON];
      const next = s < 3 ? MON[`devil${half}${s + 1}` as keyof typeof MON] : half === 'A' ? MON.straw : 64;
      set[slot] = mon(anim(`devil${half}${s}a`, `devil${half}${s}b`, 9 - s * 2), { power: 200, thru: 1, newmon: next }, still);
    }
  // milkshakes: out of the soda fountain in an arc to the left, a splat where they land
  const arc: March[] = [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, -3, 3, 4), corner(-7, -2, 3, 4), corner(-9, 1, 3, 4), corner(-11, 4, 3, 4)];
  set[MON.shake] = mon(anim('shake0', 'shake1', 2), { power: 200, thru: 0, end: -1, newmon: MON.splat }, arc);
  set[MON.splat] = mon([[n('splat'), 4]], { power: 200, thru: 0, end: 18 });
  set[MON.splash] = mon(anim('splash0', 'splash1', 2), { power: 220, thru: 1, towards: 8, end: 28 });
  set[MON.straw] = mon(anim('straw0', 'straw1', 4), { power: 230, thru: 1 }, still);
  set[MON.smoke] = mon(anim('smoke0', 'smoke1', 8), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -3, 1, 0), corner(-1, -6, 1, 4)]);
  return set;
}

export { MON };
