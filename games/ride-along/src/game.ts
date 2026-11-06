// ride.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster
// blocks, character, character blocks, sounds, song, card) and links its exit to the next scene.
// The character slot is the point of this game: level 1 names the helper's own file, level 2 the rocket's
// and level 3 the canoe's. A level's exit is a link from each of several blocks (Level.exits), all to the same place.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './levels';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'RIDE ALONG';

/** The character files (and their blocks) each level's scene names. */
const CHARACTERS = [
  ['hero.chr', 'hero.cbl'],
  ['ship.chr', 'ship.cbl'],
  ['boat.chr', 'boat.cbl'],
];

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'ride.cmf',
    'menu.gif',
    'ride.cmf',
    'story.lst',
    'ride.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'ride.cmf', 'lost.lst', 'ride.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      'ride.pal',
      `${l.file}.map`,
      `${l.file}.bbl`,
      'ride.mon',
      'ride.mbl',
      CHARACTERS[i][0],
      CHARACTERS[i][1],
      'ride.snd',
      'ride.cmf',
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    l.exits.forEach(([fx, fy], k) => {
      scene.links[k] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 } };
    });
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
