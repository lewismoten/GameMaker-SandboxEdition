// A graduation's .GAM: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from './sceneSequence';
import type { Level } from './graduationLevel';

/** The title of the game, as the .GAM names it (19 characters at most; the screens add FIRST STEPS under it). */
export const TITLE = 'GRADUATION';

export function buildGame(levels: Level[], name = TITLE): Game {
  const game = newGame(name);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'grad.cmf',
    'menu.gif',
    'grad.cmf',
    'story.lst',
    'grad.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'grad.cmf', 'lost.lst', 'grad.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    if (l.lockVertical) scene.scroll.up = scene.scroll.down = 0;
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'grad.pal',
      `${l.file}.map`,
      `${l.bbl}.bbl`,
      'grad.mon',
      'grad.mbl',
      'hero.chr',
      'hero.cbl',
      'grad.snd',
      'grad.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
