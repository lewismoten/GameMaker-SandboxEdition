// blaster.gam: the title scene, the ending, and every leg of every stage in order, each
// one's gate linked to the launch pad of the next.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game } from '../../../web/src/formats/game';
import { legLetter, startOf, type Leg, type Stage } from './stages/stage';

const TITLE = 'VIRUS BLASTER';

/** The ship's flight program for each kind of leg (characters/ship.ts). */
const SHIP_FILE: Record<Leg['kind'], string> = {
  scroll: 'ship.chr',
  down: 'shipdown.chr',
  boss: 'shipfree.chr',
  diag: 'shipdiag.chr',
  side: 'shipside.chr',
  left: 'shipleft.chr',
  bus: 'shipbus.chr',
};

/**
 * Which ways a leg's screen may scroll: strips up (turned ones down), diagonal legs up and
 * right, side legs right (turned ones left), arenas and bus rides never.
 */
export const scrollOf = (l: Leg) => ({
  up: l.kind === 'scroll' || l.kind === 'diag' ? 0xff : 0,
  down: l.kind === 'down' ? 0xff : 0,
  left: l.kind === 'left' ? 0xff : 0,
  right: l.kind === 'diag' || l.kind === 'side' ? 0xff : 0,
});

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
    scene.desc = `${s.n}${legLetter(s, l) || '-'} ${l.title}`.slice(0, 19);
    scene.pos = { x: 24 + (i % 8) * 36, y: 90 + Math.floor(i / 8) * 50 };
    // Scrolling legs may only scroll up (the ship's drift carries the screen along, see
    // characters/ship.ts); boss arenas never scroll: one fixed screen.
    // The diagonal legs scroll up and right, wrapping round the map (see stages/diagLeg.ts);
    // the side-scrolling legs only right (stages/sideLeg.ts).
    scene.scroll = { ...scene.scroll, ...scrollOf(l) };
    const last = s.legs[s.legs.length - 1] === l;
    scene.files = [
      l.pal ? `${l.palFile ?? l.file}.pal` : `s${s.n}.pal`,
      `${l.mapFile ?? l.file}.map`,
      `${l.kitFile}.bbl`,
      `${l.kitFile}.mon`,
      `${l.kitFile}.mbl`,
      SHIP_FILE[l.kind],
      'ship.cbl',
      'blaster.snd',
      l.kind === 'boss' ? s.bossSong : l.kind === 'bus' ? 'bus.cmf' : s.song,
      `${l.file}.lst`,
      // after a boss the cartoon boards the data bus; after a ride, it pulls into the next stage
      last && legs[i + 1] ? 'warp.fli' : l.kind === 'bus' ? `${l.file}.fli` : '',
      ...new Array(9).fill(''),
    ];
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = legs[i + 1];
    l.grid.links.forEach((from, k) => {
      scene.links[k] = { toScene: next ? i + 3 : 1, from, to: next ? startOf(next.l) : { x: 0, y: 0 } };
    });
    game.scenes.push(scene);
  });

  // side rooms go after every leg, each followed by its way-out copy of the next leg
  for (const s of stages) {
    const side = s.side;
    if (!side) continue;
    const at = (file: string) => {
      const i = legs.findIndex(({ l }) => l.file === file);
      if (i < 0) throw new Error(`No leg ${file}`);
      return i + 2;
    };
    const roomAt = game.scenes.length;
    const room = emptyScene(ADVTYPE);
    room.desc = `${s.n}x ${side.room.title}`.slice(0, 19);
    room.pos = { x: 24, y: 170 };
    room.scroll = { ...room.scroll, up: 0, down: 0, left: 0, right: 0 };
    room.files = [
      `s${s.n}.pal`,
      `${side.room.file}.map`,
      `${side.room.kitFile}.bbl`,
      `${side.room.kitFile}.mon`,
      `${side.room.kitFile}.mbl`,
      'shipfree.chr',
      'ship.cbl',
      'blaster.snd',
      'story.cmf',
      `${side.room.file}.lst`,
      ...new Array(10).fill(''),
    ];
    const then = game.scenes[at(side.then)];
    const out = structuredClone(then);
    out.files[9] = `${side.outro}.lst`;
    out.pos = { x: 60, y: 170 };
    room.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    side.room.grid.links.forEach((from, k) => {
      room.links[k] = { toScene: roomAt + 1, from, to: startOf(legs[at(side.then) - 2].l) };
    });
    const from = game.scenes[at(side.from)];
    const free = from.links.findIndex((l) => l.toScene === NOSCENE);
    if (free < 0) throw new Error(`No free link in ${side.from}`);
    // first in the list, so the editor's Auto-arrange (which follows links in order) lays the
    // room out beside the leg it leads from, not after the ending's chain
    from.links.splice(free, 1);
    from.links.unshift({ toScene: roomAt, from: side.cell, to: startOf(side.room) });
    game.scenes.push(room, out);
  }

  const first = Math.max(0, startAt ? legs.findIndex(({ l }) => l.file === startAt) : 0);
  title.links[0] = { toScene: first + 2, from: { x: 0, y: 0 }, to: startOf(legs[first].l) };
  return game;
}
