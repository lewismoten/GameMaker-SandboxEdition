// overhead.gam: scene 0 is the title and menu, scene 1 the endings, scene 2 the room, then one scene an area of the
// roads (scenes 3 to 7, in the order of AREAS). The five areas load the same world.map: an area is only the window
// around the cell its scene lands the hero on, with scrolling switched off so the screen stays on that area. A scene
// lists the files it loads in slots (palette, map, blocks, monsters, monster blocks, character, character blocks,
// sounds, song, a card before it, a card after it) and carries its links: touch the From block here and you are in
// the To scene, standing on the To block.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { AREAS, LINKS, START_ONE, DOOR_ONE, area, fromCells, type Level } from './levels';
import { ORIGIN } from '../../kit/starter/map';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'OVERHEAD';

/** The scene number of an area, or of the ending (1). */
export function sceneOf(id: string): number {
  if (id === 'end') return 1;
  const i = AREAS.findIndex((a) => a.id === id);
  if (i < 0) throw new Error(`No area "${id}"`);
  return i + 3;
}

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'over.cmf',
    'menu.gif',
    'over.cmf',
    'story.lst',
    'over.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'over.cmf', 'lost.lst', 'over.cmf', ...new Array(16).fill('')];

  const blank = () => Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  const files = (map: string, before: string, after: string) => [
    'over.pal',
    map,
    'over.bbl',
    'over.mon',
    'over.mbl',
    'hero.chr',
    'hero.cbl',
    'over.snd',
    'over.cmf',
    before,
    after,
    ...new Array(9).fill(''),
  ];

  // scene 2: the room (scrolling on, as the editor starts a scene); its door lands in the meadow
  const room = emptyScene(ADVTYPE);
  room.desc = levels[0].title.slice(0, 19);
  room.pos = { x: 40, y: 80 };
  room.files = files('one.map', 'one.lst', 'world.lst');
  room.links = blank();
  const meadow = area('meadow').landing;
  room.links[0] = { toScene: sceneOf('meadow'), from: { x: DOOR_ONE[0] + ORIGIN, y: DOOR_ONE[1] + ORIGIN }, to: { x: meadow[0], y: meadow[1] } };
  game.scenes.push(room);

  AREAS.forEach((a, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = a.title.slice(0, 19);
    scene.pos = { x: 120 + (i % 3) * 70, y: 60 + Math.floor(i / 3) * 70 };
    // no scrolling in any direction: the screen stays where the landing cell put it
    scene.scroll.up = scene.scroll.down = scene.scroll.left = scene.scroll.right = 0;
    scene.files = files('world.map', '', '');
    scene.links = blank();
    let n = 0;
    for (const l of LINKS.filter((k) => k.from === a.id)) {
      const dest = l.to === 'end' ? [0, 0] : area(l.to).landing;
      for (const [fx, fy] of fromCells(l)) scene.links[n++] = { toScene: sceneOf(l.to), from: { x: fx, y: fy }, to: { x: dest[0], y: dest[1] } };
    }
    game.scenes.push(scene);
  });

  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: START_ONE[0] + ORIGIN, y: START_ONE[1] + ORIGIN } };
  return game;
}
