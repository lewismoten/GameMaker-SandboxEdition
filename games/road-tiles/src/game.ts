// roadtile.gam: scene 0 is the title and menu, scene 1 the endings, scenes 2 to 4 the three levels, in order. A level's
// scene lists the files it loads in slots (palette, map, blocks, monsters, monster blocks, character, character blocks,
// sounds, song, a card before it, a card after it) and carries one link: touch the finish line and you are in the next
// level, standing on its first block (the last level's link goes to the ending).
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'ROAD TILES';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'roads.cmf',
    'menu.gif',
    'roads.cmf',
    'story.lst',
    'roads.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'roads.cmf', 'lost.lst', 'roads.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const cell = ([x, y]: [number, number]) => ({ x: x + ORIGIN, y: y + ORIGIN });
  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 40 + i * 80, y: 80 };
    scene.files = ['roads.pal', `${l.file}.map`, 'roads.bbl', 'roads.mon', 'roads.mbl', 'hero.chr', 'hero.cbl', 'roads.snd', 'roads.cmf', `${l.file}.lst`, '', ...new Array(9).fill('')];
    scene.links = blank();
    const next = levels[i + 1];
    scene.links[0] = next ? { toScene: i + 3, from: cell(l.finish), to: cell(next.start) } : { toScene: 1, from: cell(l.finish), to: { x: 0, y: 0 } };
    game.scenes.push(scene);
  });
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: cell(levels[0].start) };
  return game;
}
