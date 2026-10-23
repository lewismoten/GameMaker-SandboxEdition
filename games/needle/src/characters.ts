// The camel's character files (LOADED.CHR, SADDLED.CHR, SHOD.CHR and BARE.CHR: Brother Camel
// carrying less each level) and the .MON file each level loads.
//
// Gravity does the platforming, as in the Bard's mustard seed game: air pulls down, so a hop is
// an upward push each tick Up is held, and Q/E hop up and sideways (Game-Maker follows one key
// at a time). Two blocks tall he can't get through a gap one block high; kneeling (Down) and
// crawling (Z and C) show no top block, so he is one block high and squeezes through ("hump
// down"). Threads have no gravity: Up climbs them and Down, kneeling, lets him down ("thread
// up"). He has no way to fight: big things (power 150, solid) hurt to bump into; stars and the
// mustard seed (under 100) are done in by a touch, and their picture's effect lands first.
import { CHARBL } from '../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { GOLD, GOLD_START, GRACE, KEY, MON, SEQ, SND, THREAD } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // bottom block flipped left-right
const MIRROR_BOTH = 0x44; // and the top block

/** Pixels a tick walking: a camel's easy stride. */
export const STEP = 4;
/** Pixels a tick sideways in a hop. */
export const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
export const HOP = 12;
/** Pixels a tick crawling on his knees. */
export const CRAWL = 2;
/** Pixels a tick kneeling lets him down a thread. */
export const SLIDE = 3;

