// POWER UP's hero: the Starter hero (kit/starter/heroChar.ts) with three of his keys given a power.
// A power here is a sequence that sits in front of the ordinary one on the same key, with its
// counter at 0 so it cannot start. Touching a power-up block adds to that counter (a block's
// "effect" and "amount"); each time the sequence runs it uses one up, and at 0 the ordinary
// sequence takes over. Game-Maker looks for the first sequence on the pressed key, lowest number
// first, so the powers take numbers 5, 6 and 9 and the ordinary walks and jump move up to 17-19.
// Nothing counts time: a power lasts for jumps or strides, not seconds.
import { INF_REPEAT, type Character, type Sequence } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { buildHero } from '../../kit/starter/heroChar';
import type { Book } from '../../kit/starter/book';
import { SEQ } from '../../kit/starter/ids';

export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;

/** The sequences that carry the powers (their counters are what the blocks add to). */
export const POWER = { fastRight: SEQ.right, fastLeft: SEQ.left, highJump: SEQ.jump } as const;
/** Where the ordinary jump and walks went. */
export const PLAIN = { jump: 17, right: 18, left: 19 } as const;

/** The upward push of the high jump (the ordinary one is 12). */
export const HIGH_PUSH = 17;
/** Pixels a frame while the sneakers are on (the ordinary walk is 4). */
export const FAST_STEP = 8;
/** What one star adds: high jumps. */
export const STAR_JUMPS = 4;
/** What one sneaker adds: strides (a stride is four frames). */
export const SNEAKER_STRIDES = 50;

const copy = (s: Sequence): Sequence => structuredClone(s);

/** The hero with the high jump on Space and the sneakers on Left and Right. */
export function buildPowerHero(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  // the ordinary ones move up
  S[PLAIN.jump] = copy(S[POWER.highJump]);
  S[PLAIN.right] = copy(S[POWER.fastRight]);
  S[PLAIN.left] = copy(S[POWER.fastLeft]);
  // the powers are the same sequences with bigger numbers, and the arms-up pose in the air
  S[POWER.highJump].frames.forEach((f, i) => {
    if (f.y < 0) f.y = -HIGH_PUSH;
    if (i < 2) f.pic1 = cb.n('cheer2.top');
  });
  for (const [n, sign] of [
    [POWER.fastRight, 1],
    [POWER.fastLeft, -1],
  ] as const) {
    for (const f of S[n].frames) if (f.x !== 0) f.x = sign * FAST_STEP;
  }
  for (const n of Object.values(PLAIN)) ch.meter[n] = INF_REPEAT;
  for (const n of Object.values(POWER)) ch.meter[n] = 0;
  return ch;
}
