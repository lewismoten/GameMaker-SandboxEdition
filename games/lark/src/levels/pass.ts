// PASS.MAP: the map every one-tick scene loads (a talk, a chapter card, the bell), under an
// all-black palette so PLAYGAME's fade in and out of it shows nothing. Each such scene starts Joe
// on one of its cells, and that cell is also the scene's link straight on, so the scene ends on
// the tick it starts. The cell he stands on is touched on that tick, so a pass can give
// something: 'a' gives nothing, 'c' is a thank-you heart.
import type { BlockSet } from '../blocks/sets';
import { mark, stamp, type Stamped } from './stamp';

const PASS_ROWS = ['vvvv', 'vacv', 'vvvv'];

export type Gift = 'none' | 'thanks';

const GIFT_MARK: Record<Gift, string> = { none: 'a', thanks: 'c' };

export function passMap(set: BlockSet): Stamped {
  return stamp(PASS_ROWS, { v: 'void', a: 'pass', c: 'giftThanks' }, set, 'void', undefined, 'ac');
}

/** The pass map's cell that gives `gift`. */
export const giftCell = (pass: Stamped, gift: Gift) => mark(pass, GIFT_MARK[gift]);
