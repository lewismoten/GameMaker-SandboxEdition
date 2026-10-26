// leo.chr: Doc Leo walks exactly one block per step (five frames of four pixels that can't be
// cut short), so he always stands squarely on Ebenezer's grid and every timed panel, swing
// door and latch lines up with him. Hold an arrow to keep walking; arrows, W A S D and the
// number pad all steer. He starts with the rubber chicken in his pocket (inventory slot 1),
// and the squawk is tied to it: Game-Maker turns a sequence on only while its block is
// carried. The kazoo and Ebenezer's tricorn work the same way once picked up (Enter).
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { FIXED_BLOCK, KEY, MON, SEQ, SND } from '../ids';
import type { BlockSet } from '../blocks/sets';

const MIRROR = 0x40;
export const STEP = 4;
/** Hit points a life starts with. */
export const HIT_POINTS = 30;

export function buildLeo(cb: BlockSet): Character {
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

  // idle: blinks, and now and then checks the chicken is still breathing (it is rubber)
  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 70), f('blink', 3), f('down0', 40), f('squawkDown', 8), f('down0', 30), f('blink', 3)]);
  set(S[SEQ.die], [f('hurt', 3), f('down0', 3), f('hurt', 3), f('dead', 12), f('dead2', 14), f('dead', 14)], { sound: SND.die, jstkBut: 0 });
  // The flinch is "ground" (can't be cut short), so a key let go while he flinches waits until
  // the step he was taking is done: he never ends up between two blocks.
  set(S[SEQ.hurt], [f('hurt', 1)], { sound: SND.hurt, jstkBut: 0, ground: 1 });
  set(S[SEQ.pickup], [f('down0', 2), f('blink', 2)], { key: KEY.enter, sound: SND.pickup, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });

  const walk = (dx: number, dy: number, a: string, b: string, mirror = false) => [a, b, a, b, a].map((p) => f(p, 1, { x: dx * STEP, y: dy * STEP, mirror }));
  const move = { ground: 1 };
  set(S[SEQ.up], walk(0, -1, 'up0', 'up1'), { key: KEY.up, jstkMov: 1, ...move });
  set(S[SEQ.down], walk(0, 1, 'down0', 'down1'), { key: KEY.down, jstkMov: 5, ...move });
  set(S[SEQ.left], walk(-1, 0, 'side0', 'side1', true), { key: KEY.left, jstkMov: 7, ...move });
  set(S[SEQ.right], walk(1, 0, 'side0', 'side1'), { key: KEY.right, jstkMov: 3, ...move });
  set(S[SEQ.w], walk(0, -1, 'up0', 'up1'), { key: KEY.w, ...move });
  set(S[SEQ.s], walk(0, 1, 'down0', 'down1'), { key: KEY.s, ...move });
  set(S[SEQ.a], walk(-1, 0, 'side0', 'side1', true), { key: KEY.a, ...move });
  set(S[SEQ.d], walk(1, 0, 'side0', 'side1'), { key: KEY.d, ...move });

  // Space: SQUAWK. The wave flies the way he last walked.
  set(S[SEQ.squawk], [f('squawkDown', 2), birth(MON.squawk), f('squawkDown', 4), f('down0', 2)], {
    key: KEY.space,
    sound: SND.squawk,
    bloc: FIXED_BLOCK.chicken,
    ground: 1,
    norepeat: 1,
    jstkBut: 1,
  });
  // Z: the kazoo, all four ways at once
  set(S[SEQ.kazoo], [f('kazoo', 2), birth(MON.kazooN), birth(MON.kazooE), birth(MON.kazooS), birth(MON.kazooW), f('kazoo', 6), f('down0', 2)], {
    key: KEY.z,
    sound: SND.kazoo,
    bloc: FIXED_BLOCK.kazoo,
    ground: 1,
    norepeat: 1,
    jstkBut: 2,
  });
  // T: tip Ebenezer's tricorn. A fife plays. That is all. It is enough.
  set(S[SEQ.salute], [f('salute', 24), f('down0', 2)], { key: KEY.t, sound: SND.fife, bloc: FIXED_BLOCK.tricorn, ground: 1, norepeat: 1 });

  ch.meter[0] = HIT_POINTS;
  ch.meter[1] = 5;
  // Counters read one more than they hold: no ingredients, no spoons.
  ch.meter[3] = 1;
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  // the rubber chicken rides in the first pocket
  ch.inv[0] = FIXED_BLOCK.chicken;
  return ch;
}
