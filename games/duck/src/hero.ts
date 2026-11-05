// KIT DUCKS' hero: the Starter hero (kit/starter/heroChar.ts) with one key changed. Down, which has no ladder to climb here,
// DUCKS. The duck is a sequence whose frames have NO TOP PICTURE: the top block is empty (the frame's first picture is
// left at "none"), and Kit crouches in the bottom block alone. PLAYGAME compares monsters with the pixels of the pictures a
// frame has, so a bird in the row of his head touches nothing. Kit's blocks come from the Starter hero (kit/starter/hero.ts);
// the crouch pictures are drawn here (duckPose.ts) and added to his block set, so they follow whatever his standing frames look like.
//   Down / S   duck: while the key is held the two crouch frames repeat (norepeat off), and Kit stands up when it is let go
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Book } from '../../kit/starter/book';
import { KEY, SEQ } from '../../kit/starter/ids';
import { buildHero } from '../../kit/starter/heroChar';
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Pal } from '../../kit/starter/palette';
import { crouch } from './duckPose';

/** Hit points and lives at the start. Each tick a bird or ball overlaps Kit takes one point (monsters.ts BITE). */
export const HERO_HIT_POINTS = 60;
export const HERO_LIVES = 3;
/** The duck is the sequence on Down (the Starter's ladder-climbing slot). */
export const SEQ_DUCK = SEQ.down;

/** Kit's pictures (.CBL): the Starter hero's, then the crouch's two frames. */
export function buildHeroBlocks2(pal: Pal): Book {
  const book = buildHeroBlocks(pal);
  book.add('duck0', crouch(pal, 0));
  book.add('duck1', crouch(pal, 1));
  return book;
}

/** Kit's character file, using the pictures in `cb`. */
export function buildKit(cb: Book): Character {
  const ch = buildHero(cb);
  const S = ch.sequences;
  const f = (bottom: string): Frame => ({ ...emptyFrame(), pic1: CHARBL, pic2: cb.n(bottom), pause: 1 });
  // the same two frames on Down and on S; the key held repeats them
  const frames = [f('duck0'), f('duck1')];
  set(S[SEQ.down], frames, { key: KEY.down, jstkMov: 5, norepeat: 0 });
  set(S[SEQ.downS], frames, { key: KEY.s, norepeat: 0 });
  ch.meter[0] = HERO_HIT_POINTS;
  ch.meter[1] = HERO_LIVES;
  return ch;
}
