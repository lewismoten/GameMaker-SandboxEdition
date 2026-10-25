// PASS.MAP: the map every one-tick scene loads (a talk, a chapter card, the bell), under an
// all-black palette so PLAYGAME's fade in and out of it shows nothing. Each such scene starts Joe
// on one of its cells, and that cell is also the scene's link straight on, so the scene ends on
// the tick it starts. The cell he stands on is touched on that tick, so a pass can give
// something: 'a' gives nothing, 'b' says Joe has been to his workbench, 'c' is a thank-you heart.
import type { BlockSet } from '../blocks/sets';
import { mark, stamp, type Stamped } from './stamp';

export const PASS_ROWS = ['vvvvv', 'vabcv', 'vvvvv'];

export type Gift = 'none' | 'ready' | 'thanks';

const GIFT_MARK: Record<Gift, string> = { none: 'a', ready: 'b', thanks: 'c' };

export function passMap(set: BlockSet): Stamped {
  return stamp(PASS_ROWS, { v: 'void', a: 'pass', b: 'giftReady', c: 'giftThanks' }, set, 'void', undefined, 'abc');
}

/** The pass map's cell that gives `gift`. */
export const giftCell = (pass: Stamped, gift: Gift) => mark(pass, GIFT_MARK[gift]);
