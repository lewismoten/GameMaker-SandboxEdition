// LOAF.CHR and BUNDLE.CHR (Loaf #13: roll slow and steady, rise as high as good dough will, hunker
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

/** Pixels a tick rolling: slow and steady. */
export const STEP = 3;
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

export interface MonsterOptions {
  /** Blocks a hungry man stomps before turning round. */
  feet?: number;
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
  set[MON.hand] = mon(anim('hand0', 'hand1', 8), { power: 150, thru: 0 }, [
    corner(0, 0, 2),
    corner(0, reach, 2, 1),
    corner(0, reach, 1, 1),
    corner(0, 0, 2, 3),
  ]);
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
  set[MON.man] = mon(anim('feet0', 'feet1', 5), { power: 150, thru: 1 }, pace(o.feet ?? 4, 1));
  set[MON.goat] = mon(anim('goat0', 'goat1', 10), { power: 200, thru: 1 }, pace(3, 1));
  set[MON.weevil] = mon(anim('weevil0', 'weevil1', 4), { power: 150, thru: 1 }, pace(3, 1));
  set[MON.mouse] = mon(anim('mouse0', 'mouse1', 3), { power: 150, thru: 1 }, pace(4, 2));
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 0, newmon: MON.seedOff }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.seedOff] = mon(anim('seed1', 'seed0', 3), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(3, -2, 3, 0), corner(6, 0, 3, 0)]);
  set[MON.fox] = mon(anim('fox0', 'fox1', 3), { power: 150, thru: 1 }, pace(5, 2));
  set[MON.owl] = mon(anim('owl0', 'owl1', 4), { power: 150, thru: 0 }, [
    corner(0, 0, 2),
    corner(4, 3, 3, 0),
    corner(8, 0, 2, 0),
    corner(4, 3, 3, 4),
    corner(0, 0, 2, 4),
  ]);
  set[MON.dog] = mon(anim('dog0', 'dog1', 3), { power: 150, thru: 1 }, pace(4, 2));
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
