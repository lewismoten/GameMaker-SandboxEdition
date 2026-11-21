// pictures.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level. A level's
// scene lists the files it loads in slots (palette, map, blocks, monsters, monster blocks, character,
// character blocks, sounds, song) and then the two graphic slots this game is about: slot 9, the
// picture shown BEFORE the level (PLAYGAME's PREGRAPHICFILEIDX), and slot 10, the one shown AFTER it,
// when the hero leaves through a link (POSTGRAPHICFILEIDX). Each is a GIF, an FLI or a .LST of both.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from '../../kit/starter/sceneSequence';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'PICTURES & CARTOONS';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'pics.cmf',
    'menu.gif',
    'pics.cmf',
    'story.lst',
    'pics.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'pics.cmf', 'lost.lst', 'pics.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    // These short routes fit in the raised entrance's view; hops keep the same sky.
    scene.scroll = { ...scene.scroll, up: 0, down: 0 };
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'pics.pal',
      `${l.file}.map`,
      `${l.file}.bbl`,
      'pics.mon',
      'pics.mbl',
      'hero.chr',
      'hero.cbl',
      'pics.snd',
      'pics.cmf',
      l.before,
      l.after,
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
