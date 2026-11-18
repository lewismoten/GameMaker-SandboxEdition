// sm.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from '../../kit/starter/sceneSequence';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'SMASH IT';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'sm.cmf',
    'menu.gif',
    'sm.cmf',
    'story.lst',
    'sm.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'sm.cmf', 'lost.lst', 'sm.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    // The whole route fits in the opening view, including its short ledges.
    scene.scroll.up = scene.scroll.down = 0;
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'sm.pal',
      `${l.file}.map`,
      `${l.file}.bbl`,
      'sm.mon',
      'sm.mbl',
      'hero.chr',
      'hero.cbl',
      'sm.snd',
      'sm.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
