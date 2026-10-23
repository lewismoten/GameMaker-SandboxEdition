// LOOFAH.CHR (the man: tiptoe on wet tile, hop, sneak, sing a line, and throw rosemary brine;
// his dignity, lives and counters) and the .MON file each act loads.
//
// Gravity does the platforming, as in the Bard's other side-on games: air pulls down, so a hop
// is an upward push each tick Up is held (gravity takes one more away every tick), and Q/E hop
// up and sideways at once (Game-Maker follows one key at a time). Space throws a splash of
// rosemary brine (power 220, two of them, at his head and his feet) once he has rosemary: it
// beats the wild loofahs of the aisle (150) and knocks each half of Scrubbus Maximus (200) a
// stage cleaner; the top half, cleansed, becomes the pink one.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { CANDLES, COINS, KEY, MON, PINK, SALT, SEQ, SND } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

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

/** The man's character file (one for every act). */
export function buildMan(cb: ReturnType<typeof buildCharBlocks>): Character {
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
    f({ pic: 'front', pause: 20 }),
    f({ pic: 'worry', pause: 14 }),
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
  // Space throws rosemary brine to the right (it plays through: "ground", or the joystick's idle
  // would cut in); its first frame steps right a pixel (and back), so the splashes fly to the right
  set(
    S[SEQ.throw],
    [f({ pic: 'throw0', x: 1, pause: 3 }), birth(MON.brine, 0), birth(MON.brine, -1), f({ pic: 'throw1', x: -1, pause: 4 }), f({ pic: 'front', pause: 2 })],
    {
      key: KEY.space,
      sound: SND.speak,
      ground: 1,
      norepeat: 1,
      jstkMov: JOY.any,
      jstkBut: 1,
    },
  );
  // B: he sings a line
  const sing = [f({ pic: 'sing0', pause: 8 }), f({ pic: 'sing1', pause: 10 }), f({ pic: 'sing0', pause: 6 }), f({ pic: 'front', pause: 2 })];
  set(S[SEQ.sing], sing, { key: KEY.b, sound: SND.wail, ground: 1, norepeat: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // dignity (hit points)
  ch.meter[1] = 3; // lives
  for (const n of [SALT, COINS, CANDLES, PINK]) ch.meter[n] = 1; // shown as meter - 1: none yet
  // no brine until the first sprig of rosemary (a count of 0 can't be thrown)
  ch.meter[SEQ.throw] = 0;
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
  /** Blocks the soaps and the wild loofahs pace. */
  run?: number;
  /** Blocks a drip falls from the shower head to the floor. */
  fall?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  const run = o.run ?? 3;
  // I. the haunted bathroom
  set[MON.drip] = mon(anim('drip0', 'drip1', 2), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 4), corner(0, o.fall ?? 8, 4, 1)]);
  set[MON.grapefruit] = mon(anim('grapefruit0', 'grapefruit1', 4), { power: 150, thru: 1 }, pace(run, 1));
  set[MON.mango] = mon(anim('mango0', 'mango1', 3), { power: 150, thru: 1 }, pace(1, 1));
  set[MON.towel] = mon(anim('towel0', 'towel1', 14), { power: 200, thru: 1 }, still);
  set[MON.bubble] = mon(anim('bubble0', 'bubble1', 6), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -3, 1, 0), corner(0, -6, 1, 4)]);
  set[MON.carl] = mon(anim('carl0', 'carl1', 1), { power: 50, thru: 0, newmon: MON.carlOff }, [
    corner(0, 0, 2),
    corner(3, -1, 2, 0),
    corner(5, 1, 2, 0),
    corner(2, 2, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  set[MON.carlOff] = mon(anim('carl0', 'carl1', 1), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 5), corner(6, -6, 5, 0)]);
  // II. the forest-dark aisle: wild loofahs (brine, 220, beats them into tame ones)
  set[MON.feral] = mon(anim('feral0', 'feral1', 4), { power: 150, thru: 1, newmon: MON.tame }, pace(run, 1));
  set[MON.tame] = mon(anim('tame0', 'tame1', 8), { power: 50, thru: 1 }, still);
  set[MON.owl] = mon(anim('owl0', 'owl1', 30), { power: 200, thru: 0 }, still);
  set[MON.loaf] = mon(anim('loaf0', 'loaf1', 8), { power: 50, thru: 0, newmon: MON.loafOff }, still);
  set[MON.loafOff] = mon(anim('loaf1', 'loaf0', 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, 0, 3, 4)]);
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 0, newmon: MON.seedOff }, still);
  set[MON.seedOff] = mon(anim('seed1', 'seed0', 3), { power: 100, thru: 0, end: 30 }, [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, 0, 3, 4)]);
  // III. home in the dark
  set[MON.teddy] = mon(anim('teddy0', 'teddy1', 20), { power: 200, thru: 1 }, still);
  set[MON.gwinn] = mon(anim('gwinn0', 'gwinn1', 24), { power: 200, thru: 1 }, still);
  set[MON.flapper] = mon(anim('flapper0', 'flapper1', 3), { power: 200, thru: 1 }, pace(run, 1, 0));
  set[MON.zzz] = mon(anim('zzz0', 'zzz1', 6), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -2, 1, 0), corner(0, -4, 1, 0)]);
  // IV. Scrubbus Maximus (both halves, four stages each), smug where it stands
  for (const half of ['A', 'B'] as const)
    for (let s = 0; s < 4; s++) {
      const slot = MON[`sponge${half}${s}` as keyof typeof MON];
      const next = s < 3 ? MON[`sponge${half}${s + 1}` as keyof typeof MON] : half === 'A' ? MON.pink : 64;
      set[slot] = mon(anim(`sponge${half}${s}a`, `sponge${half}${s}b`, 9 - s * 2), { power: 200, thru: 1, newmon: next }, still);
    }
  // cursed citrus suds: out of the soap dish in an arc to the left, a splat where they land
  const arc: March[] = [corner(0, 0, 3), corner(-2, -2, 3, 4), corner(-4, -3, 3, 4), corner(-7, -2, 3, 4), corner(-9, 1, 3, 4), corner(-11, 4, 3, 4)];
  set[MON.suds] = mon(anim('suds0', 'suds1', 2), { power: 200, thru: 0, end: -1, newmon: MON.splat }, arc);
  set[MON.splat] = mon([[n('splat'), 4]], { power: 200, thru: 0, end: 18 });
  set[MON.brine] = mon(anim('brine0', 'brine1', 2), { power: 220, thru: 1, towards: 8, end: 28 });
  set[MON.pink] = mon(anim('pink0', 'pink1', 4), { power: 230, thru: 1 }, still);
  set[MON.steam] = mon(anim('steam0', 'steam1', 8), { power: 150, thru: 0, end: -1 }, [corner(0, 0, 1), corner(1, -3, 1, 0), corner(-1, -6, 1, 4)]);
  return set;
}

export { MON };
