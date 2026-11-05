// show.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'THE SHOW';

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'show.cmf',
    'menu.gif',
    'show.cmf',
    'story.lst',
    'show.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'show.cmf', 'lost.lst', 'show.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'show.pal',
      `${l.file}.map`,
      'show.bbl',
      'show.mon',
      'show.mbl',
      'hero.chr',
      'hero.cbl',
      'show.snd',
      'show.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    // the door at the far end goes on; the encore door (the first one, by column) loads this same scene again, which starts the show again
    const [encore, door] = [...l.map.exits].sort((a, b) => a.from[0] - b.from[0]);
    scene.links[0] = {
      toScene: next ? i + 3 : 1,
      from: { x: door.from[0], y: door.from[1] },
      to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 },
    };
    scene.links[1] = { toScene: i + 2, from: { x: encore.from[0], y: encore.from[1] }, to: { x: l.map.start[0], y: l.map.start[1] } };
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
