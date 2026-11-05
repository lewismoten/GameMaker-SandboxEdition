// shadows.gam: scene 0 the title and menu, scene 1 the ending, scene 2 the yard with solid shadows, scene 3 the same yard with dithered ones,
// scene 4 the hop and scene 5 the hover. The two yard scenes list the SAME map (yard.map); they differ in the character blocks, monster
// blocks and background blocks they load (the pictures and the signs), which is the whole lesson of level 1. A scene lists the files it loads
// in slots (palette, map, blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before it) and carries its
// links: touch the From block and you are in the To scene, standing on the To cell.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import { LANE, type Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'LITTLE SHADOWS';

/** The scenes by number. */
export const SCENE = { end: 1, solid: 2, dither: 3, hop: 4, hover: 5 } as const;

export function buildGame(levels: { solid: Level; dither: Level; hop: Level; hover: Level }): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = ['title.lst', 'shadows.cmf', 'menu.gif', 'shadows.cmf', 'story.lst', 'shadows.cmf', 'howto.lst', 'credits.lst', 'scores.gif', 'loadgame.gif', 'savegame.gif', 'demo.rec', ...new Array(8).fill('')];
  end.desc = 'The End';
  end.files = ['won.lst', 'shadows.cmf', 'lost.lst', 'shadows.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const scene = (desc: string, level: Level, bbl: string, mbl: string, cbl: string, card: string, x: number, y: number, to: number, toCell: [number, number]) => {
    const s = emptyScene(ADVTYPE);
    s.desc = desc.slice(0, 19);
    s.pos = { x, y };
    s.files = ['shadows.pal', `${level.file}.map`, bbl, 'shadows.mon', mbl, 'hero.chr', cbl, 'shadows.snd', 'shadows.cmf', card, '', ...new Array(9).fill('')];
    s.links = blank();
    s.links[0] = { toScene: to, from: { x: level.exit + ORIGIN, y: LANE + ORIGIN }, to: { x: toCell[0], y: toCell[1] } };
    return s;
  };
  const start = (l: Level) => l.map.start;
  game.scenes.push(scene('The Yard: Solid', levels.solid, 'solid.bbl', 'solid.mbl', 'solid.cbl', 'solid.lst', 60, 80, SCENE.dither, start(levels.dither)));
  game.scenes.push(scene('The Yard: Dithered', levels.dither, 'dither.bbl', 'dither.mbl', 'dither.cbl', 'dither.lst', 100, 80, SCENE.hop, start(levels.hop)));
  game.scenes.push(scene('The Hop', levels.hop, 'hop.bbl', 'dither.mbl', 'dither.cbl', 'hop.lst', 140, 80, SCENE.hover, start(levels.hover)));
  game.scenes.push(scene('The Hover', levels.hover, 'hover.bbl', 'dither.mbl', 'dither.cbl', 'hover.lst', 180, 80, SCENE.end, [0, 0]));
  title.links[0] = { toScene: SCENE.solid, from: { x: 0, y: 0 }, to: { x: levels.solid.map.start[0], y: levels.solid.map.start[1] } };
  return game;
}
