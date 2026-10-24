// SEED.CHR and PLANT.CHR (the mustard seed: walk slow but sure, hop as high as its greatest
// feet will take it, push roots down, and a Hallelujah; its health, lives, water and faith)
// and the .MON file each level loads.
//
// Gravity does the platforming: air blocks pull down, so a hop is an upward push each tick Up
// is held (gravity takes one more away every tick), and Q/E hop up and sideways at once
// (Game-Maker follows one key at a time). Roots have no gravity, so in them Up and Down climb.
// The seed has no way to fight and doesn't need one: it don't shout, it don't brag. Big loud
// things (power 150, solid) hurt to bump into and push it back; raindrops and birds (under 100)
// are done in by a touch, and their picture's effect lands first (a drop of water, points).
import { CHARBL } from '../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { FAITH, KEY, MON, SEQ, SND, WATER } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // bottom block flipped left-right
const MIRROR_BOTH = 0x44; // and the top block

/** Pixels a tick walking: the seed is slow but sure; once it has grown (sprout, plant) it strides out. */
export const STEP = 3;
export const STEP_GROWN = 4;
/** Pixels a tick sideways in a hop. */
export const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const HOP = 12;
/** Pixels a tick pushing roots down, or climbing in them. */
export const ROOT_STEP = 3;
export const CLIMB = 5;

export type Form = 'seed' | 'sprout' | 'plant';

