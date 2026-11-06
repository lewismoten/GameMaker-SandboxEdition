// HOME KEYS' hero: the Starter hero (kit/starter/heroChar.ts) with three sets of keys added, each its own sequence:
//   Enter    THROW: tosses a star (one a press), as in the Boss Hits starter
//   Q        LEAP up and to the left, E LEAP up and to the right: one key press is a higher jump that
//            also moves sideways, so the two moves of "Space, then Left or Right" happen in one press
// Space, the arrows and W A S D come from the kit. The old number pad's 7 and 9 would be two more sequences
// (keys 71 and 73); they are left out on purpose, because most keyboards have no number pad.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { STAR } from './monsters';
import { SND_THROW } from './sounds';

export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
/** Keys as Game-Maker names them (scan code << 8 | ASCII). */
export const KEY_ENTER = 0x1c0d;
export const KEY_Q = 0x1071;
export const KEY_E = 0x1265;
/** PC scan codes the bot presses. */
export const SCAN_ENTER = 28;
export const SCAN_Q = 16;
export const SCAN_E = 18;
/** The leaps are sequences 17 and 18 (0 to 4 are Game-Maker's own, 5 to 16 the Starter hero's). */
export const SEQ_LEAP_LEFT = 17;
export const SEQ_LEAP_RIGHT = 18;
/** The leap's upward push and its push to the side, per frame. */
export const LEAP_PUSH = 16;
export const LEAP_SIDE = 11;

export function buildKeyHero(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  // Enter: wind up, release, a frame that gives birth to the star, follow through
  const s = S[SEQ.throw];
  const [windUp, release, follow] = s.frames;
  const birth = { ...emptyFrame(), x: 0, y: 20, pic1: STAR, pic2: MONBL, pause: 0 };
  [windUp, release, birth, follow].forEach((fr, i) => (s.frames[i] = fr));
  for (let i = 4; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { key: KEY_ENTER, sound: SND_THROW, norepeat: 1, ground: 1, jstkMov: 9, jstkBut: 2 });
  // Q and E: a push up and a push to the side, then the poses of a jump
  const f = (top: string, bottom: string, o: Partial<Frame> = {}): Frame => ({ ...emptyFrame(), pic1: cb.n(top), pic2: cb.n(bottom), pause: 2, ...o });
  const leap = (side: number, mirror: boolean): Frame[] => {
    const orient = mirror ? 0x44 : 0;
    return [f('up.top', 'jumpup', { x: side, y: -LEAP_PUSH, orient }), f('cheer.top', 'jump', { x: side, orient }), f('oh.top', 'fall', { orient })];
  };
  set(S[SEQ_LEAP_LEFT], leap(-LEAP_SIDE, true), { key: KEY_Q, norepeat: 1, momentum: 1 });
  set(S[SEQ_LEAP_RIGHT], leap(LEAP_SIDE, false), { key: KEY_E, norepeat: 1, momentum: 1 });
  return ch;
}
