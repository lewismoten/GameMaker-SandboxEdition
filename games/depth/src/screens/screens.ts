// Every picture, slide list and page of text on the disk.
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { serializeRecording } from '../../../../web/src/formats/recording';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { licenseText } from '../../../kit/license';
import type { Extra } from '../game';
import type { LevelSet } from '../levels/blocks';
import { blank } from '../render/image';
import { rgb } from '../render/tracer';
import type { SpriteSet } from '../sprites/sprites';
import { GM_BLUE, GM_PURPLE, GM_RED, centered, toGif } from './draw';

export interface ScreenInput {
  sprites: SpriteSet;
  sets: LevelSet[];
}

export function buildScreens(input: ScreenInput): { files: Record<string, Uint8Array | string>; extra: Extra } {
  const files: Record<string, Uint8Array | string> = {};
  const fixed = [GM_PURPLE, GM_RED, GM_BLUE];
  const plain = (title: string) => {
    const p = blank(320, 200, rgb(20, 18, 40));
    centered(p, 12, title, rgb(255, 255, 255), 2);
    return toGif(p, fixed);
  };
  files[SANDLOGO] = sandLogoFli();
  files['title.gif'] = plain('DEPTH PERCEPTION');
  files['title.lst'] = serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]);
  files['menu.gif'] = plain('DEPTH PERCEPTION');
  files['story.gif'] = plain('THE STORY');
  files['story.lst'] = serializeSlideList([{ name: 'story.gif', pause: 0 }, { name: 'story.txt' }]);
  files['story.txt'] = 'Count Polygon stole the\npolygons.';
  files['howto.gif'] = plain('HOW TO PLAY');
  files['howto.lst'] = serializeSlideList([{ name: 'howto.gif', pause: 0 }, { name: 'howto.txt' }]);
  files['howto.txt'] = 'Roll with the arrows.';
  files['credits.gif'] = plain('CREDITS');
  files['credits.lst'] = serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  files['credits.txt'] = 'Sandbox Software, 1996';
  files['hiscore.gif'] = plain('');
  files['loadgame.gif'] = plain('LOAD');
  files['savegame.gif'] = plain('SAVE');
  input.sets.forEach((s, i) => (files[`card${i + 1}.gif`] = plain(s.level.name.toUpperCase())));
  files['won.gif'] = plain('THE END');
  files['won.lst'] = serializeSlideList([{ name: 'won.gif' }]);
  files['lost.gif'] = plain('OUT OF LIGHT');
  files['lost.lst'] = serializeSlideList([{ name: 'lost.gif' }]);
  files['demo.rec'] = serializeRecording([
    { delta: 25, key: 0x01 },
    { delta: 2, key: 0x81 },
  ]);
  files['license.txt'] = licenseText('Depth Perception');
  return { files, extra: {} };
}
