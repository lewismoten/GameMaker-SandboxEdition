// POET.CHR (Will the poet: tiptoe, hop, sneak, declaim to both sides of the room, and say the
// monologue's line; his composure, lives and counters) and the monsters every .MON starts with.
//
// Gravity does the platforming, as in the Bard's other side-on games: air pulls down, so a hop
// is an upward push each tick Up is held (gravity takes one more away every tick), and Q/E hop
// up and sideways at once (Game-Maker follows one key at a time). Space declaims: a word balloon
// flies out to each side along a path of its own (power 160), beating what comes at him (150);
// it doesn't hurt friends, the dogs or the tough things (200). B says the monologue's line.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { emptyMonster, type March, type Monster } from '../../../../web/src/formats/monster';
import { COFFEE, KEY, MON, PLOT, POWER, SEQ, SND } from '../ids';
import type { buildCharBlocks, SpriteBook } from './sprites';

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
/** Blocks a word balloon flies before it bursts. */
export const WORD_REACH = 5;

type F = { pic: string; x?: number; y?: number; pause?: number; mirror?: boolean };

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

/** A frame that gives birth to a monster on his row. */
const birth = (mon: number): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 0 });

/** The poet's character file (every scene loads it). */
export function buildPoet(cb: ReturnType<typeof buildCharBlocks>): Character {
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
    f({ pic: 'yorick', pause: 22 }),
    f({ pic: 'front', pause: 18 }),
    f({ pic: 'blink', pause: 3 }),
    f({ pic: 'smug', pause: 16 }),
  ]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 3 }), f({ pic: 'faint0', pause: 8 }), f({ pic: 'faint1', pause: 30 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'declaim0', pause: 1 }), f({ pic: 'hurt', pause: 2 }), f({ pic: 'front', pause: 1 })], {
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
  // Space: declaim to both sides of the room (plays through: "ground", or the joystick's idle cuts in)
  set(
    S[SEQ.declaim],
    [
      f({ pic: 'declaim1', pause: 2 }),
      birth(MON.wordR),
      birth(MON.wordL),
      f({ pic: 'declaim1', pause: 6 }),
      f({ pic: 'declaim0', pause: 4 }),
      f({ pic: 'front', pause: 2 }),
    ],
    {
      key: KEY.space,
      sound: SND.declaim,
      ground: 1,
      norepeat: 1,
      jstkMov: JOY.any,
      jstkBut: 1,
    },
  );
  // B: the line, hand on heart
  set(S[SEQ.line], [f({ pic: 'declaim0', pause: 10 }), f({ pic: 'yorick', pause: 14 }), f({ pic: 'declaim0', pause: 8 }), f({ pic: 'front', pause: 2 })], {
    key: KEY.b,
    sound: SND.line,
    ground: 1,
    norepeat: 1,
  });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // composure (hit points)
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1; // tips: shown as meter - 1
  ch.meter[COFFEE] = 1;
  ch.meter[PLOT] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

export const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

/** A monster from its frames ([block, ticks]...), options and march path. */
export function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

/** Back and forth `run` blocks (to the right first) at `speed`, facing the way it goes. */
export const pace = (run: number, speed: number, dy = 0): March[] => [corner(0, 0, speed), corner(run, dy, speed, 0), corner(0, 0, speed, 4)];
/** Up and down `run` blocks. */
export const bob = (run: number, speed: number): March[] => [corner(0, 0, speed), corner(0, -run, speed, 0), corner(0, 0, speed, 0)];
export const still: March[] = [corner(0, 0, 1), corner(0, 0, 1)];

/** Two frames of a sprite book's blocks, `t` ticks each. */
export const anim = (mb: SpriteBook, a: string, b: string, t = 3): [number, number][] => [
  [mb.n(a), t],
  [mb.n(b), t],
];

/** Fills the monster slots every .MON shares (ids.ts MON). */
export function commonMonsters(set: Monster[], mb: SpriteBook): void {
  const out = (dir: 1 | -1): March[] => [corner(0, 0, 6), corner(WORD_REACH * dir, 0, 6, dir > 0 ? 0 : 4)];
  set[MON.wordR] = mon(anim(mb, 'wordR0', 'wordR1', 2), { power: POWER.word, thru: 0, end: -1, newmon: MON.burst }, out(1));
  set[MON.wordL] = mon(anim(mb, 'wordL0', 'wordL1', 2), { power: POWER.word, thru: 0, end: -1, newmon: MON.burst }, out(-1));
  set[MON.burst] = mon(anim(mb, 'burst0', 'burst1', 2), { power: POWER.friend, thru: 0, end: 6 });
  set[MON.teddy] = mon(anim(mb, 'teddy0', 'teddy1', 20), { power: POWER.tough, thru: 1 }, still);
  set[MON.gwinn] = mon(anim(mb, 'gwinn0', 'gwinn1', 24), { power: POWER.tough, thru: 1 }, still);
  // friends: a hello (a touch) is a tip, and off they go
  // (a friend going off is gone before it could walk back; the walk back is still drawn turned
  // round, so the path reads the way it would look)
  set[MON.carl] = mon(anim(mb, 'carl0', 'carl1', 1), { power: POWER.friend, thru: 0, newmon: MON.carlOff }, [
    corner(0, 0, 2),
    corner(3, -1, 2, 0),
    corner(5, 1, 2, 0),
    corner(2, 2, 2, 4),
    corner(0, 0, 2, 4),
  ]);
  set[MON.carlOff] = mon(anim(mb, 'carlAway0', 'carlAway1', 1), { power: POWER.tough, thru: 0, end: 30 }, [
    corner(0, 0, 5),
    corner(6, -6, 5, 0),
    corner(0, 0, 5, 4),
  ]);
  set[MON.goat] = mon(anim(mb, 'goat0', 'goat1', 8), { power: POWER.friend, thru: 0, newmon: MON.goatOff }, still);
  set[MON.goatOff] = mon(anim(mb, 'goatAway1', 'goatAway0', 3), { power: POWER.tough, thru: 0, end: 30 }, [corner(0, 0, 2), corner(-4, 0, 2, 4)]);
  set[MON.leo] = mon(anim(mb, 'leo0', 'leo1', 6), { power: POWER.friend, thru: 0, newmon: MON.leoOff }, pace(2, 1));
  set[MON.leoOff] = mon(anim(mb, 'leoAway1', 'leoAway0', 4), { power: POWER.tough, thru: 0, end: 40 }, [
    corner(0, 0, 2),
    corner(5, 0, 2, 0),
    corner(0, 0, 2, 4),
  ]);
}
