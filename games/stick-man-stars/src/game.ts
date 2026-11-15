// stars.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './levels';
import { WORLD, inWorld } from './pack';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'STICK MAN STARS';

const place = (i: number, p: [number, number]) => {
  const [x, y] = inWorld(i, p);
  return { x, y };
};

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'stars.cmf',
    'menu.gif',
    'stars.cmf',
    'story.lst',
    'stars.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'stars.cmf', 'lost.lst', 'stars.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    // a level with no climbing never scrolls up or down (PLAYGAME scrolls a direction only when its byte is 0xFF)
    if (l.flat) Object.assign(scene.scroll, { up: 0, down: 0 });
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      `${l.file}.pal`,
      `${WORLD}.map`,
      'stars.bbl',
      'stars.mon',
      'stars.mbl',
      'hero.chr',
      'hero.cbl',
      'stars.snd',
      'stars.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    const [fx, fy] = inWorld(i, l.map.exits[0].from);
    scene.links[0] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? place(i + 1, next.map.start) : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: place(0, levels[0].map.start) };
  return game;
}
