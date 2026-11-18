// gust.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its exit door to the next scene.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from '../../kit/starter/sceneSequence';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'GUSTS';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'gust.cmf',
    'menu.gif',
    'gust.cmf',
    'story.lst',
    'gust.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'gust.cmf', 'lost.lst', 'gust.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    // The tunnel is flat; the seven-row gust shaft still follows the hero upward.
    if (l.file === 'two') scene.scroll = { ...scene.scroll, up: 0, down: 0 };
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'gust.pal',
      `${l.file}.map`,
      `${l.file}.bbl`,
      'gust.mon',
      'gust.mbl',
      'hero.chr',
      'hero.cbl',
      'gust.snd',
      'gust.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