type F = { pic: string; top?: string | null; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** Brother Camel's character file, drawn from one form's .CBL. */
export function buildCamel(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const n = (pic: string) => {
    const i = cb.index.get(pic);
    if (i === undefined) throw new Error(`No camel picture ${pic}`);
    return i;
  };
  // A frame shows `pic` below and its own top above (`top: null` for none: one block high).
  const f = (o: F): Frame => {
    const top = o.top === null ? undefined : (o.top ?? `${o.pic}.top`);
    return {
      ...emptyFrame(),
      x: o.x ?? 0,
      y: o.y ?? 0,
      pic1: top ? n(top) : CHARBL,
      pic2: n(o.pic),
      pause: o.pause ?? 1,
      orient: o.mirror ? (top ? MIRROR_BOTH : MIRROR) : 0,
    };
  };

  // Mindin' his humps: standing, blinking, chewing his cud.
  set(S[SEQ.idle], [
    f({ pic: 'stand', pause: 30 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'stand', pause: 16 }),
    f({ pic: 'chew', pause: 5 }),
    f({ pic: 'stand', pause: 4 }),
    f({ pic: 'chew', pause: 5 }),
    f({ pic: 'stand', pause: 20 }),
    f({ pic: 'blink', pause: 3 }),
  ]);
  set(
    S[SEQ.die],
    [
      f({ pic: 'hurt', pause: 3 }),
      f({ pic: 'faint0', top: null, pause: 8 }),
      f({ pic: 'faint1', top: 'stars0', pause: 10 }),
      f({ pic: 'faint1', top: 'stars1', pause: 24 }),
    ],
    {
      sound: SND.faint,
      jstkBut: 0,
    },
  );
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'stand', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'stand', pause: 1 })], {
    sound: SND.hurt,
    jstkBut: 0,
  });
  set(S[3], [f({ pic: 'stand' })], { key: 0 });
  set(S[4], [f({ pic: 'stand' })], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['walk0', 'walk1', 'walk2', 'walk1'].map((pic) => f({ pic, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.rightD], walk(STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-STEP, true), { key: KEY.a });
  const hop = [f({ pic: 'hop', y: -HOP })];
  set(S[SEQ.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SEQ.hopW], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f({ pic: 'hop', x: dx, y: -HOP, mirror }), f({ pic: 'hop', x: dx, y: -HOP, mirror })];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  // Down: hump down (kneel, one block high), and let himself down a thread.
  const kneel = [f({ pic: 'kneel0', top: null, y: SLIDE, pause: 2 }), f({ pic: 'kneel1', top: null, y: SLIDE, pause: 2 })];
  set(S[SEQ.kneel], kneel, { key: KEY.down, jstkMov: JOY.down, sound: SND.kneel, norepeat: 0 });
  set(S[SEQ.kneelS], kneel, { key: KEY.s, sound: SND.kneel });
  // Z and C (keypad 1 and 3): crawl on his knees, humps down.
  const crawl = (dx: number, mirror: boolean) => [f({ pic: 'crawl0', top: null, x: dx, mirror }), f({ pic: 'crawl1', top: null, x: dx, mirror })];
  set(S[SEQ.crawlLeft], crawl(-CRAWL, true), { key: KEY.z, jstkMov: JOY.downLeft });
  set(S[SEQ.crawlRight], crawl(CRAWL, false), { key: KEY.c, jstkMov: JOY.downRight });
  set(S[SEQ.crawlLeft1], crawl(-CRAWL, true), { key: KEY.end });
  set(S[SEQ.crawlRight3], crawl(CRAWL, false), { key: KEY.pgdn });
  // Space: even a camel can dream (and the song sings it).
  const dream = [f({ pic: 'dream', pause: 4 }), f({ pic: 'dream', top: 'dream.top', pause: 10 }), f({ pic: 'stand', pause: 3 })];
  set(S[SEQ.dream], dream, { key: KEY.space, sound: SND.dream, norepeat: 1, jstkMov: JOY.any, jstkBut: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // health
  ch.meter[1] = 3; // lives
  ch.meter[GOLD] = GOLD_START + 1; // shown as meter - 1
  ch.meter[GRACE] = 1;
  ch.meter[THREAD] = 1;
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
  /** Blocks the rich man walks before turning round. */
  strut?: number;
  /** Blocks a dog (or a guard, a scorpion) paces. */
  dog?: number;
  guard?: number;
  /** Blocks the scissors snip across. */
  snip?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = (name: string) => {
    const i = mb.index.get(name);
    if (i === undefined) throw new Error(`No monster picture ${name}`);
    return i;
  };
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  // The rich man: two monsters side by side; at the end of each walk each "dies" into its mirror twin.
  const strut = o.strut ?? 8;
  set[MON.richAR] = mon(anim('richA0', 'richA1', 4), { power: 200, thru: 0, end: -1, newmon: MON.richAL }, [corner(0, 0, 1), corner(strut, 0, 1, 0)]);
  set[MON.richAL] = mon(anim('richB0', 'richB1', 4), { power: 200, thru: 0, end: -1, newmon: MON.richAR }, [corner(0, 0, 1), corner(-strut, 0, 1, 4)]);
  set[MON.richBR] = mon(anim('richB0', 'richB1', 4), { power: 200, thru: 0, end: -1, newmon: MON.richBL }, [corner(0, 0, 1), corner(strut, 0, 1, 0)]);
  set[MON.richBL] = mon(anim('richA0', 'richA1', 4), { power: 200, thru: 0, end: -1, newmon: MON.richBR }, [corner(0, 0, 1), corner(-strut, 0, 1, 4)]);
  set[MON.dog] = mon(anim('dog0', 'dog1', 3), { power: 150, thru: 1 }, pace(o.dog ?? 4, 2));
  set[MON.pigeon] = mon(anim('pigeon0', 'pigeon1', 3), { power: 150, thru: 0 }, [corner(0, 0, 2), corner(6, -1, 2, 0), corner(6, 1, 2, 0), corner(0, 0, 2, 4)]);
  // Melons roll off the fruit cart, down the street to the left (at him), and splat.
  set[MON.melon] = mon(anim('melon0', 'melon1', 2), { power: 150, thru: 0, end: 60, newmon: MON.splat }, [corner(0, 0, 3, 4), corner(-30, 0, 3, 4)]);
  set[MON.splat] = mon([[n('splat'), 5]], { power: 100, thru: 0, end: 8 });
  set[MON.scorpion] = mon(anim('scorpion0', 'scorpion1', 3), { power: 150, thru: 1 }, pace(3, 1));
  set[MON.vulture] = mon(anim('vulture0', 'vulture1', 4), { power: 150, thru: 0 }, [
    corner(0, 0, 3),
    corner(7, 2, 3, 0),
    corner(12, 0, 3, 0),
    corner(5, -2, 3, 4),
    corner(0, 0, 3, 4),
  ]);
  // The third goat from the left, a long way from Bethlehem, pacing her ledge. Harmless.
  set[MON.goat] = mon(anim('goat0', 'goat1', 6), { power: 200, thru: 1 }, pace(3, 1));
  // Tumbleweeds blow in from the dry brush, leftward, and are gone.
  set[MON.tumble] = mon(anim('tumble0', 'tumble1', 2), { power: 150, thru: 0, end: 90 }, [corner(0, 0, 3), corner(-30, 0, 3, 4)]);
  // A mustard seed of faith, hopping in place: say hello and it is an extra life.
  set[MON.seed] = mon(anim('seed0', 'seed1', 5), { power: 50, thru: 0, newmon: MON.starOff });
  set[MON.scissors] = mon(anim('scissors0', 'scissors1', 2), { power: 150, thru: 1 }, pace(o.snip ?? 4, 2));
  set[MON.moth] = mon(anim('moth0', 'moth1', 2), { power: 150, thru: 1 }, [
    corner(0, 0, 2),
    corner(2, -2, 2, 0),
    corner(4, 0, 2, 0),
    corner(2, 2, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  // The sewing machine's needle stabs down three blocks and back up.
  set[MON.needle] = mon(anim('needle0', 'needle1', 2), { power: 150, thru: 1 }, [corner(0, 0, 2), corner(0, 3, 4), corner(0, 0, 2)]);
  set[MON.thimble] = mon(anim('thimble0', 'thimble1', 3), { power: 150, thru: 1 }, pace(3, 2));
  // Falling stars bob in the night: catch one for points.
  set[MON.star] = mon(anim('star0', 'star1', 6), { power: 50, thru: 1, newmon: MON.starOff }, [corner(0, 0, 1), corner(0, 1, 1), corner(0, 0, 1)]);
  set[MON.starOff] = mon(anim('starOff0', 'starOff1', 3), { power: 100, thru: 1, end: 12 });
  set[MON.dove] = mon(anim('dove0', 'dove1', 4), { power: 200, thru: 1 }, [corner(0, 0, 2), corner(6, -1, 2, 0), corner(0, 0, 2, 4)]);
  set[MON.guard] = mon(anim('guard0', 'guard1', 4), { power: 150, thru: 1 }, pace(o.guard ?? 3, 1));
  return set;
}

export { MON };
