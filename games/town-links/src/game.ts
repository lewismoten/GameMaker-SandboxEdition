// townlink.gam: scene 0 is the title and menu, scene 1 the endings, scene 2 the world map, scene 3 the town and
// scene 4 the house. Each scene loads its own map file; the world also loads its own tiny Kit (character and blocks),
// the town and the house the full-size one. A scene lists the files it loads in slots (palette, map, blocks, monsters,
// monster blocks, character, character blocks, sounds, song, a card before it, a card after it) and carries its links:
// touch the From block here and you are in the To scene, standing on the To cell. Every scroll is on, so the screen
// follows Kit from wherever the To cell puts him.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import {
  HOUSE_EXIT,
  HOUSE_LANDING,
  HOUSE_OUT,
  HOUSE_DOOR,
  TOWN_BLOCK,
  TOWN_GATE,
  TOWN_LANDING,
  TOWN_YARD,
  WORLD_BESIDE,
  WORLD_START,
  type Spot,
} from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'MAPS WITHIN MAPS';

/** The scenes by number. */
export const SCENE = { world: 2, town: 3, house: 4, end: 1 } as const;

export function buildGame(): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'town.cmf',
    'menu.gif',
    'town.cmf',
    'story.lst',
    'town.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'town.cmf', 'lost.lst', 'town.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const scene = (desc: string, map: string, chr: string, x: number, y: number) => {
    const s = emptyScene(ADVTYPE);
    s.desc = desc;
    s.pos = { x, y };
    s.files = ['town.pal', map, 'town.bbl', 'town.mon', 'town.mbl', `${chr}.chr`, `${chr}.cbl`, 'town.snd', 'town.cmf', '', '', ...new Array(9).fill('')];
    s.links = blank();
    return s;
  };
  const link = (s: ReturnType<typeof scene>, n: number, toScene: number, from: Spot, to: Spot) => {
    s.links[n] = { toScene, from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] } };
  };

  const world = scene('World Map', 'world.map', 'tiny', 60, 80);
  link(world, 0, SCENE.town, TOWN_BLOCK, TOWN_LANDING);
  const town = scene('The Town', 'town.map', 'hero', 140, 80);
  TOWN_GATE.forEach((cell, n) => link(town, n, SCENE.world, cell, WORLD_BESIDE));
  link(town, 2, SCENE.house, HOUSE_DOOR, HOUSE_LANDING);
  const house = scene('The House', 'house.map', 'hero', 220, 80);
  link(house, 0, SCENE.town, HOUSE_OUT, TOWN_YARD);
  link(house, 1, SCENE.end, HOUSE_EXIT, [0, 0]);
  game.scenes.push(world, town, house);

  title.links[0] = { toScene: SCENE.world, from: { x: 0, y: 0 }, to: { x: WORLD_START[0], y: WORLD_START[1] } };
  return game;
}
