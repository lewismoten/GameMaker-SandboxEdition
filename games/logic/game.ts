// ohmsweet.gam: the title scene, the ending, and the fifteen boards in order, each one's
// outlet linked to the next board (the last one to "Game Won"). Boards never scroll: every
// one fits on a single screen with Watt's pad in the middle.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../web/src/formats/game';
import { START, type Board } from './board';

export const TITLE = 'OHM SWEET OHM';

export function buildGame(boards: Board[], startAt = 0): Game {
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
  end.desc = 'Home Sweet Ohm';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  let ride = 0;
  boards.forEach((b, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = b.spec.title.slice(0, 19);
    scene.pos = { x: 30 + (i % 8) * 36, y: 90 + Math.floor(i / 8) * 50 };
    scene.scroll = { ...scene.scroll, up: 0, down: 0, left: 0, right: 0 };
    const next = boards[i + 1];
    const roomEnds = next && next.spec.room !== b.spec.room;
    scene.files = [
      'watt.pal',
      `${b.spec.file}.map`,
      `${b.spec.room}.bbl`,
      `${b.spec.file}.mon`,
      'parts.mbl',
      'watt.chr',
      'watt.cbl',
      'watt.snd',
      `${b.spec.room}.cmf`,
      `${b.spec.file}.lst`,
      roomEnds ? `ride${++ride}.fli` : '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    scene.links[0] = { toScene: next ? i + 3 : 1, from: b.exit, to: next ? START : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });
  title.links[0] = { toScene: startAt + 2, from: { x: 0, y: 0 }, to: START };
  return game;
}
