// leo.chr and leo.cbl: Doc Leo, two blocks tall, for his MEANWHILE... levels. He strolls (a
// little slower than Teddy), hops, fetches, and has three clown tricks: SQUAWK (Space, the
// rubber chicken: pests can't stand it), BALLOON (1: a balloon dog inflates under his shoes
// and floats him up, until it pops) and PRATFALL (4, hold: flat on his back, so whatever
// flies at head height sails over).
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { CTR, KEY, LSEQ, MON, SND } from '../ids';
import { LEO, LEO_FLAT } from '../sprites/leo';
import { ZZZ } from '../sprites/teddy';

export const LB = new BlockSet(50, true);
for (const [name, px] of Object.entries(LEO)) {
  LB.add(`${name}T`, px.crop(0, 0, 20, 20));
  LB.add(`${name}B`, px.crop(0, 20, 20, 20));
}
LB.add('flat', LEO_FLAT);
LB.add('zzz', ZZZ);

/** Both blocks mirrored (low nibble: the top block, high nibble: the bottom one). */
const MIRROR_BOTH = 0x44;
const c = (name: string) => LB.id(name);

/** A frame showing a pose (both blocks, or only the bottom one for the pratfall). */
function f(pose: string, pause: number, o: { x?: number; y?: number; mirror?: boolean } = {}): Frame {
  const flat = pose === 'flat';
  return {
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: flat ? CHARBL : c(`${pose}T`),
    pic2: flat ? c('flat') : c(`${pose}B`),
    pause,
    orient: o.mirror ? MIRROR_BOTH : 0,
  };
}

/** The die sequence's last frame: asleep, with the zzz over him. */
function snooze(pause: number): Frame {
  return { ...emptyFrame(), pic1: c('zzz'), pic2: c('flat'), pause, orient: 0 };
}

/** A frame that gives birth to a monster: row 0 = his feet's row, -1 his head's, +1 below. */
function birth(mon: number, row = 0): Frame {
  return { ...emptyFrame(), x: 0, y: (row + 1) * 20, pic1: mon, pic2: MONBL, pause: 1 };
}

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
}

/** Doc Leo's stroll, in pixels per tick (Teddy trots at 5). */
export const LSTEP = 4;
/** His hop (Teddy's is 11). */
export const LHOP = 11;

export function buildLeo(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[LSEQ.idle], [f('front', 40), f('frontBlink', 3), f('front', 30), f('wave', 14), f('front', 30), f('frontBlink', 3)]);
  set(S[LSEQ.die], [f('hurt', 3), f('front', 5), f('flat', 8), snooze(30)], { sound: SND.sleep, jstkBut: 0 });
  set(S[LSEQ.hurt], [f('hurt', 2), f('front', 1), f('hurt', 2), f('front', 1)], { sound: SND.squeak, jstkBut: 0 });
  set(S[LSEQ.fetch], [f('twist1', 3), f('front', 3)], { key: KEY.f, sound: SND.fetch, ground: 1, norepeat: 1 });
  set(S[LSEQ.drop], [f('front', 1)], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['side1', 'side2', 'side3', 'side4'].map((p) => f(p, 1, { x: dx, mirror }));
  set(S[LSEQ.right], walk(LSTEP, false), { key: KEY.right, jstkMov: 3 });
  set(S[LSEQ.left], walk(-LSTEP, true), { key: KEY.left, jstkMov: 7 });
  set(S[LSEQ.hop], [f('hop', 1, { y: -LHOP })], { key: KEY.up, jstkMov: 1, sound: SND.hop });
  set(S[LSEQ.rightD], walk(LSTEP, false), { key: KEY.d });
  set(S[LSEQ.leftA], walk(-LSTEP, true), { key: KEY.a });
  set(S[LSEQ.hopW], [f('hop', 1, { y: -LHOP })], { key: KEY.w, sound: SND.hop });
  set(S[LSEQ.hopLeft], [f('sideHop', 1, { x: -LSTEP, y: -LHOP, mirror: true }), f('sideHop', 1, { x: -LSTEP, y: -LHOP, mirror: true })], {
    key: KEY.q,
    jstkMov: 8,
    sound: SND.hop,
  });
  set(S[LSEQ.hopRight], [f('sideHop', 1, { x: LSTEP, y: -LHOP }), f('sideHop', 1, { x: LSTEP, y: -LHOP })], { key: KEY.e, jstkMov: 2, sound: SND.hop });
  // SQUAWK: the chicken up high, and its squawk rolls off ahead along the ground.
  set(S[LSEQ.squawk], [f('squawk', 2), birth(MON.squawk), f('squawk', 4), f('front', 2)], {
    key: KEY.space,
    sound: SND.squawk,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  // BALLOON: a twist, a squeak, and a balloon dog inflates right under his shoes.
  set(S[LSEQ.balloon], [f('twist1', 3), f('twist2', 3), f('twist1', 3), birth(MON.balloon, 1), f('front', 2)], {
    key: KEY.five,
    sound: SND.twist,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 2,
  });
  // PRATFALL: flat on his back for as long as 4 is held.
  set(S[LSEQ.pratfall], [f('flat', 2)], { key: KEY.dead, sound: SND.flop });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // energy
  ch.meter[CTR.lives] = 3;
  ch.meter[CTR.treats] = 1; // counters read one more than they hold
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
