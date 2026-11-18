// grav.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { addSceneSequence } from '../../kit/starter/sceneSequence';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'GRAVITY ON AND OFF';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'grav.cmf',
    'menu.gif',
    'grav.cmf',
    'story.lst',
    'grav.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'grav.cmf', 'lost.lst', 'grav.cmf', ...new Array(16).fill('')];

  addSceneSequence(game, levels, (l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    // level 1 is the side view (side.bbl, hero.chr); level 2 is the same scene from above (top.bbl, top.chr)
    const top = i === 1;
    // The side-view route stays within one band; the top-down room keeps four-way scrolling.
    if (!top) scene.scroll = { ...scene.scroll, up: 0, down: 0 };
    scene.files = [
      'grav.pal',
      `${l.file}.map`,
      top ? 'top.bbl' : 'side.bbl',
      'grav.mon',
      'grav.mbl',
      top ? 'top.chr' : 'hero.chr',
      top ? 'top.cbl' : 'hero.cbl',
      'grav.snd',
      'grav.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    return scene;
  });

  return game;
}
