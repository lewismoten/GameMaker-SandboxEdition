// The 320x200 pictures (placeholder): the menu, the paper behind text pages, the high scores,
// load and save, the credits.
import { Pixels } from '../../../kit/pixels';
import { centered } from '../../../snowbound/src/art/font';
import { gif, H, W } from '../../../snowbound/src/screens/scenery';
import { buildScreenPalette } from './palette';
import type { Cast } from './cartoons';

export function buildPictures(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const paper = (heading: string) => {
    const p = new Pixels(W, H, c('dark', 1));
    p.rect(24, 6, 272, 190, c('parch', 4)).frame(24, 6, 272, 190, c('parch', 1));
    centered(p, 14, heading, c('brown', 1), 2);
    return p;
  };
  for (const [name, heading] of [['menu', 'SWEATPANTS'], ['howto', 'HOW TO PLAY'], ['credits', 'CREDITS'], ['storybg', 'OPEN MIC'], ['loadgame', 'LOAD GAME'], ['savegame', 'SAVE GAME'], ['hiscore', 'THE SIGN-UP SHEET'], ['bardpic', 'THE BARD']])
    files[`${name}.gif`] = gif(paper(heading), pal.pal);
  void cast;
  return files;
}
