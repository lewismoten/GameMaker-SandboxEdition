// watt.chr: Watt the repair robot. He rolls exactly one block per key press (five frames
// of four pixels, which can't be interrupted), so he always stands squarely on the grid
// and bumps switches cleanly. Arrows, W A S D and the number pad all steer; R reboots.
import { CHARBL, MONBL } from '../../web/src/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../web/src/formats/character';
import { KEY, SND } from './ids';
import type { BlockSet } from './sets';

const MIRROR = 0x40;
/** Pixels a frame: five frames a block. A bump then reaches 8 pixels into a switch, short
 * of the wire running through its middle (rows/columns 8..11). */
export const STEP = 4;

export const SEQ = { idle: 0, die: 1, hurt: 2, up: 5, down: 6, left: 7, right: 8, w: 9, s: 10, a: 11, d: 12, reboot: 13 } as const;

export function buildWatt(cb: BlockSet, bombMonster: number): Character {
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

  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 70), f('blink', 3), f('down0', 4), f('blink', 3)]);
  set(S[SEQ.die], [f('zapped', 2), f('down0', 1), f('zapped', 2), f('down0', 1), f('zapped', 3), f('toast', 10), f('bolts0', 6), f('bolts1', 14)], {
    sound: SND.fizzle,
    jstkBut: 0,
  });
  set(S[SEQ.hurt], [f('zapped', 1)], { sound: SND.zap, jstkBut: 0 });
  set(S[3], [f('down0', 1)], { key: 0 });
  set(S[4], [f('down0', 1)], { key: 0 });

  const roll = (dx: number, dy: number, a: string, b: string, mirror = false) => [a, b, a, b, a].map((p) => f(p, 1, { x: dx * STEP, y: dy * STEP, mirror }));
  const move = { ground: 1 };
  set(S[SEQ.up], roll(0, -1, 'up0', 'up1'), { key: KEY.up, jstkMov: 1, ...move });
  set(S[SEQ.down], roll(0, 1, 'down0', 'down1'), { key: KEY.down, jstkMov: 5, ...move });
  set(S[SEQ.left], roll(-1, 0, 'side0', 'side1'), { key: KEY.left, jstkMov: 7, ...move });
  set(S[SEQ.right], roll(1, 0, 'side0', 'side1', true), { key: KEY.right, jstkMov: 3, ...move });
  set(S[SEQ.w], roll(0, -1, 'up0', 'up1'), { key: KEY.w, ...move });
  set(S[SEQ.s], roll(0, 1, 'down0', 'down1'), { key: KEY.s, ...move });
  set(S[SEQ.a], roll(-1, 0, 'side0', 'side1'), { key: KEY.a, ...move });
  set(S[SEQ.d], roll(1, 0, 'side0', 'side1', true), { key: KEY.d, ...move });
  // Reboot: Watt sets off a little "boing" on his own block, which zaps him back to the
  // start of the board (and costs a spare battery).
  const bomb: Frame = { ...emptyFrame(), x: 0, y: 20, pic1: bombMonster, pic2: MONBL, pause: 1 };
  set(S[SEQ.reboot], [f('zapped', 2), bomb, f('zapped', 6)], { key: KEY.r, sound: SND.boing, ground: 1, norepeat: 1, jstkBut: 0 });

  ch.meter[0] = 1; // one hit point: any zap reboots
  ch.meter[1] = 9; // spare batteries
  return ch;
}
