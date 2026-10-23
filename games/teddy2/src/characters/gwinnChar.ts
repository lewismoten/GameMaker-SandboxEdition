// gwinn.chr and gwinn.cbl: Gwinn's poses and her tricks, for the "Meanwhile..." levels where
// she is the hero. A scene names its own character file, so these levels simply load hers.
// She walks faster and hops higher than Teddy (she is twice his size), and her tricks are
// her own: BOOF, a big dig, chewing, zoomies and a sit she has not quite learned.
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { CTR, GSEQ, KEY, MON, SND } from '../ids';
import { GWINN_HERO } from '../sprites/gwinnHero';
import { ZZZ } from '../sprites/teddy';

export const GB = new BlockSet(50, true);
for (const [name, px] of Object.entries(GWINN_HERO)) GB.add(name, px);
GB.add('zzz', ZZZ);

const MIRROR = 0x40;
const c = (name: string) => GB.id(name);

function f(pic: string, pause: number, o: { x?: number; y?: number; mirror?: boolean; top?: string } = {}): Frame {
  return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: o.top ? c(o.top) : CHARBL, pic2: c(pic), pause, orient: o.mirror ? MIRROR : 0 };
}

function birth(mon: number, row = 0): Frame {
  return { ...emptyFrame(), x: 0, y: (row + 1) * 20, pic1: mon, pic2: MONBL, pause: 1 };
}

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
}

/** Gwinn's walking speed in pixels per tick (Teddy's is 5). */
export const GSTEP = 7;
/** Her hop: a stronger push per tick while Up is held (Teddy's is 11). */
export const GHOP = 12;

export function buildGwinn(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[GSEQ.idle], [
    f('gFront', 30),
    f('gFrontBlink', 3),
    f('gFront', 20),
    f('gWiggle', 4),
    f('gFront', 4),
    f('gWiggle', 4),
    f('gFront', 26),
    f('gFrontBlink', 3),
  ]);
  set(S[GSEQ.die], [f('gHurt', 3), f('gFront', 5), f('gSleep', 8), f('gSleep', 30, { top: 'zzz' })], { sound: SND.sleep, jstkBut: 0 });
  set(S[GSEQ.hurt], [f('gHurt', 2), f('gFront', 1), f('gHurt', 2), f('gFront', 1)], { sound: SND.yelp, jstkBut: 0 });
  set(S[GSEQ.fetch], [f('gChew1', 3), f('gFront', 3)], { key: KEY.f, sound: SND.fetch, ground: 1, norepeat: 1 });
  set(S[GSEQ.drop], [f('gFront', 1)], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['gwinn1', 'gwinn2', 'gwinn3', 'gwinn2'].map((p) => f(p, 1, { x: dx, mirror }));
  set(S[GSEQ.right], walk(GSTEP, false), { key: KEY.right, jstkMov: 3 });
  set(S[GSEQ.left], walk(-GSTEP, true), { key: KEY.left, jstkMov: 7 });
  set(S[GSEQ.hop], [f('gwinnRun1', 1, { y: -GHOP })], { key: KEY.up, jstkMov: 1, sound: SND.hop });
  set(S[GSEQ.rightD], walk(GSTEP, false), { key: KEY.d });
  set(S[GSEQ.leftA], walk(-GSTEP, true), { key: KEY.a });
  set(S[GSEQ.hopW], [f('gwinnRun1', 1, { y: -GHOP })], { key: KEY.w, sound: SND.hop });
  set(S[GSEQ.hopLeft], [f('gwinnRun1', 1, { x: -GSTEP, y: -GHOP, mirror: true }), f('gwinnRun2', 1, { x: -GSTEP, y: -GHOP, mirror: true })], {
    key: KEY.q,
    jstkMov: 8,
    sound: SND.hop,
  });
  set(S[GSEQ.hopRight], [f('gwinnRun1', 1, { x: GSTEP, y: -GHOP }), f('gwinnRun2', 1, { x: GSTEP, y: -GHOP })], { key: KEY.e, jstkMov: 2, sound: SND.hop });
  set(S[GSEQ.boof], [f('gBoof', 2), birth(MON.boof), f('gBoof', 4), f('gFront', 2)], {
    key: KEY.space,
    sound: SND.boof,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  set(S[GSEQ.dig], [f('gDig1', 2), birth(MON.bigDig, 1), f('gDig2', 2), f('gDig1', 2), f('gDig2', 2), f('gDig1', 2), f('gDig2', 2)], {
    key: KEY.down,
    sound: SND.dig,
    ground: 1,
    norepeat: 1,
    jstkMov: 5,
  });
  set(S[GSEQ.chew], [f('gChew1', 2), birth(MON.chomp), f('gChew2', 2), f('gChew1', 2), f('gChew2', 2), f('gFront', 2)], {
    key: KEY.five,
    sound: SND.chomp,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 2,
  });
  // SIT: she gets about halfway, sits for one tick, and is up again wiggling. Still learning.
  set(S[GSEQ.sit], [f('gSitHalf', 3), f('gSat', 2), birth(MON.almost, -1), f('gWiggle', 3), f('gFront', 2), f('gWiggle', 3), f('gFront', 2)], {
    key: KEY.sit,
    sound: SND.sit,
    ground: 1,
    norepeat: 1,
  });
  // ZOOMIES: a brown blur there and back, a dust devil bowling off to each side.
  set(
    S[GSEQ.zoom],
    [
      f('gwinnRun1', 1, { x: 12 }),
      f('gwinnRun2', 1, { x: 12 }),
      birth(MON.zoomR),
      f('gwinnRun1', 1, { x: -12, mirror: true }),
      f('gwinnRun2', 1, { x: -12, mirror: true }),
      f('gwinnRun1', 1, { x: -12, mirror: true }),
      birth(MON.zoomL),
      f('gwinnRun2', 1, { x: -12, mirror: true }),
      f('gwinnRun1', 1, { x: 12 }),
      f('gwinnRun2', 1, { x: 12 }),
    ],
    { key: KEY.spin, sound: SND.zoom, ground: 1, norepeat: 1 },
  );
  set(S[GSEQ.flop], [f('gwinnRoll', 2)], { key: KEY.dead, sound: SND.flop });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[CTR.lives] = 3;
  ch.meter[CTR.treats] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