type F = { pic: string; top?: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** The seed's character file for one of its forms (the plant is two blocks tall). */
export function buildSeed(cb: ReturnType<typeof buildCharBlocks>, form: Form): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const tall = form === 'plant';
  const n = (pic: string) => cb.n(`${form}.${pic}`);
  const f = (o: F): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: tall ? cb.n(o.top ?? 'top0') : CHARBL,
    pic2: n(o.pic),
    pause: o.pause ?? 1,
    orient: o.mirror ? (tall ? MIRROR_BOTH : MIRROR) : 0,
  });

  set(S[SEQ.idle], [
    f({ pic: 'front', pause: 30 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 20, top: 'top1' }),
    f({ pic: 'root1', pause: 4 }),
    f({ pic: 'front', pause: 4, top: 'top2' }),
    f({ pic: 'front', pause: 16 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'front', pause: 24, top: 'top1' }),
  ]);
  set(
    S[SEQ.die],
    [f({ pic: 'hurt', top: 'topOuch', pause: 3 }), f({ pic: 'wilt0', top: 'topWilt', pause: 8 }), f({ pic: 'wilt1', top: 'topWilt', pause: 30 })],
    { sound: SND.wilt, jstkBut: 0 },
  );
  set(
    S[SEQ.hurt],
    [f({ pic: 'hurt', top: 'topOuch', pause: 2 }), f({ pic: 'front', pause: 1 }), f({ pic: 'hurt', top: 'topOuch', pause: 2 }), f({ pic: 'front', pause: 1 })],
    {
      sound: SND.hurt,
      jstkBut: 0,
    },
  );
  set(S[3], [f({ pic: 'front' })], { key: 0 });
  set(S[4], [f({ pic: 'front' })], { key: 0 });

  const step = form === 'seed' ? STEP : STEP_GROWN;
  const walk = (dx: number, mirror: boolean) =>
    ['side1', 'side0', 'side2', 'side0'].map((pic, i) => f({ pic, x: dx, mirror, top: tall ? ['top1', 'top0', 'top2', 'top0'][i] : undefined }));
  set(S[SEQ.right], walk(step, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-step, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], walk(step, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-step, true), { key: KEY.a });
  // straight up (a hop, or climbing roots): its back, going away
  const hop = [f({ pic: 'climb', y: -HOP, top: 'topBack' })];
  set(S[SEQ.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SEQ.hopW], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [
    f({ pic: 'hop', x: dx, y: -HOP, mirror, top: 'topJoy' }),
    f({ pic: 'hop', x: dx, y: -HOP, mirror, top: 'top0' }),
  ];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  set(S[SEQ.hopLeft7], side(-HOP_STEP, true), { key: KEY.home, sound: SND.hop });
  set(S[SEQ.hopRight9], side(HOP_STEP, false), { key: KEY.pgup, sound: SND.hop });
  // Down: push roots (into soft dust), or climb down in them.
  const root = [f({ pic: 'root0', y: ROOT_STEP, pause: 2 }), f({ pic: 'root1', y: ROOT_STEP, pause: 2 })];
  set(S[SEQ.root], root, { key: KEY.down, jstkMov: JOY.down, sound: SND.root });
  set(S[SEQ.rootS], root, { key: KEY.s, sound: SND.root });
  // A Hallelujah: a little jump for joy, and the song sings it.
  const joy = [
    f({ pic: 'joy', top: 'topJoy', pause: 4 }),
    f({ pic: 'front', pause: 3 }),
    f({ pic: 'joy', top: 'topJoy', pause: 6 }),
    f({ pic: 'front', pause: 2 }),
  ];
  set(S[SEQ.joy], joy, { key: KEY.space, sound: SND.joy, norepeat: 1, jstkMov: JOY.any, jstkBut: 1 });
  set(S[SEQ.joyH], joy, { key: KEY.h, sound: SND.joy, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // health
  ch.meter[1] = 3; // lives
  ch.meter[WATER] = 1; // shown as meter - 1: no water yet
  ch.meter[FAITH] = 1;
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
  /** Blocks the peacock struts before turning round. */
  strut?: number;
  /** Blocks a beetle walks before turning. */
  beetle?: number;
  crow?: number;
  /** How far a raindrop could fall (blocks; it lands long before and lies there until it dries up). */
  rain?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  // Raindrops fall from the clouds and lie a while where they land.
  const rain = o.rain ?? 30;
  set[MON.drop] = mon(anim('drop0', 'drop1', 4), { power: 50, thru: 1, end: 90, newmon: MON.splash }, [corner(0, 0, 3), corner(0, rain, 3)]);
  set[MON.splash] = mon([[n('splash'), 4]], { power: 100, thru: 0, end: 6 });
  const beetle = o.beetle ?? 4;
  set[MON.beetleR] = mon(anim('beetle0', 'beetle1', 3), { power: 150, thru: 1 }, pace(beetle, 1));
  set[MON.beetleL] = mon(anim('beetle0', 'beetle1', 3), { power: 150, thru: 1 }, [corner(0, 0, 1, 4), corner(-beetle, 0, 1, 4), corner(0, 0, 1, 0)]);
  set[MON.ant] = mon(anim('ant0', 'ant1', 2), { power: 150, thru: 1 }, pace(3, 2));
  const crow = o.crow ?? 7;
  set[MON.crow] = mon(anim('crow0', 'crow1', 3), { power: 150, thru: 0 }, [corner(0, 0, 2), corner(crow, -1, 2, 0), corner(crow, 1, 2, 0), corner(0, 0, 2, 4)]);
  // The peacock: two monsters side by side; at the end of each strut each "dies" into its mirror twin.
  const strut = o.strut ?? 8;
  set[MON.peaAR] = mon(anim('peaA0', 'peaA1', 4), { power: 200, thru: 0, end: -1, newmon: MON.peaAL }, [corner(0, 0, 1), corner(strut, 0, 1, 0)]);
  set[MON.peaAL] = mon(anim('peaB0', 'peaB1', 4), { power: 200, thru: 0, end: -1, newmon: MON.peaAR }, [corner(0, 0, 1), corner(-strut, 0, 1, 4)]);
  set[MON.peaBR] = mon(anim('peaB0', 'peaB1', 4), { power: 200, thru: 0, end: -1, newmon: MON.peaBL }, [corner(0, 0, 1), corner(strut, 0, 1, 0)]);
  set[MON.peaBL] = mon(anim('peaA0', 'peaA1', 4), { power: 200, thru: 0, end: -1, newmon: MON.peaBR }, [corner(0, 0, 1), corner(-strut, 0, 1, 4)]);
  set[MON.mole] = mon(anim('mole0', 'mole1', 5), { power: 150, thru: 1 }, pace(5, 1));
  set[MON.worm] = mon(anim('worm0', 'worm1', 6), { power: 150, thru: 1 }, pace(3, 1));
  // Pebbles roll out of the scree, down the slope to the right, and fall apart in a puff.
  set[MON.pebble] = mon(anim('pebble0', 'pebble1', 2), { power: 150, thru: 0, end: 60, newmon: MON.dust }, [corner(0, 0, 3), corner(30, 0, 3)]);
  set[MON.dust] = mon([[n('dust'), 5]], { power: 100, thru: 0, end: 6 });
  set[MON.eagle] = mon(anim('eagle0', 'eagle1', 4), { power: 150, thru: 0 }, [
    corner(0, 0, 3),
    corner(9, 2, 3, 0),
    corner(14, 0, 3, 0),
    corner(5, -2, 3, 4),
    corner(0, 0, 3, 4),
  ]);
  // A white goat, a long way from Bethlehem, pacing her ledge. Harmless.
  set[MON.goat] = mon(anim('goat0', 'goat1', 6), { power: 200, thru: 1 }, pace(3, 1));
  set[MON.squirrel] = mon(anim('squirrel0', 'squirrel1', 3), { power: 150, thru: 1 }, pace(3, 2));
  // Birds sit in the nests; a hello (a touch) is worth points, and off they fly.
  set[MON.bird] = mon(anim('bird0', 'bird1', 12), { power: 50, thru: 0, newmon: MON.birdOff });
  set[MON.birdOff] = mon(anim('birdOff0', 'birdOff1', 2), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 4), corner(4, -8, 4, 0)]);
  set[MON.bee] = mon(anim('bee0', 'bee1', 2), { power: 150, thru: 0 }, [
    corner(0, 0, 2),
    corner(2, -2, 2, 0),
    corner(4, 0, 2, 0),
    corner(2, 2, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  return set;
}

export { MON };
