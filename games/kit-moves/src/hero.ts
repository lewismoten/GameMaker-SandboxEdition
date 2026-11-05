// KIT'S MOVES' hero: the Starter hero (kit/starter/heroChar.ts) with two keys changed, to show the sequence settings.
//   Space   one hop per press: "one sequence per key stroke" is on (norepeat), so holding the key does not hop again
//   Up/W    LIFT: the same kind of push, but with norepeat off, so the sequence runs again for as long as the key is down
//   Enter   DASH: six quick steps to the right that cannot be cut short (ground) and happen once per press (norepeat)
import { emptyFrame, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { KEY, SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';

/** Hit points and lives at the start (nothing here takes any). */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
/** The Enter key: scan code 28, ASCII 13. */
export const KEY_ENTER = 0x1c0d;
/** The dash is sequence 17 (0 to 4 are Game-Maker's own, 5 to 16 are the Starter hero's). */
export const SEQ_DASH = 17;
/** The lift pushes up this much a frame (momentum, so gravity can take it back), one frame a tick. */
export const LIFT_PUSH = 2;
/** The dash: pixels a frame and frames. */
export const DASH_STEP = 11;
export const DASH_FRAMES = 6;

/** Kit's character file, using the pictures in `cb`. */
export function buildKit(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  const f = (top: string, bottom: string, o: Partial<Frame> = {}): Frame => ({
    ...emptyFrame(),
    pic1: cb.n(top),
    pic2: cb.n(bottom),
    pause: 1,
    ...o,
  });
  const lift = [f('up.top', 'jumpup', { y: -LIFT_PUSH }), f('cheer.top', 'jump', { y: -LIFT_PUSH })];
  // key held: the sequence starts over (norepeat 0) and each run adds another push
  set(S[SEQ.up], lift, { key: KEY.up, momentum: 1, norepeat: 0 });
  set(S[SEQ.upW], lift, { key: KEY.w, momentum: 1, norepeat: 0 });
  const dash = Array.from({ length: DASH_FRAMES }, (_, i) => f('cheer.top', `walk${i % 4}`, { x: DASH_STEP }));
  set(S[SEQ_DASH], dash, { key: KEY_ENTER, norepeat: 1, ground: 1 });
  return ch;
}
