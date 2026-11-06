// room.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a room (scene 2 is the
// first room, in the order of levels.ts). A room's scene lists the files it loads in slots (palette,
// map, blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before
// it, a card after it) and carries its links: touch the From block here and you are in the To
// scene, standing on the To block.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CARDS, LINKS, type Room } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'ROOM TO ROOM';

/** The scene number of a room, or of the ending (1). */
export function sceneOf(rooms: Room[], file: string): number {
  if (file === 'end') return 1;
  const i = rooms.findIndex((r) => r.file === file);
  if (i < 0) throw new Error(`No room "${file}"`);
  return i + 2;
}

export function buildGame(rooms: Room[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'room.cmf',
    'menu.gif',
    'room.cmf',
    'story.lst',
    'room.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'room.cmf', 'lost.lst', 'room.cmf', ...new Array(16).fill('')];

  rooms.forEach((r, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = r.title.slice(0, 19);
    scene.pos = { x: 40 + (i % 4) * 80, y: 80 + Math.floor(i / 4) * 80 };
    const before = CARDS.find((c) => c.before === r.file);
    const after = CARDS.find((c) => c.after === r.file);
    scene.files = [
      'room.pal',
      `${r.file}.map`,
      'room.bbl',
      'room.mon',
      'room.mbl',
      'hero.chr',
      'hero.cbl',
      'room.snd',
      'room.cmf',
      before ? `${before.file}.lst` : '',
      after ? `${after.file}.lst` : '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    LINKS.filter((l) => l.from === r.file).forEach((l, n) => {
      const [fx, fy] = r.exits[l.exit];
      const target = l.to === 'end' ? undefined : rooms[sceneOf(rooms, l.to) - 2];
      const [tx, ty] = target ? target.ways[l.way] : [0, 0];
      scene.links[n] = { toScene: sceneOf(rooms, l.to), from: { x: fx, y: fy }, to: { x: tx, y: ty } };
    });
    game.scenes.push(scene);
  });

  const first = rooms[0].ways.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
