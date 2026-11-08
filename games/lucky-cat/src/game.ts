// lucky.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster blocks, character,
// character blocks, sounds, song, card) and links its door to the next scene.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './level';
import type { SongName } from './song';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'LUCKY CAT';

/** The song each level plays (the title, menu and endings use the theme and the finale). */
export const LEVEL_SONGS: Record<string, SongName> = {
  one: 'theme',
  alley: 'mirror',
  two: 'mirror',
  steps: 'tower',
  three: 'theme',
  rascal: 'rascal',
  rigging: 'rascal',
  four: 'fair',
  market: 'fair',
  tower: 'tower',
  five: 'theme',
  six: 'finale',
};

export function buildGame(levels: Level[]): Game {
  const game = newGame(TITLE);
  const [title, end] = game.scenes;
  title.files = [
    'title.lst',
    'theme.cmf',
    'menu.gif',
    'theme.cmf',
    'story.lst',
    'theme.cmf',
    'howto.lst',
    'credits.lst',
    'scores.gif',
    'loadgame.gif',
    'savegame.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'The End';
  end.files = ['won.lst', 'finale.cmf', 'lost.lst', 'theme.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 60 + i * 80, y: 110 };
    scene.files = [
      `${l.file}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      'crow.mon',
      'crow.mbl',
      `${l.chr}.chr`,
      l.chr === 'rascal' ? 'rascal.cbl' : 'hero.cbl',
      'lucky.snd',
      `${LEVEL_SONGS[l.file]}.cmf`,
      `${l.file}.lst`,
      '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    const [fx, fy] = l.map.exits[0].from;
    scene.links[0] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
