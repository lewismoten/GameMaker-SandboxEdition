// CARL.CHR (Carl the fly: he flies any way he likes, does a barrel roll, and buzzes; his patience,
// lives and counters) and the .MON file each level loads.
//
// Nothing falls in Carl's world (open air has no gravity), so every arrow just flies, and Q/E/Z/C
// (or keypad 7/9/1/3) fly the diagonals (Game-Maker follows one key at a time). The barrel roll
// (Space) throws a whoosh of wind ahead the way he last flew (power 160) that makes the swatting
// things miss: they turn into a "MISS" for a while, then come back. The buzz (B) flies off the way he last flew (power
// 110) and wakes what's asleep: an ear buzzed twitches, and flying into a twitching ear counts.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { EARS, HOURS, KEY, MON, SEQ, SMILES, SND, SNACKS, SUGAR_START } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right (the bottom block's orientation is the high nibble)

/** Pixels a tick flying straight. */
const STEP = 5;
/** Pixels a tick each way flying a diagonal. */
const DIAG = 4;
/** How long a swatting thing stays "missed" after a barrel roll (ticks). */
const MISS_TIME = 54;

type F = { pic: string; x?: number; y?: number; pause?: number; orient?: number };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** A frame that gives birth to a monster on Carl's own row. */
const birth = (mon: number): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 0 });

export function buildCarl(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => ({ ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: CHARBL, pic2: cb.n(o.pic), pause: o.pause ?? 1, orient: o.orient ?? 0 });

  // hovering: wings a blur, a smug blink now and then
  set(S[SEQ.idle], [
    f({ pic: 'front0' }),
    f({ pic: 'front1' }),
    f({ pic: 'front0' }),
    f({ pic: 'front1' }),
    f({ pic: 'front0' }),
    f({ pic: 'front1' }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front1' }),
    f({ pic: 'grin', pause: 4 }),
    f({ pic: 'front1' }),
  ]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 3 }), f({ pic: 'splat0', y: 6, pause: 4 }), f({ pic: 'splat1', y: 6, pause: 30 })], {
    sound: SND.splat,
    jstkBut: 0,
  });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'front1', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'front0', pause: 1 })], {
    sound: SND.hurt,
    jstkBut: 0,
  });
  set(S[3], [f({ pic: 'front0' })], { key: 0 });
  set(S[4], [f({ pic: 'front0' })], { key: 0 });

  const side = (dx: number, dy: number) => {
    const o = dx < 0 ? MIRROR : 0;
    return [f({ pic: 'side0', x: dx, y: dy, orient: o }), f({ pic: 'side1', x: dx, y: dy, orient: o })];
  };
  // up the screen shows his back, down it his face
  const vert = (dy: number) => (dy < 0 ? [f({ pic: 'back0', y: dy }), f({ pic: 'back1', y: dy })] : [f({ pic: 'front0', y: dy }), f({ pic: 'front1', y: dy })]);
  set(S[SEQ.right], side(STEP, 0), { key: KEY.right, jstkMov: JOY.right, sound: SND.fly });
  set(S[SEQ.left], side(-STEP, 0), { key: KEY.left, jstkMov: JOY.left, sound: SND.fly });
  set(S[SEQ.up], vert(-STEP), { key: KEY.up, jstkMov: JOY.up, sound: SND.fly });
  set(S[SEQ.down], vert(STEP), { key: KEY.down, jstkMov: JOY.down, sound: SND.fly });
  set(S[SEQ.upLeft], side(-DIAG, -DIAG), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.fly });
  set(S[SEQ.upRight], side(DIAG, -DIAG), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.fly });
  set(S[SEQ.downLeft], side(-DIAG, DIAG), { key: KEY.z, jstkMov: JOY.downLeft, sound: SND.fly });
  set(S[SEQ.downRight], side(DIAG, DIAG), { key: KEY.c, jstkMov: JOY.downRight, sound: SND.fly });
  set(S[SEQ.upLeft7], side(-DIAG, -DIAG), { key: KEY.home, sound: SND.fly });
  set(S[SEQ.upRight9], side(DIAG, -DIAG), { key: KEY.pgup, sound: SND.fly });
  set(S[SEQ.downLeft1], side(-DIAG, DIAG), { key: KEY.end, sound: SND.fly });
  set(S[SEQ.downRight3], side(DIAG, DIAG), { key: KEY.pgdn, sound: SND.fly });
  // the barrel roll: the whoosh flies off ahead, and he turns right over where he is (no
  // moving, so the way he last flew stays the way he was going)
  set(
    S[SEQ.roll],
    [
      birth(MON.whoosh),
      f({ pic: 'rollSide', orient: 0x10 }),
      f({ pic: 'rollSide', orient: 0x20 }),
      f({ pic: 'rollSide', orient: 0x30 }),
      f({ pic: 'rollSide', orient: 0x00 }),
      f({ pic: 'grin', pause: 2 }),
    ],
    { key: KEY.space, sound: SND.roll, norepeat: 1, ground: 1, jstkBut: 1 },
  );
  // the buzz: off it goes, the way he last flew
  set(
    S[SEQ.buzz],
    [f({ pic: 'buzz0', pause: 1 }), birth(MON.buzz), f({ pic: 'buzz1', pause: 2 }), f({ pic: 'buzz0', pause: 2 }), f({ pic: 'front0', pause: 1 })],
    {
      key: KEY.b,
      sound: SND.buzz,
      norepeat: 1,
      jstkBut: 2,
    },
  );

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // patience (health)
  ch.meter[1] = 3; // lives
  for (const k of [SNACKS, SMILES, EARS, HOURS]) ch.meter[k] = 1; // shown as meter - 1: none yet
  ch.meter[3] = SUGAR_START + 1; // sugar, the money counter (shown as meter - 1)
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });
/** Stays put (animating). */
const still = (): March[] => [corner(0, 0, 1), corner(0, 0, 1)];

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = still()): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

