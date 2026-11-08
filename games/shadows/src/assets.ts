// The pictures that differ between the yard's two scenes, built once: the critters with a solid shadow or a dithered one.
// Mara has no shadow of her own: it would be painted into her standing and walking pictures, and the engine gives those back
// while she is in the air (see the manual's "What it cannot do"), so it would go up with her.
import { buildHeroBlocks } from '../../kit/starter/hero';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { buildCritterBlocks } from './critters';

export interface Assets {
  /** Mara as the Starters draw her (hero.cbl, the same in every scene). */
  plain: Book;
  /** The monster blocks for a scene whose shadows are solid, or dithered. */
  solid: { critters: Book };
  dither: { critters: Book };
}

export function buildAssets(pal: Pal): Assets {
  return {
    plain: buildHeroBlocks(pal),
    solid: { critters: buildCritterBlocks(pal, 'solid') },
    dither: { critters: buildCritterBlocks(pal, 'dither') },
  };
}
