// bakers.gam: the scene graph.
//
//   0 title   1 the end (won / lost)   2..14 the thirteen rooms, in order   15 the hidey-hole
//
// Every room's ingredient is its way out: the jar's cell is the link to the next room, so
// picking it up (counter 3 up, a thousand points) and leaving happen on the same step, and no
// room can be robbed twice. PLAYGAME shows a room's intro picture on every way in (its level
// card) and its exit picture on every way out (the ingredient's page of the recipe card).
// The Cold Cellar has a second vanilla bean behind a false wall, whose link drops into
// Ebenezer's hidey-hole; the hidey-hole's own way out is the spare pinch of tea, straight on
// to the Sugar Room. The Tea Room never knows you skipped it.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import type { Room } from './levels/room';

export const TITLE = "BAKER'S DOZEN";
export const GAM = 'bakers.gam';
export const SECRET_SCENE = 15;
/** The room whose second ingredient leads to the hidey-hole, and the one it skips. */
export const SECRET_FROM = 5;
export const SKIPPED = 6;

export const roomScene = (level: number) => (level === 0 ? SECRET_SCENE : level + 1);

function noLinks(): Link[] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

export function sceneFiles(room: Room): string[] {
  const s = room.spec;
  const n = String(s.level).padStart(2, '0');
  return [
    `${s.file}.pal`,
    `${s.file}.map`,
    `${s.style}.bbl`,
    `${s.file}.mon`,
    'mons.mbl',
    'leo.chr',
    'leo.cbl',
    'leo.snd',
    `${s.song}.cmf`,
    `card${n}.lst`,
    s.level === 13 ? '' : `rcp${s.level === 0 ? '06' : n}.lst`,
    ...new Array(9).fill(''),
  ];
}

function scene(desc: string, files: string[], x: number, y: number): Scene {
  const s = emptyScene(ADVTYPE);
  s.desc = desc.slice(0, 19);
  s.pos = { x, y };
  s.files = files;
  s.links = noLinks();
  return s;
}

/** Integrator positions: the rooms snake down the screen, the hidey-hole beside the Tea Room. */
function pos(level: number): { x: number; y: number } {
  if (level === 0) return { x: 250, y: 100 };
  const row = Math.floor((level - 1) / 4);
  const col = (level - 1) % 4;
  return { x: 40 + (row % 2 ? 3 - col : col) * 60, y: 40 + row * 34 };
}

export function buildGame(rooms: Room[]): Game {
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
  end.desc = 'The Thirteenth';
  end.files = ['won.lst', 'won.cmf', 'lost.lst', 'lost.cmf', ...new Array(16).fill('')];

  const byLevel = new Map(rooms.map((r) => [r.spec.level, r]));
  const levels = rooms.filter((r) => r.spec.level > 0).map((r) => r.spec.level);
  const last = Math.max(...levels);
  for (let s = 2; s <= SECRET_SCENE; s++) {
    const level = s === SECRET_SCENE ? 0 : s - 1;
    const room = byLevel.get(level);
    if (!room) {
      if (level > 0 && level <= last) throw new Error(`No room for level ${level}`);
      continue;
    }
    while (game.scenes.length < s) game.scenes.push(emptyScene());
    const p = pos(level);
    game.scenes.push(scene(room.spec.name, sceneFiles(room), p.x, p.y));
  }
  const link = (from: Room, at: { x: number; y: number }, i: number, toLevel: number) => {
    const to = toLevel < 0 ? undefined : byLevel.get(toLevel);
    game.scenes[roomScene(from.spec.level)].links[i] = { toScene: to ? roomScene(toLevel) : 1, from: at, to: to ? to.start : { x: 0, y: 0 } };
  };
  for (const room of rooms) {
    const l = room.spec.level;
    if (l === 0) link(room, room.exit, 0, SKIPPED + 1);
    else link(room, room.exit, 0, l === last ? -1 : l + 1);
    if (room.secret) link(room, room.secret, 1, byLevel.has(0) ? 0 : l + 1);
  }
  const first = byLevel.get(1)!;
  title.links[0] = { toScene: roomScene(1), from: { x: 0, y: 0 }, to: first.start };
  return game;
}
