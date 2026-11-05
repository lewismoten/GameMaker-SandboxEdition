// The pictures that differ between the yard's two scenes, built once: Kit with a solid shadow or a dithered one, and the critters the same.
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { buildCritterBlocks } from './critters';
import { shadowedHero } from './shadow';

export interface Assets {
  /** Kit as the Starters draw him: no shadow (the screens use him). */
  plain: Book;
  /** Kit's character blocks and the monster blocks for a scene whose shadows are solid, or dithered. */
  solid: { hero: Book; critters: Book };
  dither: { hero: Book; critters: Book };
}

export function buildAssets(pal: Pal): Assets {
  const plain = buildHeroBlocks(pal);
  return {
    plain,
    solid: { hero: shadowedHero(plain, 'solid', pal), critters: buildCritterBlocks(pal, 'solid') },
    dither: { hero: shadowedHero(plain, 'dither', pal), critters: buildCritterBlocks(pal, 'dither') },
  };
}
