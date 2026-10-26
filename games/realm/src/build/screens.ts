// The pictures, slide shows and text pages between scenes, by file name.
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { clipEntries, fliClips } from '../../../kit/fliClips';
import { licenseText } from '../../../kit/license';
import { dosText } from '../../../kit/disk';
import * as S from '../screens/screens';
import { introFli } from '../screens/intro';
import { INSTRUCTIONS, CREDITS, readme } from '../screens/text';
import { INK } from '../screens/talk';
import type { AreaFile } from './world';

export function screenFiles(price: string): AreaFile[] {
  const out: AreaFile[] = [];
  const put = (name: string, bytes: Uint8Array | string) => out.push({ name, bytes: typeof bytes === 'string' ? dosText(bytes) : bytes });
  const lst = (name: string, entries: { name: string; pause?: number }[]) => put(name, serializeSlideList(entries));
  put(SANDLOGO, sandLogoFli());
  // the intro in clips of about 4 seconds, so Esc can skip it between them
  const intro = fliClips('intro.fli', introFli());
  for (const [name, bytes] of Object.entries(intro)) put(name, bytes);
  put('title.gif', S.titleScreen().gif());
  lst('title.lst', [{ name: SANDLOGO, pause: 0 }, ...clipEntries(intro, 0), { name: 'title.gif', pause: 12 }]);
  // the pages shown from the menu (and the ending) write MORE... in the menu palette's nearest
  // red: reserve it in the menu at the same index (2) as in the pages' backdrops
  put('menu.gif', S.menuScreen().gif({ menu: S.MENU_INK, more: S.RED_INK }));
  S.storyScreens().forEach((sc, i) => put(`story${i + 1}.gif`, sc.gif()));
  lst(
    'story.lst',
    [1, 2, 3, 4].map((i) => ({ name: `story${i}.gif` })),
  );
  put('howto.gif', S.textBackdrop('help').gif({ text: INK, more: S.RED_INK }));
  put('howto.txt', INSTRUCTIONS);
  lst('howto.lst', [{ name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]);
  put('credits.gif', S.textBackdrop('credits').gif({ text: INK, more: S.RED_INK }));
  put('credits.txt', CREDITS);
  lst('credits.lst', [{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  put('scores.gif', S.scoresScreen().gif({ menu: S.MENU_INK, more: S.RED_INK }));
  put('loadgame.gif', S.slotsScreen(false).gif({ names: S.SLOT_INK, more: S.RED_INK, menu: S.MENU_INK }));
  put('savegame.gif', S.slotsScreen(true).gif({ names: S.SLOT_INK, more: S.RED_INK, menu: S.MENU_INK }));
  const won = S.wonScreens();
  won.forEach((sc, i) => put(`won${i + 1}.gif`, sc.gif()));
  lst('won.lst', [{ name: 'won1.gif' }, { name: 'won2.gif' }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  put('lost.gif', S.lostScreen().gif());
  lst('lost.lst', [{ name: 'lost.gif' }]);
  put('eggshow.gif', S.eggScreen().gif());
  put('readme.txt', readme(price));
  put('license.txt', licenseText('Quest for the Round Tuit'));
  return out;
}
