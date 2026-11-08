// samehs.gam: scene 0 is the title and menu, scene 1 the endings, then for each level a hub scene
// (the street, the square) followed by one scene for each of its three doors. The three door scenes
// name the very same room map and blocks and a different palette file in slot 0; only that differs.
// Last come the hubs again without their cards, for the rooms to come back to.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { ORIGIN } from '../../kit/starter/map';
import { addReturnScenes } from '../../kit/starter/returnScenes';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'THE SAME HOUSE';

/** The scene numbers of a level: its hub, and the scenes of its three doors. */
export const hubScene = (level: number): number => 2 + level * 4;
export const roomScene = (level: number, door: number): number => hubScene(level) + 1 + door;

type Link = Scene['links'][number];
const link = (toScene: number, from: [number, number], to: [number, number]): Link => ({
  toScene,
  from: { x: from[0], y: from[1] },
  to: { x: to[0], y: to[1] },
});

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'sh.cmf',
    'menu.gif',
    'sh.cmf',
    'story.lst',
    'sh.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'sh.cmf', 'lost.lst', 'sh.cmf', ...new Array(16).fill('')];

  const add = (desc: string, pal: string, file: string, card: string, links: Link[]): void => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = desc.slice(0, 19);
    scene.pos = { x: 40 + (game.scenes.length - 2) * 50, y: 110 };
    scene.files = [
      `${pal}.pal`,
      `${file}.map`,
      `${file}.bbl`,
      'sh.mon',
      'sh.mbl',
      'hero.chr',
      'hero.cbl',
      'sh.snd',
      'sh.cmf',
      card,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => link(NOSCENE, [0, 0], [0, 0]));
    links.forEach((l, k) => (scene.links[k] = l));
    game.scenes.push(scene);
  };

  levels.forEach((l, i) => {
    const after = levels[i + 1];
    const hub = hubScene(i);
    // the hub: each door goes to its room scene; the last door goes on to the next level (or the ending)
    const onward = after ? link(hubScene(i + 1), l.hub.next, after.hub.enter) : link(1, l.hub.next, [0, 0]);
    add(`${l.hub.scene}`, l.hub.pal, l.hub.file, `${l.hub.file}.lst`, [
      ...l.hub.doors.map((d, k) => link(roomScene(i, k), [d + ORIGIN, 9 + ORIGIN], l.room.enter)),
      onward,
    ]);
    // the room scenes: each one's door comes back to the hub, just past the door it came in by
    l.room.pals.forEach((pal, k) => add(l.room.scenes[k], pal, l.room.file, '', [link(hub, l.room.exit, l.hub.landings[k])]));
  });

  // a room comes back to its hub's copy without the card (kit/starter/returnScenes.ts), so the card shows once
  addReturnScenes(
    game,
    levels.map((_, i) => hubScene(i)),
  );

  title.links[0] = link(2, [0, 0], levels[0].hub.enter);
  return game;
}
