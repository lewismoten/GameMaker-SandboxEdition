// veryfar.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a stretch of road (scene 2 is
// the first, in the order of levels.ts). The scenes differ in the map they load, the palette (the near one loads
// near.pal, the far ones far.pal) and the character: hero.chr is the two-block Lian, quick.chr and slow.chr are
// the tiny Lian with big and small steps. The view starts with Lian in
// the middle of the screen and scrolls sideways as he walks. A scene lists the files it loads in slots (palette, map,
// blocks, monsters, monster blocks, character, character blocks, sounds, song, a card before it, a card
// after it) and carries its links: touch the From block here and you are in the To scene, standing on the To block.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CARDS, LINKS, type Room } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'WALKING VERY FAR';

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
    'veryfar.cmf',
    'menu.gif',
    'veryfar.cmf',
    'story.lst',
    'veryfar.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'veryfar.cmf', 'lost.lst', 'veryfar.cmf', ...new Array(16).fill('')];

  rooms.forEach((r, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = r.title.slice(0, 19);
    scene.pos = { x: 40 + (i % 4) * 80, y: 80 + Math.floor(i / 4) * 80 };
    // the view follows Lian sideways; it never moves up or down (the maps are 10 blocks high, one screen)
    scene.scroll.up = scene.scroll.down = 0;
    const before = CARDS.find((c) => c.before === r.id);
    scene.files = [
      r.look === 'near' ? 'near.pal' : 'far.pal',
      `${r.file}.map`,
      'veryfar.bbl',
      'veryfar.mon',
      'veryfar.mbl',
      r.look === 'near' ? 'hero.chr' : `${r.look}.chr`,
      r.look === 'near' ? 'hero.cbl' : 'tiny.cbl',
      'veryfar.snd',
      'veryfar.cmf',
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
