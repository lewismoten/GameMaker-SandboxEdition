// teddy.chr and teddy.cbl: Teddy's poses and the tricks bound to keys. Walking left and
// right are the only side views (mirrored by the frame orientation); every trick faces
// the player, so Teddy never seems to turn around by himself.
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { CTR, KEY, MON, SEQ, SND } from '../ids';
import { POSES, ZZZ } from '../sprites/teddy';

export const CB = new BlockSet(50, true);
for (const [name, px] of Object.entries(POSES)) CB.add(name, px);
CB.add('zzz', ZZZ);

const MIRROR = 0x40;
const c = (name: string) => CB.id(name);

/** A frame showing one pose (the bottom block; the top block only for the zzz). */
function f(pic: string, pause: number, o: { x?: number; y?: number; mirror?: boolean; top?: string } = {}): Frame {
  return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: o.top ? c(o.top) : CHARBL, pic2: c(pic), pause, orient: o.mirror ? MIRROR : 0 };
}

/** A frame that gives birth to a monster: row 0 = Teddy's row, -1 above, +1 below. */
function birth(mon: number, row = 0): Frame {
  return { ...emptyFrame(), x: 0, y: (row + 1) * 20, pic1: mon, pic2: MONBL, pause: 1 };
}

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
}

/** Walking speed in pixels per clock tick (18.2 ticks a second). */
export const STEP = 5;
/** Upward push per tick while Up is held (gravity takes one more away every tick). */
export const HOP = 11;

export function buildCharacter(): Character {
  const ch = newCharacter();
  const S = ch.sequences;

  set(S[SEQ.idle], [
    f('front', 36),
    f('frontBlink', 3),
    f('front', 24),
    f('frontTilt', 20),
    f('front', 18),
    f('frontBlink', 3),
    f('front', 30),
    f('back', 14),
    f('front', 10),
  ]);
  set(S[SEQ.die], [f('hurt', 3), f('frontTilt', 5), f('front', 4), f('sleep', 8), f('sleep', 30, { top: 'zzz' })], { sound: SND.sleep, jstkBut: 0 });
  set(S[SEQ.hurt], [f('hurt', 2), f('front', 1), f('hurt', 2), f('front', 1)], { sound: SND.yelp, jstkBut: 0 });
  set(S[SEQ.fetch], [f('digBack1', 3), f('front', 3)], { key: KEY.f, sound: SND.fetch, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('front', 1)], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['walk1', 'stand', 'walk2', 'stand'].map((p) => f(p, 1, { x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.hop], [f('backHop', 1, { y: -HOP })], { key: KEY.up, jstkMov: 1, sound: SND.hop });
  // The same moves on W/A/D, and Q/E hop up and sideways at once (Game-Maker follows one
  // key at a time, so Up and Right held together can't). Down/dig has no S copy: the
  // twenty sequences are all taken.
  set(S[SEQ.rightD], walk(STEP, false), { key: KEY.d });
  set(S[SEQ.leftA], walk(-STEP, true), { key: KEY.a });
  set(S[SEQ.hopW], [f('backHop', 1, { y: -HOP })], { key: KEY.w, sound: SND.hop });
  set(S[SEQ.hopLeft], [f('walk1', 1, { x: -STEP, y: -HOP, mirror: true }), f('walk2', 1, { x: -STEP, y: -HOP, mirror: true })], {
    key: KEY.q,
    jstkMov: 8,
    sound: SND.hop,
  });
  set(S[SEQ.hopRight], [f('walk1', 1, { x: STEP, y: -HOP }), f('walk2', 1, { x: STEP, y: -HOP })], { key: KEY.e, jstkMov: 2, sound: SND.hop });
  set(S[SEQ.speak], [f('frontBark', 2), birth(MON.woof), f('frontBark', 3), f('front', 2)], {
    key: KEY.space,
    sound: SND.woof,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  set(S[SEQ.dig], [f('digBack1', 2), birth(MON.dig, 1), f('digBack2', 2), f('digBack1', 2), f('digBack2', 2), f('digBack1', 2)], {
    key: KEY.down,
    sound: SND.dig,
    ground: 1,
    norepeat: 1,
    jstkMov: 5,
  });
  // The high five's raised paw stays in Teddy's own block: a top block in a one-block-high
  // tunnel would let PLAYGAME's chkdowns skip the floor (its corner seal) and drop him into the dirt.
  set(S[SEQ.five], [f('frontReach', 2), birth(MON.paw, -1), f('frontReach', 5), f('front', 2)], {
    key: KEY.five,
    sound: SND.slap,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 2,
  });
  set(S[SEQ.sit], [f('frontBeg', 3), birth(MON.heart), f('frontBeg', 9), f('front', 2)], { key: KEY.sit, sound: SND.sit, ground: 1, norepeat: 1 });
  set(
    S[SEQ.spin],
    [
      f('stand', 2),
      f('back', 2),
      f('stand', 2, { mirror: true }),
      birth(MON.whirlL),
      birth(MON.whirlR),
      f('front', 2),
      f('stand', 2),
      f('back', 2),
      f('stand', 2, { mirror: true }),
      f('front', 2),
    ],
    { key: KEY.spin, sound: SND.spin, ground: 1, norepeat: 1 },
  );
  set(
    S[SEQ.roll],
    [f('dead', 2), f('roll1', 3), f('roll2', 3), birth(MON.fluff), f('roll1', 3, { mirror: true }), f('dead', 2, { mirror: true }), f('front', 2)],
    {
      key: KEY.roll,
      sound: SND.roll,
      ground: 1,
      norepeat: 1,
    },
  );
  set(S[SEQ.dead], [f('dead', 2)], { key: KEY.dead, sound: SND.flop });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // energy
  ch.meter[CTR.lives] = 3;
  ch.meter[CTR.treats] = 1; // counters read one more than they hold
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
