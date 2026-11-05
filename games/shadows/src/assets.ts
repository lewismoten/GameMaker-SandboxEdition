// The pictures that differ between the yard's two scenes, built once: Mara with a solid shadow or a dithered one, and the critters the same.
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { buildCritterBlocks } from './critters';
import { shadowedHero } from './shadow';

export interface Assets {
  /** Mara as the Starters draw her: no shadow (the screens use her). */
  plain: Book;
  /** Mara's character blocks and the monster blocks for a scene whose shadows are solid, or dithered. */
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