/** Back and forth `run` blocks (to the right first) at `speed`, facing the way it goes. */
const pace = (run: number, speed: number): March[] => [corner(0, 0, speed), corner(run, 0, speed, 0), corner(0, 0, speed, 4)];

export interface MonsterOptions {
  /** Ticks a towel/clap/swatter waits between swings. */
  wind?: number;
  /** How far the birds, wasps and dragonflies patrol (blocks). */
  patrol?: number;
  /** How far the mop and the mopper go (blocks). */
  mop?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, ta = 3, tb = ta): [number, number][] => [
    [n(a), ta],
    [n(b), tb],
  ];
  const wind = o.wind ?? 20;
  const patrol = o.patrol ?? 5;
  // swatting things: power 140 (the whoosh, 160, beats them) and they come back after a miss
  const swing = (a: string, b: string, missed: number, t: number): Monster => mon(anim(a, b, wind + t, 7), { power: 140, thru: 0, newmon: missed });
  const missed = (back: number): Monster => mon(anim('miss0', 'miss1', 3), { power: 200, thru: 0, end: MISS_TIME, newmon: back });
  set[MON.towel] = swing('towel0', 'towel1', MON.missTowel, 0);
  set[MON.missTowel] = missed(MON.towel);
  set[MON.reach] = mon(anim('reach0', 'reach1', 10), { power: 200, thru: 0 }, [corner(0, 0, 1), corner(0, 1, 1, 1), corner(0, 0, 1, 3)]);
  set[MON.clap] = swing('clap0', 'clap1', MON.missClap, 6);
  set[MON.missClap] = missed(MON.clap);
  set[MON.swatter] = swing('swat0', 'swat1', MON.missSwatter, 12);
  set[MON.missSwatter] = missed(MON.swatter);
  // the finale: his hand grabbing for the aux cord, open and closing (a roll makes it miss too)
  set[MON.grab] = swing('grab0', 'grab1', MON.missGrab, 3);
  set[MON.missGrab] = missed(MON.grab);
  set[MON.teddy] = mon(anim('teddy0', 'teddy1', 6), { power: 200, thru: 0 }, [corner(0, 0, 3), corner(0, -2, 3, 0), corner(0, 0, 2, 0), corner(0, 0, 1)]);
  set[MON.loaf] = mon(anim('loaf0', 'loaf1', 12), { power: 50, thru: 0, newmon: MON.loafOff });
  set[MON.loafOff] = mon(anim('loafOff1', 'loafOff0', 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 4), corner(2, -3, 4, 0)]);
  // ears: asleep (power 105: a buzz, 110, wakes it), twitching (power 50: Carl flies in and it counts), asleep again for a while
  const ears = (asleep: string, t0: string, t1: string, zzz: string, ear: number, twitch: number, sleepy: number) => {
    set[ear] = mon([[n(asleep), 40]], { power: 105, thru: 0, newmon: twitch });
    set[twitch] = mon(anim(t0, t1, 2), { power: 50, thru: 0, newmon: sleepy });
    set[sleepy] = mon([[n(zzz), 40]], { power: 200, thru: 0, end: 90, newmon: ear });
  };
  ears('ear', 'earT0', 'earT1', 'earZ', MON.ear, MON.earTwitch, MON.earZzz);
  ears('dogEar', 'dogT0', 'dogT1', 'dogZ', MON.dogEar, MON.dogTwitch, MON.dogZzz);
  set[MON.snore] = mon([[n('snore'), 6]], { power: 50, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -2, 1), corner(2, -4, 1), corner(1, -6, 1)]);
  // a slipper flung across the bedroom in an arc, end over end, again and again
  set[MON.slipper] = mon(anim('slipper0', 'slipper1', 2), { power: 200, thru: 0 }, [
    corner(0, 0, 5),
    corner(4, -3, 5),
    corner(8, 0, 5),
    corner(8, 0, 1),
    corner(4, -3, 5, 4),
    corner(0, 0, 5, 4),
    corner(0, 0, 1),
  ]);
  set[MON.fan] = mon(anim('fan0', 'fan1', 1), { power: 200, thru: 0 });
  set[MON.sage] = mon(anim('sage0', 'sage1', 6), { power: 200, thru: 0, end: -1 }, [corner(0, 0, 1), corner(-2, -2, 1), corner(-1, -5, 1), corner(-3, -7, 1)]);
  set[MON.mist] = mon(anim('mist0', 'mist1', 6), { power: 200, thru: 0, end: -1 }, [corner(0, 0, 1), corner(2, -2, 1), corner(1, -5, 1), corner(3, -7, 1)]);
  const mopRun = o.mop ?? 5;
  set[MON.mop] = mon(anim('mop0', 'mop1', 3), { power: 200, thru: 0 }, pace(mopRun, 2));
  set[MON.mopperA] = mon(anim('mopperA0', 'mopperA1', 6), { power: 200, thru: 0 }, pace(mopRun, 2));
  set[MON.mopperB] = mon(anim('mopperB0', 'mopperB1', 6), { power: 200, thru: 0 }, pace(mopRun, 2));
  set[MON.bird] = mon(anim('bird0', 'bird1', 3), { power: 200, thru: 0 }, [
    corner(0, 0, 3),
    corner(patrol, 1, 3, 0),
    corner(patrol, -1, 3, 0),
    corner(0, 0, 3, 4),
  ]);
  set[MON.wasp] = mon(anim('wasp0', 'wasp1', 1), { power: 200, thru: 0, end: -1 }, [
    corner(0, 0, 3),
    corner(2, 2, 3),
    corner(5, 1, 3),
    corner(8, 3, 3),
    corner(12, 2, 3),
  ]);
  set[MON.wave] = mon(anim('wave0', 'wave1', 5), { power: 200, thru: 0 });
  set[MON.frog] = mon(anim('frog0', 'frog1', 30, 6), { power: 200, thru: 0 });
  set[MON.tongue] = mon(
    [
      [n('tongue0'), 26],
      [n('tongue1'), 6],
    ],
    { power: 200, thru: 0 },
  );
  set[MON.dragonfly] = mon(anim('dragon0', 'dragon1', 1), { power: 200, thru: 0 }, [
    corner(0, 0, 3),
    corner(patrol, 0, 3, 0),
    corner(patrol, 0, 1, 0),
    corner(0, 0, 3, 4),
    corner(0, 0, 1, 4),
  ]);
  set[MON.spider] = mon(anim('spider0', 'spider1', 4), { power: 200, thru: 0 }, [corner(0, 0, 2), corner(0, 3, 2), corner(0, 3, 1), corner(0, 0, 1)]);
  set[MON.goat] = mon(anim('goat0', 'goat1', 10), { power: 200, thru: 1 }, pace(3, 1));
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 0, newmon: MON.seedOff });
  set[MON.seedOff] = mon(anim('seedOff1', 'seedOff0', 3), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(3, -2, 3, 0), corner(6, 0, 3, 0)]);
  set[MON.camelA] = mon(anim('camelA0', 'camelA1', 30), { power: 200, thru: 1 });
  set[MON.camelB] = mon(anim('camelB0', 'camelB1', 30), { power: 200, thru: 1 });
  // Carl's own: the whoosh and the buzz fly off the way he last flew; where the whoosh hits
  // something it leaves a whirl that makes whatever else is there miss too
  set[MON.whoosh] = mon(anim('whoosh0', 'whoosh1', 1), { power: 160, thru: 0, end: 16, towards: 5, newmon: MON.whirl });
  set[MON.whirl] = mon(anim('whoosh1', 'whoosh0', 1), { power: 160, thru: 0, end: 8 });
  set[MON.buzz] = mon(anim('buzz0', 'buzz1', 2), { power: 110, thru: 0, end: 16, towards: 6 });
  return set;
}

export { MON };
