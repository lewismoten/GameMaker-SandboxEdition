// noodle.gam: scene 0 is the title and menu, scene 1 the endings, then one scene a level.
// A level's scene lists the files it loads in slots (palette, map, blocks, monsters, monster blocks, character,
// character blocks, sounds, song, card) and links each of its exits to the next scene (a pantry shaft's docking shelf
// is six exits side by side).
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Level } from './level';

/** The title of the game, as the .GAM names it (19 characters at most). */
export const TITLE = 'NOODLE OBSERVATORY';

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
  end.files = ['won.lst', 'supper.cmf', 'lost.lst', 'glass.cmf', ...new Array(16).fill('')];

  levels.forEach((l, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = l.title.slice(0, 19);
    scene.pos = { x: 30 + (i % 7) * 50, y: 80 + Math.floor(i / 7) * 60 };
    const ch = l.hero === 'ring' ? 'ring' : 'nell';
    scene.files = [
      `${l.file}.pal`,
      `${l.file}.map`,
      `${l.file}.bbl`,
      `${l.mon}.mon`,
      'noodle.mbl',
      `${ch}.chr`,
      `${ch}.cbl`,
      'noodle.snd',
      `${l.song}.cmf`,
      `${l.file}.lst`,
      ...new Array(10).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    l.map.exits.forEach((e, k) => {
      const [fx, fy] = e.from;
      scene.links[k] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 } };
    });
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
  return game;
}
