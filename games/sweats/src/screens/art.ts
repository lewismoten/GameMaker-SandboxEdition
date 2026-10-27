// Every picture, cartoon, text page and slide list on the disk, by file name (build.ts writes
// them): the title, the menu, the story, how to play, the credits, the intermission cards, each
// monologue's title card and the applause after it, and the endings.
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels } from '../../../kit/pixels';
import { BARDLOGO, bardIntroFli } from '../../../kit/bard';
import { clipEntries, fliClips } from '../../../kit/fliClips';
import { centered } from '../../../snowbound/src/art/font';
import { gif, H, W } from '../../../snowbound/src/screens/scenery';
import type { Pal } from '../art/pal';
import type { SceneDef } from '../scenes';
import { CREDITS, INSTRUCTIONS, STORY, readme } from './text';
import { buildScreenPalette } from './palette';
import { cardFli, interFli, bravoFli, coverFli, storyFli, howtoFli, wonFlis, lostFli, type Cast } from './cartoons';
import { buildPictures } from './pictures';

export interface CardView {
  /** The monologue's number (1..17). */
  index: number;
  def: SceneDef;
  /** Its strip of the map (16 x 6 blocks), in its palette. */
  map: Pixels;
  pal: Pal;
}

interface ArtExtras {
  cards: CardView[];
  /** The poet's sprites, and the Hive's monster sprites (the common cast among them). */
  poet: Map<string, Pixels>;
  mons: Map<string, Pixels>;
}

const lst = (entries: { name: string; pause?: number }[]) => serializeSlideList(entries);

export function buildArt(x: ArtExtras): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const cast: Cast = { poet: x.poet, mons: x.mons };
  Object.assign(files, buildPictures(cast));
  // the title: the Bard's logo, then the cover cartoon, then the cover with the name held
  const cover = coverFli(cast);
  // the long cartoons in clips of about 4 seconds, so Esc can skip them between clips
  const clips = (name: string, fli: Uint8Array) => {
    const c = fliClips(name, fli);
    Object.assign(files, c);
    return c;
  };
  const bardLogo = clips(BARDLOGO, bardIntroFli());
  const coverClips = clips('cover.fli', cover.fli);
  files['title.gif'] = gif(cover.title, cover.pal);
  files['title.lst'] = lst([...clipEntries(bardLogo, 0), ...clipEntries(coverClips, 0), { name: 'title.gif', pause: 12 }]);
  const story = clips('story.fli', storyFli(cast));
  files['story.lst'] = lst([...clipEntries(story, 1), { name: 'storybg.gif', pause: 0 }, { name: 'story.txt' }]);
  const howto = clips('howto.fli', howtoFli(cast));
  files['howto.lst'] = lst([...clipEntries(howto, 2), { name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]);
  files['credits.lst'] = lst([{ name: 'bardpic.gif', pause: 8 }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  files['story.txt'] = new TextEncoder().encode(STORY);
  files['howto.txt'] = new TextEncoder().encode(INSTRUCTIONS);
  files['credits.txt'] = new TextEncoder().encode(CREDITS);
  files['readme.txt'] = new TextEncoder().encode(readme('$5'));
  // the intermissions: Doc Leo at the microphone
  for (let k = 1; k <= 5; k++) {
    files[`inter${k}.fli`] = interFli(k, cast);
    files[`inter${k}.lst`] = lst([{ name: `inter${k}.fli`, pause: 3 }]);
  }
  // each monologue's title card, and the applause after it
  for (const card of x.cards) {
    files[`card${card.index}.fli`] = cardFli(card, cast);
    files[`card${card.index}.lst`] = lst([{ name: `card${card.index}.fli`, pause: 3 }]);
  }
  files['bravo.fli'] = bravoFli(cast);
  files['bravo.lst'] = lst([{ name: 'bravo.fli', pause: 1 }]);
  const won = wonFlis(cast);
  Object.assign(files, won);
  files['won.lst'] = lst(Object.keys(won).map((name, i, all) => ({ name, pause: i === all.length - 1 ? 10 : 5 })));
  files['lost.fli'] = lostFli(cast);
  files['lost.lst'] = lst([{ name: 'lost.fli', pause: 6 }]);
  void centered;
  void buildScreenPalette;
  void W;
  void H;
  return files;
}
