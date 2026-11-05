// nearfar.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a plane (scene 2 is the
// first, in the order of levels.ts). A near scene and a far scene differ in the map they load and in the
// palette: the far one loads far.pal, the near one near.pal. Scrolling is switched off so the screen stays on
// the 16 x 10 window around the cell Kit lands on. A scene lists the files it loads in slots (palette, map,
// blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before it, a card
// after it) and carries its links: touch the From block here and you are in the To scene, standing on the To block.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CARDS, LINKS, type Room } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'NEAR AND FAR';

/** The scene number of a room, or of the ending (1). */
export function sceneOf(rooms: Room[], id: string): number {
  if (id === 'end') return 1;
  const i = rooms.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`No room "${id}"`);
  return i + 2;
}

export function buildGame(rooms: Room[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'nearfar.cmf',
    'menu.gif',
    'nearfar.cmf',
    'story.lst',
    'nearfar.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'nearfar.cmf', 'lost.lst', 'nearfar.cmf', ...new Array(16).fill('')];

  rooms.forEach((r, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = r.title.slice(0, 19);
    scene.pos = { x: 40 + (i % 4) * 80, y: 80 + Math.floor(i / 4) * 80 };
    // no scrolling in any direction: the screen stays where the landing cell put it
    scene.scroll.up = scene.scroll.down = scene.scroll.left = scene.scroll.right = 0;
    const before = CARDS.find((c) => c.before === r.id);
    scene.files = [
      r.plane === 'far' ? 'far.pal' : 'near.pal',
      `${r.file}.map`,
      'nearfar.bbl',
      'nearfar.mon',
      'nearfar.mbl',
      r.plane === 'far' ? 'far.chr' : 'hero.chr',
      r.plane === 'far' ? 'far.cbl' : 'hero.cbl',
      'nearfar.snd',
      'nearfar.cmf',
      before ? `${before.file}.lst` : '',
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    LINKS.filter((l) => l.from === r.id).forEach((l, n) => {
      const [fx, fy] = r.exits[l.exit];
      const target = l.to === 'end' ? undefined : rooms[sceneOf(rooms, l.to) - 2];
      const [tx, ty] = target ? target.landing : [0, 0];
      scene.links[n] = { toScene: sceneOf(rooms, l.to), from: { x: fx, y: fy }, to: { x: tx, y: ty } };
    });
    game.scenes.push(scene);
  });

  const first = rooms[0].landing;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
