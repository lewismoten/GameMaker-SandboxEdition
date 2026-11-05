// leaves.gam: scene 0 the title and menu, scene 1 the ending, scene 2 the tumble, scene 3 the gust. A scene lists the files
// it loads in slots (palette, map, blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before
// it) and carries its links: touch the From block and you are in the To scene, standing on the To cell.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import { BOTTOM, type Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'LEAVES IN THE WIND';

/** The scenes by number. */
export const SCENE = { end: 1, tumble: 2, gust: 3 } as const;

export function buildGame(levels: { tumble: Level; gust: Level }): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'leaves.cmf',
    'menu.gif',
    'leaves.cmf',
    'story.lst',
    'leaves.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'leaves.cmf', 'lost.lst', 'leaves.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const scene = (desc: string, level: Level, x: number, y: number, to: number, toCell: [number, number]) => {
    const s = emptyScene(ADVTYPE);
    s.desc = desc.slice(0, 19);
    s.pos = { x, y };
    s.files = [
      'leaves.pal',
      `${level.file}.map`,
      `${level.file}.bbl`,
      'leaves.mon',
      'leaves.mbl',
      'hero.chr',
      'hero.cbl',
      'leaves.snd',
      'leaves.cmf',
      `${level.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    // across only: the screen opens on rows 1 to 10 (the entrance is on a bank) and stays there, so the sky stays in view
    s.scroll = { ...s.scroll, up: 0, down: 0 };
    s.links = blank();
    s.links[0] = { toScene: to, from: { x: level.exit + ORIGIN, y: BOTTOM + ORIGIN }, to: { x: toCell[0], y: toCell[1] } };
    return s;
  };
  game.scenes.push(scene('The Tumble', levels.tumble, 60, 80, SCENE.gust, levels.gust.map.start));
  game.scenes.push(scene('The Gust', levels.gust, 100, 80, SCENE.end, [0, 0]));
  title.links[0] = { toScene: SCENE.tumble, from: { x: 0, y: 0 }, to: { x: levels.tumble.map.start[0], y: levels.tumble.map.start[1] } };
  return game;
}
