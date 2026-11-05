// SLIDE AND DRIFT's hero: the Starter hero (kit/starter/heroChar.ts) with the four walking sequences changed
// to momentum. A momentum frame does not move Yana; its x is added to his speed, and the speed carries him on.
//   Left / Right (and A / D)   each step adds a push to his speed. He gets faster the longer the key is held,
//                              and when it is let go he glides on and slows (the engine takes a sixth off his
//                              speed every tick once no momentum sequence is running).
//   Space                      the same hop as the other Starters (it already uses momentum, for its push up)
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { emptyFrame, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Book } from '../../kit/starter/book';
import { KEY, SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';

/** Hit points and lives at the start (nothing here takes any). */
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;
/** The push a step adds to his speed (pixels a tick), on the first of each four frames; the other three add nothing. */
export const PUSH = 4;

/** Yana's character file, using the pictures in `cb`. */
export function buildKit(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  const frames = (dir: 1 | -1): Frame[] =>
    [0, 1, 2, 3].map((i) => ({
      ...emptyFrame(),
      pic1: cb.n('stand.top'),
      pic2: cb.n(`walk${i}`),
      x: i === 0 ? dir * PUSH : 0,
      pause: 1,
      orient: dir < 0 ? 0x44 : 0,
    }));
  set(S[SEQ.right], frames(1), { key: KEY.right, jstkMov: 3, momentum: 1 });
  set(S[SEQ.left], frames(-1), { key: KEY.left, jstkMov: 7, momentum: 1 });
  set(S[SEQ.rightD], frames(1), { key: KEY.d, momentum: 1 });
  set(S[SEQ.leftA], frames(-1), { key: KEY.a, momentum: 1 });
  return ch;
}
