// joe.chr: Mystery Robot Joe walks exactly one block per step (four frames that can't be
// cut short, the first held long enough that a quick tap is one block), so he always stands
// squarely on the library's grid. Hold an arrow to keep walking. Arrows, W A S D and the number pad all steer. Nothing in the
// library can hurt him; the worst a shusher can do is fine him a point a tick.
import { CHARBL } from '../../../../web/src/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { KEY, SND } from '../ids';
import type { BlockSet } from '../blocks/sets';

const MIRROR = 0x40;
/** Each walk frame: pixels moved, ticks shown. They add up to one block (20 pixels). */
const WALK = [
  [4, 5],
  [5, 1],
  [5, 1],
  [6, 1],
] as const;

export const SEQ = { idle: 0, die: 1, hurt: 2, up: 5, down: 6, left: 7, right: 8, w: 9, s: 10, a: 11, d: 12 } as const;

export function buildJoe(cb: BlockSet): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (pic: string, pause: number, o: { x?: number; y?: number; mirror?: boolean } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: CHARBL,
    pic2: cb.id(pic),
    pause,
    orient: o.mirror ? MIRROR : 0,
  });
  const set = (s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}) => {
    if (frames.length > 10) throw new Error('Too many frames');
    frames.forEach((fr, i) => (s.frames[i] = fr));
    for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
    Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
  };

  // idle: blinks now and then, and every so often holds a finger to his grille: shhh.
  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 60), f('blink', 3), f('down0', 30), f('shh', 24), f('down0', 4), f('blink', 3)]);
  set(S[SEQ.die], [f('blink', 4), f('shh', 10), f('blink', 10)], { jstkBut: 0 });
  set(S[SEQ.hurt], [f('blink', 1)], { jstkBut: 0 });
  // Space pockets what Joe stands on, if Game-Maker calls it a Pick-up (one thing in the library is)
  set(S[3], [f('blink', 2), f('shh', 3), f('down0', 1)], { key: KEY.space, sound: SND.word, ground: 1, norepeat: 1 });
  set(S[4], [f('down0', 1)], { key: 0 });

  // One block is a 4 pixel step held for 5 ticks, then three short strides (5, 5 and 6 pixels,
  // so he never jumps more than 6 at once and the walk looks smooth): 8 ticks of the 18.2 Hz
  // clock (440 ms) a block. PLAYGAME applies a key event during a ground sequence
  // only while its first frame is up (PLAYGAME.C's KeysPending), and a sequence repeats when
  // its key still reads as down at its end, so a release that waits past frame 0 walks a
  // second block. With frame 0 held 5 ticks, a tap shorter than 275 ms walks one block.
  const walk = (dx: number, dy: number, a: string, b: string, mirror = false) =>
    WALK.map(([px, pause], i) => f(i % 2 ? b : a, pause, { x: dx * px, y: dy * px, mirror }));
  const move = { ground: 1 };
  set(S[SEQ.up], walk(0, -1, 'up0', 'up1'), { key: KEY.up, jstkMov: 1, ...move });
  set(S[SEQ.down], walk(0, 1, 'down0', 'down1'), { key: KEY.down, jstkMov: 5, ...move });
  set(S[SEQ.left], walk(-1, 0, 'side0', 'side1'), { key: KEY.left, jstkMov: 7, ...move });
  set(S[SEQ.right], walk(1, 0, 'side0', 'side1', true), { key: KEY.right, jstkMov: 3, ...move });
  set(S[SEQ.w], walk(0, -1, 'up0', 'up1'), { key: KEY.w, ...move });
  set(S[SEQ.s], walk(0, 1, 'down0', 'down1'), { key: KEY.s, ...move });
  set(S[SEQ.a], walk(-1, 0, 'side0', 'side1'), { key: KEY.a, ...move });
  set(S[SEQ.d], walk(1, 0, 'side0', 'side1', true), { key: KEY.d, ...move });

  ch.meter[0] = 10; // hit points: nothing here takes any
  ch.meter[1] = 3; // lives: nothing here takes any either
  // Counters read one more than they hold: no words, and no stories restored in any wing.
  ch.meter[3] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  return ch;
}
