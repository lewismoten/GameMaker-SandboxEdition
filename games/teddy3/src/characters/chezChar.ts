// chez.chr and chez.cbl: THE CHEZ on the driving stops (Doc Leo at the wheel, Teddy riding
// along). Right/Left (D/A) drive at 7 pixels a tick, a little quicker than Teddy trots;
// Up (W) bumps the car up on its springs, enough for a pothole or a curb, and Q/E bump it
// forward; Space HONKS, and the honk rolls ahead like a bark (geese and ducks scatter, and a
// drawbridge keeper lowers the bridge). It runs on charge (counter 22): chargers by the road
// give it, the hills take it (levels/road.ts).
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BlockSet } from '../blocks/blockset';
import { CSEQ, CTR, KEY, MON, SND } from '../ids';
import { CHEZ_HERO } from '../sprites/chezHero';

export const ZB = new BlockSet(50, true);
for (const [name, px] of Object.entries(CHEZ_HERO)) ZB.add(name, px);

const MIRROR = 0x40;
const c = (name: string) => ZB.id(name);

function f(pic: string, pause: number, o: { x?: number; y?: number; mirror?: boolean } = {}): Frame {
  return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: CHARBL, pic2: c(pic), pause, orient: o.mirror ? MIRROR : 0 };
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

/** THE CHEZ's top speed, in pixels per tick (Teddy trots at 5). */
const DRIVE = 7;
/** The bump on its springs, per tick while Up is held (Teddy hops with 11): a block or so. */
const BUMP = 9;

export function buildChez(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[CSEQ.idle], [f('car0', 6), f('car1', 6)]);
  set(S[CSEQ.die], [f('carFlash', 3), f('carLow', 5), f('carSag', 40)], { sound: SND.sleep, jstkBut: 0 });
  set(S[CSEQ.hurt], [f('carFlash', 2), f('car0', 1), f('carFlash', 2), f('car0', 1)], { sound: SND.squeak, jstkBut: 0 });
  set(S[CSEQ.fetch], [f('car0', 1)], { key: 0 });
  set(S[CSEQ.drop], [f('car0', 1)], { key: 0 });
  const drive = (dx: number, mirror: boolean) => ['car0', 'car1', 'car0', 'car1'].map((p) => f(p, 1, { x: dx, mirror }));
  set(S[CSEQ.right], drive(DRIVE, false), { key: KEY.right, jstkMov: 3 });
  set(S[CSEQ.left], drive(-DRIVE, true), { key: KEY.left, jstkMov: 7 });
  set(S[CSEQ.rightD], drive(DRIVE, false), { key: KEY.d });
  set(S[CSEQ.leftA], drive(-DRIVE, true), { key: KEY.a });
  set(S[CSEQ.bump], [f('carHop', 1, { y: -BUMP }), f('carHop', 1, { y: -BUMP })], { key: KEY.up, jstkMov: 1, sound: SND.hop });
  set(S[CSEQ.bumpW], [f('carHop', 1, { y: -BUMP }), f('carHop', 1, { y: -BUMP })], { key: KEY.w, sound: SND.hop });
  set(S[CSEQ.bumpLeft], [f('carHop', 1, { x: -DRIVE, y: -BUMP, mirror: true }), f('carHop', 1, { x: -DRIVE, y: -BUMP, mirror: true })], {
    key: KEY.q,
    jstkMov: 8,
    sound: SND.hop,
  });
  set(S[CSEQ.bumpRight], [f('carHop', 1, { x: DRIVE, y: -BUMP }), f('carHop', 1, { x: DRIVE, y: -BUMP })], { key: KEY.e, jstkMov: 2, sound: SND.hop });
  set(S[CSEQ.honk], [f('car1', 1), birth(MON.honk), f('car0', 4)], { key: KEY.space, sound: SND.gate, ground: 1, norepeat: 1, jstkMov: 9, jstkBut: 1 });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[CTR.lives] = 3;
  ch.meter[CTR.treats] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
