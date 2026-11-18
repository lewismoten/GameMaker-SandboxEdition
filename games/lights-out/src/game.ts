// lo.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from '../../kit/starter/sceneSequence';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'LIGHTS OUT';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'lo.cmf',
    'menu.gif',
    'lo.cmf',
    'story.lst',
    'lo.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'lo.cmf', 'lost.lst', 'lo.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    // These short routes fit in the raised entrance's view; hops keep the same sky.
    scene.scroll = { ...scene.scroll, up: 0, down: 0 };
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      l.palFile,
      `${l.file}.map`,
      `${l.file}.bbl`,
      'lo.mon',
      'lo.mbl',
      'hero.chr',
      'hero.cbl',
      'lo.snd',
      'lo.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
