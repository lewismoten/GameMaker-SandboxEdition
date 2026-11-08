// beams.gam: scene 0 the title and menu, scene 1 the ending, scene 2 the beams, scene 3 the fog, scene 4 the glow. A scene lists the files
// it loads in slots (palette, map, blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before it) and carries
// its links: touch the From block and you are in the To scene, standing on the To cell.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import { BOTTOM, type Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'BEAMS AND FOG';

/** The scenes by number. */
export const SCENE = { end: 1, beams: 2, fog: 3, glow: 4 } as const;

export function buildGame(levels: { beams: Level; fog: Level; glow: Level }): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'beams.cmf',
    'menu.gif',
    'beams.cmf',
    'story.lst',
    'beams.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'beams.cmf', 'lost.lst', 'beams.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const scene = (desc: string, level: Level, x: number, y: number, to: number, toCell: [number, number]) => {
    const s = emptyScene(ADVTYPE);
    s.desc = desc.slice(0, 19);
    s.pos = { x, y };
    s.files = [
      'beams.pal',
      `${level.file}.map`,
      `${level.file}.bbl`,
      'beams.mon',
      'beams.mbl',
      'hero.chr',
      'hero.cbl',
      'beams.snd',
      'beams.cmf',
      `${level.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    s.links = blank();
    s.links[0] = { toScene: to, from: { x: level.exit + ORIGIN, y: BOTTOM + ORIGIN }, to: { x: toCell[0], y: toCell[1] } };
    return s;
  };
  game.scenes.push(scene('The Beams', levels.beams, 60, 80, SCENE.fog, levels.fog.map.start));
  game.scenes.push(scene('The Fog', levels.fog, 100, 80, SCENE.glow, levels.glow.map.start));
  game.scenes.push(scene('The Glow', levels.glow, 140, 80, SCENE.end, [0, 0]));
  title.links[0] = { toScene: SCENE.beams, from: { x: 0, y: 0 }, to: { x: levels.beams.map.start[0], y: levels.beams.map.start[1] } };
  return game;
}
