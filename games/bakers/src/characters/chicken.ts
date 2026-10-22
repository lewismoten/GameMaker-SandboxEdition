// chick.chr: Sir Reginald Cluckington III, played for the one room Doc Leo cannot fit in
// (under the Bakehouse stove). He waddles a block a step with the arrows, like Doc Leo (five
// frames of four pixels, so he too always stands square on the grid), but W A S D flap him
// into a glide: two blocks in the time of one step (five frames of eight pixels; a wall
// stops him square after one). Space squawks (the same squawk monster: mice run), B bounces
// (squash, stretch, boing; it does nothing, he is rubber), a hurt is a bounce too, and he
// plays dead by going flat. The counters, lives and hit points are the game's and carry over.
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { CHICK_SEQ as SEQ, FIXED_BLOCK, KEY, MON, SND } from '../ids';
import type { BlockSet } from '../blocks/sets';
import { HIT_POINTS, STEP } from './leo';

const MIRROR = 0x40;
/** Pixels a glide frame covers: five of them are two blocks. */
export const GLIDE = 8;

export function buildChicken(cb: BlockSet): Character {
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
  const birth = (mon: number): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 1 });
  const set = (s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}) => {
    if (frames.length > 10) throw new Error('Too many frames');
    frames.forEach((fr, i) => (s.frames[i] = fr));
    for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
    Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
  };

  // idle: blinks, and now and then a little bounce (he cannot help it)
  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 60), f('squash', 3), f('stretch', 3), f('down0', 40), f('blink', 3)]);
  set(S[SEQ.die], [f('hurt', 3), f('squash', 3), f('dead', 12), f('dead2', 14), f('dead', 14)], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f('squash', 1), f('stretch', 1)], { sound: SND.boing, jstkBut: 0, ground: 1 });
  set(S[SEQ.pickup], [f('down0', 2), f('blink', 2)], { key: KEY.enter, sound: SND.pickup, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });

  const walk = (dx: number, dy: number, a: string, b: string, mirror = false) => [a, b, a, b, a].map((p) => f(p, 1, { x: dx * STEP, y: dy * STEP, mirror }));
  const move = { ground: 1 };
  set(S[SEQ.up], walk(0, -1, 'up0', 'up1'), { key: KEY.up, jstkMov: 1, ...move });
  set(S[SEQ.down], walk(0, 1, 'down0', 'down1'), { key: KEY.down, jstkMov: 5, ...move });
  set(S[SEQ.left], walk(-1, 0, 'side0', 'side1', true), { key: KEY.left, jstkMov: 7, ...move });
  set(S[SEQ.right], walk(1, 0, 'side0', 'side1'), { key: KEY.right, jstkMov: 3, ...move });
  // W A S D: flap and glide, two blocks
  const glide = (dx: number, dy: number, a: string, b: string, mirror = false) => [a, b, a, b, a].map((p) => f(p, 1, { x: dx * GLIDE, y: dy * GLIDE, mirror }));
  set(S[SEQ.w], glide(0, -1, 'flapUp', 'up1'), { key: KEY.w, sound: SND.toy, ...move });
  set(S[SEQ.s], glide(0, 1, 'flapDown', 'down1'), { key: KEY.s, sound: SND.toy, ...move });
  set(S[SEQ.a], glide(-1, 0, 'flapSide0', 'flapSide1', true), { key: KEY.a, sound: SND.toy, ...move });
  set(S[SEQ.d], glide(1, 0, 'flapSide0', 'flapSide1'), { key: KEY.d, sound: SND.toy, ...move });

  // Space: SQUAWK, the way he last went
  set(S[SEQ.squawk], [f('squawk', 2), birth(MON.squawk), f('squawk', 4), f('down0', 2)], { key: KEY.space, sound: SND.squawk, ground: 1, norepeat: 1, jstkBut: 1 });
  // B: boing
  set(S[SEQ.bounce], [f('squash', 2), f('stretch', 3), f('squash', 2), f('stretch', 2), f('down0', 2)], { key: KEY.b, sound: SND.boing, ground: 1, norepeat: 1, jstkBut: 2 });

  ch.meter[0] = HIT_POINTS;
  ch.meter[1] = 5;
  ch.meter[3] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.inv[0] = FIXED_BLOCK.chicken;
  return ch;
}
