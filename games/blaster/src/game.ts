// blaster.gam: the title scene, the ending, and every leg of every stage in order, each
// one's gate linked to the launch pad of the next.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../../web/src/formats/game';
import { startOf, type Stage } from './stages/stage';

export const TITLE = 'VIRUS BLASTER';

export function buildGame(stages: Stage[], startAt?: string): Game {
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
    'credit.lst',
    'scores.gif',
    'load.gif',
    'save.gif',
    'demo.rec',
    ...new Array(8).fill(''),
  ];
  end.desc = 'System Clean';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  const legs = stages.flatMap((s) => s.legs.map((l) => ({ s, l })));
  legs.forEach(({ s, l }, i) => {
    const scene = emptyScene(ADVTYPE);
    scene.desc = `${s.n}${'abc'[s.legs.indexOf(l)]} ${l.title}`.slice(0, 19);
    scene.pos = { x: 24 + (i % 8) * 36, y: 90 + Math.floor(i / 8) * 50 };
    // Scrolling legs may only scroll up (the ship's drift carries the screen along, see
    // characters/ship.ts); boss arenas never scroll: one fixed screen.
    scene.scroll = { ...scene.scroll, up: l.kind === 'scroll' ? 0xff : 0, down: 0, left: 0, right: 0 };
    const last = s.legs[s.legs.length - 1] === l;
    scene.files = [
      `s${s.n}.pal`,
      `${l.file}.map`,
      `${l.kitFile}.bbl`,
      `${l.kitFile}.mon`,
      `${l.kitFile}.mbl`,
      l.kind === 'boss' ? 'shipfree.chr' : 'ship.chr',
      'ship.cbl',
      'blaster.snd',
      l.kind === 'boss' ? s.bossSong : s.song,
      `${l.file}.lst`,
      last && legs[i + 1] ? 'warp.fli' : '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = legs[i + 1];
    l.grid.links.forEach((from, k) => {
      scene.links[k] = { toScene: next ? i + 3 : 1, from, to: next ? startOf(next.l) : { x: 0, y: 0 } };
    });
    game.scenes.push(scene);
  });

  const first = Math.max(0, startAt ? legs.findIndex(({ l }) => l.file === startAt) : 0);
  title.links[0] = { toScene: first + 2, from: { x: 0, y: 0 }, to: startOf(legs[first].l) };
  return game;
}
