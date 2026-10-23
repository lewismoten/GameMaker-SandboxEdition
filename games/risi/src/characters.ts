// MARCUS.CHR and FELIX.CHR (walk, hop, sneak, declaim a line, and tell a joke, or for Felix,
// meow; dignity, lives and counters) and the .MON file each level loads.
//
// Gravity does the platforming, as in the Bard's other side-on games: air pulls down, so a hop
// is an upward push each tick Up is held (gravity takes one more away every tick), and Q/E hop
// up and sideways at once (Game-Maker follows one key at a time). Space tells a joke to the
// right and Z to the left: two "HA!"s (power 220, at his head and his feet) that never run out.
// A joke clears Rufus's clouds and the wise man's spells, and a stone face hit by one laughs; it
// takes four to crack each half of Emperor Gravis (200). Felix's Space and Z are a meow: it
// scares a mouse (150) into dropping its cheese.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { AIR, CHEESE, CROWN, KEY, LAUGHS, MON, SCALES, SEQ, SND, TITLES } from './ids';
import type { buildMarcusBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right

/** Pixels a tick walking. */
export const STEP = 4;
/** Pixels a tick sideways while hopping. */
export const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const HOP = 12;
/** Pixels a tick sneaking (Down). */
export const SNEAK_STEP = 2;

export type Who = 'marcus' | 'felix';

type F = { pic: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** A frame that gives birth to a monster: row 0 = his row, -1 the row above. */
const birth = (mon: number, row = 0): Frame => ({ ...emptyFrame(), x: 0, y: (row + 1) * 20, pic1: mon, pic2: MONBL, pause: 1 });

/** Marcus's (or Felix's) character file. */
export function buildHero(cb: ReturnType<typeof buildMarcusBlocks>, who: Who): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: CHARBL,
    pic2: cb.n(o.pic),
    pause: o.pause ?? 1,
    orient: o.mirror ? MIRROR : 0,
  });

  set(S[SEQ.idle], [
    f({ pic: 'front', pause: 30 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 24 }),
    f({ pic: 'bliss', pause: 10 }),
    f({ pic: 'front', pause: 18 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 22 }),
  ]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 3 }), f({ pic: 'faint0', pause: 8 }), f({ pic: 'faint1', pause: 30 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'worry', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'front', pause: 1 })], {
    sound: SND.hurt,
    jstkBut: 0,
  });
  set(S[3], [f({ pic: 'front' })], { key: 0 });
  set(S[4], [f({ pic: 'front' })], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['walk0', 'walk1', 'walk2', 'walk3'].map((pic) => f({ pic, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], walk(STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-STEP, true), { key: KEY.a });
  const hop = [f({ pic: 'hop', y: -HOP })];
  set(S[SEQ.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SEQ.hopW], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f({ pic: 'hopSide', x: dx, y: -HOP, mirror }), f({ pic: 'hopSide', x: dx, y: -HOP, mirror })];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  set(S[SEQ.hopLeft7], side(-HOP_STEP, true), { key: KEY.home, sound: SND.hop });
  set(S[SEQ.hopRight9], side(HOP_STEP, false), { key: KEY.pgup, sound: SND.hop });
  const down = [f({ pic: 'sneak0', x: SNEAK_STEP, pause: 2 }), f({ pic: 'sneak1', x: SNEAK_STEP, pause: 2 })];
  set(S[SEQ.down], down, { key: KEY.down, jstkMov: JOY.down, sound: SND.step });
  set(S[SEQ.downS], down, { key: KEY.s, sound: SND.step });
  // Space and Z: a joke (Felix: a meow) each way. The first frame steps a pixel that way (and
  // back), so what's born flies that way; it plays through ("ground"), and never runs out.
  const shot = who === 'felix' ? MON.meow : MON.joke;
  const rows = who === 'felix' ? [0] : [0, -1];
  const throwing = (dx: number, mirror: boolean) => [
    f({ pic: 'joke0', x: dx, pause: 3, mirror }),
    ...rows.map((r) => birth(shot, r)),
    f({ pic: 'joke1', x: -dx, pause: 4, mirror }),
    f({ pic: 'front', pause: 2 }),
  ];
  set(S[SEQ.throw], throwing(1, false), { key: KEY.space, sound: SND.speak, ground: 1, norepeat: 1, jstkMov: JOY.any, jstkBut: 1 });
  set(S[SEQ.throwLeft], throwing(-1, true), { key: KEY.z, sound: SND.speak, ground: 1, norepeat: 1 });
  // B: a line of the song
  const sing = [f({ pic: 'sing0', pause: 8 }), f({ pic: 'sing1', pause: 10 }), f({ pic: 'sing0', pause: 6 }), f({ pic: 'front', pause: 2 })];
  set(S[SEQ.sing], sing, { key: KEY.b, sound: SND.wail, ground: 1, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // dignity (hit points)
  ch.meter[1] = 3; // lives
  for (const n of [AIR, CHEESE, TITLES, SCALES, LAUGHS, CROWN]) ch.meter[n] = 1; // shown as meter - 1: none yet
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
/** No monster (what a beaten one becomes when nothing is left of it). */
const NONE = 64;

export interface MonsterOptions {
  /** Blocks the servus, the mice, the ants and the pigeons pace. */
  run?: number;
  /** The Gauls' charge: corners (blocks right, rows down) from where they start, and their speed. */
  charge?: [number, number][];
  chargeSpeed?: number;
  /** Legs the first horde rallies on the spot (shaking spears, a block up and back) before it charges, so it reads before it runs. */
  rally?: number;
  /** Rows below the tower's top an arrow comes down to. */
  fall?: number;
  /** The second wave: blocks right to its ditch, rally legs (each a block up or down) before it charges, and its speed. */
  wave?: [number, number, number];
}

/** A level's .MON (the slots are the same in every level; each fills the ones it uses). */
export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  /** A hurting monster's round: its stinging picture for one tick, then its two harmless ones. */
  const sting = (stem: string, t = 3, a = `${stem}0`, b = `${stem}1`, st = `${stem}S`): [number, number][] => [
    [n(st), 1],
    [n(a), t],
    [n(b), t],
  ];
  const run = o.run ?? 3;
  const away = (a: string, b: string): Monster =>
    mon(anim(a, b, 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, -1, 3, 4)]);
  set[MON.joke] = mon(anim('joke0', 'joke1', 2), { power: 220, thru: 1, towards: 8, end: 28 });
  // I. the banquet: Rufus's clouds spread out from under the table and up
  // (they hang along the floor past the bust before they rise, so the way on must be cleared or timed)
  set[MON.gas] = mon(sting('gas', 5), { power: 150, thru: 0, end: -1 }, [
    corner(0, 0, 1),
    corner(3, 0, 1, 0),
    corner(5, 0, 1, 0),
    corner(6, -2, 1, 0),
    corner(5, -5, 1, 4),
  ]);
  set[MON.flavia] = mon(anim('flavia0', 'flavia1', 6), { power: 50, thru: 0, newmon: MON.flaviaOff }, still);
  set[MON.flaviaOff] = away('flavia1', 'flavia0');
  set[MON.teddy] = mon(anim('teddy0', 'teddy1', 14), { power: 230, thru: 1 }, still);
  set[MON.gwinn] = mon(anim('gwinn0', 'gwinn1', 17), { power: 230, thru: 1 }, still);
  set[MON.servus] = mon(anim('servus0', 'servus1', 4), { power: 230, thru: 1 }, pace(run, 1));
  // IV. the kitchen
  set[MON.mouse] = mon(sting('mouse', 3), { power: 150, thru: 1, newmon: MON.crumb }, pace(run, 1));
  set[MON.crumb] = mon(anim('crumb0', 'crumb1', 6), { power: 50, thru: 1 }, still);
  set[MON.meow] = mon(anim('meow0', 'meow1', 2), { power: 220, thru: 1, towards: 8, end: 28 });
  set[MON.ant] = mon(sting('ant', 3), { power: 150, thru: 1, newmon: NONE }, pace(Math.min(run, 2), 1));
  // II. the battle: the horde charges along the ground to the gate, whatever is in the way
  const shake: March[] = Array.from({ length: o.rally ?? 0 }, (_, k) => corner(0, k % 2 ? 0 : -1, 1, 0));
  const charge = [corner(0, 0, o.chargeSpeed ?? 3), ...shake, ...(o.charge ?? [[40, 0]]).map(([cx, cy]) => corner(cx, cy, o.chargeSpeed ?? 3, 0))];
  set[MON.gaul] = mon(sting('gaul', 3), { power: 230, thru: 0, end: -1 }, charge);
  set[MON.gaul2] = mon(sting('gaulB', 3), { power: 230, thru: 0, end: -1 }, charge);
  // the second wave: they rally where they stand (shaking their spears, up and down a block),
  // then charge faster than the first to the wide ditch, and tumble in
  if (o.wave) {
    const [wx, delay, ws] = o.wave;
    const rally: March[] = Array.from({ length: delay }, (_, k) => corner(0, k % 2 ? 0 : -1, 1, 0));
    // (the charge in two legs: PLAYGAME takes the short way round the 100-block world)
    const second = [corner(0, 0, 1), ...rally, corner(wx / 2, 0, ws, 0), corner(wx, 0, ws, 0), corner(wx + 2, 2, ws, 0)];
    set[MON.gaulW] = mon(sting('gaul', 3), { power: 230, thru: 0, end: -1 }, second);
    set[MON.gaulW2] = mon(sting('gaulB', 3), { power: 230, thru: 0, end: -1 }, second);
  }
  // an arrow loosed from the tower: up and over, down into the field ahead of it
  set[MON.arrow] = mon(sting('arrow', 2), { power: 150, thru: 0, end: -1 }, [
    corner(0, 0, 4),
    corner(2, -2, 4, 0),
    corner(4, -2, 4, 0),
    corner(6, 0, 4, 0),
    corner(7, o.fall ?? 2, 4, 0),
  ]);
  set[MON.crow] = mon(anim('crow0', 'crow1', 4), { power: 150, thru: 0 }, [
    corner(0, 0, 2),
    corner(6, 1, 2, 0),
    corner(10, -1, 2, 0),
    corner(4, 0, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  // III. the rooftops
  set[MON.spell] = mon(sting('spell', 3), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 2), corner(-3, -1, 2, 4), corner(-6, 0, 2, 4), corner(-9, -1, 2, 4)]);
  set[MON.pigeon] = mon(sting('pigeon', 5), { power: 150, thru: 1, newmon: NONE }, pace(Math.min(run, 2), 1));
  set[MON.leo] = mon(anim('leo0', 'leo1', 9), { power: 50, thru: 0, newmon: MON.leoOff }, still);
  set[MON.leoOff] = away('leo1', 'leo0');
  set[MON.sagax] = mon(anim('sagax0', 'sagax1', 12), { power: 230, thru: 1 }, still);
  // V. the baths
  set[MON.note] = mon(anim('note0', 'note1', 6), { power: 50, thru: 0, end: -1 }, [
    corner(0, 0, 1),
    corner(-1, -2, 1, 4),
    corner(0, -4, 1, 0),
    corner(-1, -6, 1, 4),
  ]);
  set[MON.fan] = mon(anim('fan0', 'fan1', 5), { power: 50, thru: 0, newmon: MON.fanOff }, still);
  set[MON.fanOff] = away('fan1', 'fan0');
  set[MON.bubble] = mon(sting('bubble', 4), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(0, -2, 1, 0), corner(1, -4, 1, 0)]);
  // a hot drip: straight down from the stain to the walkway, then gone
  set[MON.drip] = mon(sting('drip', 3), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 2), corner(0, 9, 2, 0)]);
  set[MON.bather] = mon(anim('bather0', 'bather1', 16), { power: 230, thru: 1 }, still);
  // VI. the theater: a joke makes a stone face laugh; the laugher comes down to Marcus
  set[MON.stony] = mon(anim('stony0', 'stony1', 20), { power: 200, thru: 1, newmon: MON.giggle }, still);
  // shaking with laughter in its seat (stronger than a joke, so the next one flies by harmlessly), then up it gets
  set[MON.giggle] = mon(anim('giggle0', 'giggle1', 2), { power: 230, thru: 0, end: -1, newmon: MON.laugher }, [
    corner(0, 0, 2),
    corner(1, 0, 2, 0),
    corner(0, 0, 2, 4),
    corner(1, 0, 2, 0),
    corner(0, 0, 2, 4),
  ]);
  set[MON.laugher] = mon(anim('laugher0', 'laugher1', 4), { power: 50, thru: 0, towards: 2 });
  set[MON.cabbage] = mon(anim('cabbage0', 'cabbage1', 3), { power: 40, thru: 0, end: -1 }, [
    corner(0, 0, 3),
    corner(2, 0, 3, 0),
    corner(4, 2, 3, 0),
    corner(5, 5, 3, 0),
    corner(6, 9, 3, 0),
  ]);
  set[MON.jester] = mon(anim('jester0', 'jester1', 7), { power: 50, thru: 0, newmon: MON.jesterOff }, still);
  set[MON.jesterOff] = away('jester1', 'jester0');
  // Emperor Gravis: a joke a stage; after the second and the third he shuffles his throne two
  // blocks back toward his heralds (power 230 while he shuffles, so jokes bounce off), then sits
  // still again. Both halves shuffle the same two blocks, so they line up again whichever is hit
  // first. Beaten, his top half drops the laurel crown and his bottom half leaves the empty
  // throne.
  for (const half of ['A', 'B'] as const)
    for (let s = 0; s < 4; s++) {
      const key = (k: string) => MON[`gravis${half}${k}` as keyof typeof MON];
      const next = s === 3 ? (half === 'A' ? MON.crown : MON.throne) : s >= 1 ? key(`${s + 1}m`) : key(`${s + 1}`);
      const look = half === 'B' ? (s === 3 ? 3 : 0) : s;
      const pics = (st: number) => sting('', 11 - st * 2, `gravis${half}${look}a`, `gravis${half}${look}b`, `gravis${half}${look}s`);
      set[key(`${s}`)] = mon(pics(s), { power: 200, thru: 1, newmon: next }, still);
      if (s >= 2)
        set[key(`${s}m`)] = mon(anim(`gravis${half}${look}a`, `gravis${half}${look}b`, 3), { power: 230, thru: 1, end: -1, newmon: key(`${s}`) }, [
          corner(0, 0, 2),
          corner(2, 0, 2, 0),
        ]);
    }
  set[MON.throne] = mon(anim('throne', 'throne', 20), { power: 230, thru: 1 }, still);
  // his hush (corners from where it is blown): over his head (it never touches him wherever he
  // sits), down in front of him, along the boards to the top of the stairs, then gone. As strong as a joke, so they pass through
  // each other: nothing spends one of a joke's two HA!s and not the other, which would set
  // his two halves a stage apart.
  set[MON.hush] = mon(sting('hush', 3), { power: 220, thru: 0, end: -1 }, [corner(0, 0, 3), corner(-7, 0, 3, 0), corner(-8, 2, 3, 0), corner(-14, 2, 6, 0)]);
  const arc: March[] = [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, -3, 3, 4), corner(-7, -2, 3, 4), corner(-9, 1, 3, 4), corner(-11, 3, 3, 4)];
  // (as strong as a joke, so the two pass through each other: a decree never spends the joke at
  // his head and lets the one at his feet by, which would set his two halves a stage apart)
  set[MON.decree] = mon(sting('decree', 2), { power: 220, thru: 0, end: -1, newmon: MON.thud }, arc);
  set[MON.thud] = mon([[n('thud'), 4]], { power: 200, thru: 0, end: 18 });
  set[MON.crown] = mon(anim('crown0', 'crown1', 4), { power: 230, thru: 1 }, still);
  return set;
}

export { MON };
