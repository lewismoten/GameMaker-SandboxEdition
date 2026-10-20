// teddy.gam: the title scene, the ending, and the levels in order, each one's Klown Car
// door linked to the start of the next.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../web/src/formats/game';
import type { Level } from './level';
import { backyard } from './level1';
import { street } from './level2';
import { park } from './level3';
import { city } from './level4';
import { klub } from './level5';

export const LEVELS: (() => Level)[] = [backyard, street, park, city, klub];

/** Songs per level (CMF file names), in level order. */
export const LEVEL_SONGS = ['backyard.cmf', 'street.cmf', 'park.cmf', 'city.cmf', 'klub.cmf'];

export const TITLE = "TEDDY'S ADVENTURE";

export function buildGame(levels: Level[], startAt?: string): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'title.cmf',
    'menu.gif',
    'menu.cmf',
    'story.lst',
    'story.cmf',
    'help.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The Big Show';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 40 + i * 56, y: 110 };
    scene.files = [
      `${l.file}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      `${l.file}.mon`,
      `${l.file}.mbl`,
      'teddy.chr',
      'teddy.cbl',
      'teddy.snd',
      LEVEL_SONGS[i],
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    scene.links[0] = { toScene: next ? i + 3 : 1, from: l.exit, to: next ? next.start : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  const first = Math.max(0, startAt ? levels.findIndex((l) => l.file === startAt) : 0);
  title.links[0] = { toScene: first + 2, from: { x: 0, y: 0 }, to: levels[first].start };
  return game;
}
