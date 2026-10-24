// bakers.gam: the scene graph.
//
//   0 title   1 the end (won / lost)   2..14 the thirteen rooms, in order   15 the hidey-hole
//   16 the compost crock (the rotten egg, off the Larder)
//   17 Ebenezer's display case (the pastry egg, off the Vault)
//   18 under the stove: Sir Reginald Cluckington III's interlude (the sugar hid under the
//      Sugar Room's stove from the tax man; the Sugar Room's way out is the gap, and the
//      chicken's way out is the sugar, on to the Brewery). It is played as the chicken (chick.chr), and
//      it is the one room with an exit picture: the cartoon of him popping back out.
//
// Every room's ingredient is its way out: the jar's cell is the link to the next room, so
// picking it up (counter 3 up, a thousand points) and leaving happen on the same step, and no
// room can be robbed twice. PLAYGAME shows a room's intro picture on every way in, so each
// room's intro is the page of the recipe card just found (the ingredient you came up with)
// and then the room's own card; no room has an exit picture, so a trip to an egg cupboard and
// back shows nothing out of turn.
// The Cold Cellar has a second vanilla bean behind a false wall, whose link drops into
// Ebenezer's hidey-hole; the hidey-hole's own way out is the spare pinch of tea, straight on
// to the Sugar Room. The Tea Room never knows you skipped it.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, type Game, type Link, type Scene } from '../../../web/src/formats/game';
import { ORIGIN, type Room } from './levels/room';

export const TITLE = "BAKER'S DOZEN";
export const GAM = 'bakers.gam';
export const SECRET_SCENE = 15;
/** The room whose second ingredient leads to the hidey-hole, and the one it skips. */
export const SECRET_FROM = 5;
export const SKIPPED = 6;

export const roomScene = (level: number) => (level === 0 ? SECRET_SCENE : level + 1);
export const sceneOf = (room: Room) => room.spec.cupboard?.scene ?? room.spec.interlude?.scene ?? roomScene(room.spec.level);

/** The ingredient a room's way in has just handed you (its intro shows that page first). */
export function arrivedWith(level: number): number | undefined {
  if (level === 0) return SECRET_FROM;
  if (level === SKIPPED + 1) return SKIPPED;
  return level > 1 ? level - 1 : undefined;
}

export const introName = (room: Room) =>
  room.spec.cupboard
    ? `egg${room.spec.cupboard.scene}.lst`
    : room.spec.interlude
      ? `${room.spec.file}in.lst`
      : `in${String(room.spec.level).padStart(2, '0')}.lst`;

/** The picture shown on the way out (only an interlude has one). */
export const outroName = (room: Room) => (room.spec.interlude ? `${room.spec.file}out.lst` : '');

function noLinks(): Link[] {
  return Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
}

export function sceneFiles(room: Room): string[] {
  const s = room.spec;
  const hero = s.hero ?? 'leo';
  return [
    `${s.file}.pal`,
    `${s.file}.map`,
    `${s.style}.bbl`,
    `${s.file}.mon`,
    'mons.mbl',
    `${hero}.chr`,
    `${hero}.cbl`,
    'leo.snd',
    `${s.song}.cmf`,
    introName(room),
    outroName(room),
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

/** Integrator positions: the rooms snake down the screen, the side rooms beside theirs. */
function pos(room: Room): { x: number; y: number } {
  if (room.spec.cupboard) return room.spec.cupboard.scene === 16 ? { x: 160, y: 10 } : { x: 70, y: 160 };
  if (room.spec.interlude) return { x: 70, y: 91 };
  const level = room.spec.level;
  if (level === 0) return { x: 270, y: 74 };
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

  const main = rooms.filter((r) => !r.spec.cupboard && !r.spec.interlude);
  const interludes = new Map(rooms.filter((r) => r.spec.interlude).map((r) => [r.spec.level, r]));
  const byLevel = new Map(main.map((r) => [r.spec.level, r]));
  const last = Math.max(...main.map((r) => r.spec.level));
  for (let l = 1; l <= last; l++) if (!byLevel.has(l)) throw new Error(`No room for level ${l}`);
  const scenes = new Map(rooms.map((r) => [sceneOf(r), r]));
  const top = Math.max(...scenes.keys());
  for (let s = 2; s <= top; s++) {
    const room = scenes.get(s);
    if (!room) {
      game.scenes.push(emptyScene());
      continue;
    }
    const p = pos(room);
    game.scenes.push(scene(room.spec.name, sceneFiles(room), p.x, p.y));
  }
  const setLink = (from: Room, i: number, at: { x: number; y: number }, toScene: number, to: { x: number; y: number }) => {
    game.scenes[sceneOf(from)].links[i] = { toScene, from: at, to };
  };
  for (const room of main) {
    const l = room.spec.level;
    const next = l === 0 ? byLevel.get(SKIPPED + 1) : byLevel.get(l + 1);
    const between = interludes.get(l);
    if (between) {
      setLink(room, 0, room.exit, sceneOf(between), between.start);
      setLink(between, 0, between.exit, roomScene(next!.spec.level), next!.start);
    } else setLink(room, 0, room.exit, next ? roomScene(next.spec.level) : 1, next ? next.start : { x: 0, y: 0 });
    if (room.secret) {
      const to = byLevel.get(0) ?? byLevel.get(l + 1);
      if (to) setLink(room, 1, room.secret, roomScene(to.spec.level), to.start);
    }
  }
  for (const cup of rooms.filter((r) => r.spec.cupboard)) {
    const parent = byLevel.get(cup.spec.level);
    if (!parent?.hatch) throw new Error(`${cup.spec.file}: its room has no D`);
    const [bx, by] = cup.spec.cupboard!.back;
    setLink(parent, 2, parent.hatch, sceneOf(cup), cup.start);
    setLink(cup, 0, cup.hatch!, roomScene(parent.spec.level), { x: bx + ORIGIN.x, y: by + ORIGIN.y });
  }
  title.links[0] = { toScene: roomScene(1), from: { x: 0, y: 0 }, to: byLevel.get(1)!.start };
  return game;
}
