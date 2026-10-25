// Maps of separate rooms (levelRooms.ts) and how the Level Maps print them (levelMapLayout.ts):
// rooms found by what the hero can walk between, named, drawn once for their copies, left out
// when nobody walks around in them; a way that only looks like it goes round laid out in one
// piece; empty sides trimmed to one block. Checked on small made-up maps and on the real disks.
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { emptyBlock } from '../../formats/blocks';
import { ADVTYPE, ENDTYPE, STARTTYPE, type Game, type Scene } from '../../formats/game';
import { MLEN, MWID } from '../../formats/map';
import { readDisk } from '../../../scripts/levelViewsScan';
import { cutRooms, passesThrough, separateRooms } from './levelRooms';
import { levelsOf, trimPadding } from './levelMapLayout';
import { listedSecrets } from './levelSecrets';
import { listedUnrolled, listedViews } from './levelViews';
import { listedRoomHints } from './levelRoomHints';

const OPEN = 0;
const WALL = 1;
const blocks = [emptyBlock(0), { ...emptyBlock(1), solid: 15 }, emptyBlock(2)];

/** A map of wall with open rooms cut in it ([x, y, w, h], walls not included). */
function mapOf(rooms: [number, number, number, number][]): Uint8Array {
  const cells = new Uint8Array(MLEN * MWID).fill(WALL);
  for (const [x0, y0, w, h] of rooms) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells[y * MLEN + x] = OPEN;
  return cells;
}

const scene = (gametype: number, desc: string, links: [number, number, number, number, number][] = [], still = false): Scene =>
  ({
    gametype,
    pos: { x: 0, y: 0 },
    desc,
    files: ['a.pal', 'a.map', 'a.bbl'],
    scroll: still ? { up: 0, down: 0, left: 0, right: 0 } : { up: 255, down: 255, left: 255, right: 255 },
    links: links.map(([toScene, fx, fy, tx, ty]) => ({ toScene, from: { x: fx, y: fy }, to: { x: tx, y: ty } })),
  }) as unknown as Scene;

describe('separate rooms', () => {
  it('finds each walled room round its arrivals, with its walls, and the map edge as a wall', () => {
    const cells = mapOf([
      [5, 5, 10, 4],
      [30, 5, 6, 6],
      [0, 40, 8, 3],
    ]);
    const rooms = separateRooms(cells, blocks, [
      { x: 6, y: 6 },
      { x: 31, y: 7 },
      { x: 0, y: 41 },
      { x: 14, y: 8 },
    ])!;
    expect(rooms.rects).toEqual([
      { x: 4, y: 4, w: 12, h: 6 },
      { x: 29, y: 4, w: 8, h: 8 },
      { x: 0, y: 39, w: 9, h: 5 },
    ]);
    expect(separateRooms(cells, blocks, [{ x: 6, y: 6 }])).toBeUndefined();
  });

  it('puts an arrival on a solid block (a doorway) in the room beside it', () => {
    const cells = mapOf([
      [5, 5, 10, 4],
      [30, 5, 6, 6],
    ]);
    const rooms = separateRooms(cells, blocks, [
      { x: 15, y: 6 },
      { x: 6, y: 6 },
      { x: 31, y: 7 },
    ])!;
    expect(rooms.rects).toHaveLength(2);
    expect(rooms.rects[0]).toEqual({ x: 4, y: 4, w: 13, h: 6 });
  });

  it('names rooms by the scene that brings you only there, and leaves a map alone when rooms share their scenes', () => {
    const cells = mapOf([
      [5, 5, 10, 4],
      [30, 5, 6, 6],
    ]);
    const game = {
      scenes: [
        scene(STARTTYPE, 'Title', [[2, 0, 0, 6, 6]]),
        scene(ENDTYPE, 'End'),
        scene(ADVTYPE, 'Town', [[3, 14, 6, 31, 7]]),
        scene(ADVTYPE, 'Cellar', [[1, 35, 10, 0, 0]]),
      ],
    } as unknown as Game;
    const rooms = separateRooms(cells, blocks, [
      { x: 6, y: 6 },
      { x: 31, y: 7 },
    ])!;
    expect(cutRooms(game, [2, 3], rooms)!.map((c) => [c.name, c.scenes])).toEqual([
      ['Town', [2]],
      ['Cellar', [3]],
    ]);
    // one scene arriving in both: not plainly rooms, unless a hint says so
    game.scenes[0].links[0].toScene = 2;
    game.scenes[2].links[0].toScene = 2;
    expect(cutRooms(game, [2], rooms)).toBeUndefined();
    expect(
      cutRooms(game, [2], rooms, {
        rooms: [
          { at: [30, 5], name: 'Booth room', short: 'Booth' },
          { at: [6, 6], name: 'Hall' },
        ],
      })!.map((c) => c.name),
    ).toEqual(['Booth room', 'Hall']);
  });

  it('draws copies of a room once, gathers cast rooms into a panel, and leaves out a room every scene passes straight through', () => {
    // four 16 x 10 screens: a room, its copy, an interview room, a pass-through room
    const cells = mapOf([
      [1, 1, 14, 8],
      [17, 1, 14, 8],
      [33, 1, 14, 8],
      [49, 1, 14, 8],
    ]);
    const game = {
      scenes: [
        scene(STARTTYPE, 'Title', [[2, 0, 0, 8, 5]]),
        scene(ENDTYPE, 'End'),
        scene(ADVTYPE, 'Room', [[3, 2, 5, 24, 5]], true),
        scene(ADVTYPE, 'Room again', [[4, 18, 5, 40, 5]], true),
        scene(ADVTYPE, 'Talk', [[5, 34, 5, 56, 5]], true),
        // starts on its only way out
        scene(ADVTYPE, 'Page', [[2, 56, 5, 8, 5]], true),
      ],
    } as unknown as Game;
    const rooms = separateRooms(cells, blocks, [
      { x: 8, y: 5 },
      { x: 24, y: 5 },
      { x: 40, y: 5 },
      { x: 56, y: 5 },
    ])!;
    const cuts = cutRooms(game, [2, 3, 4, 5], rooms, {
      rooms: [{ at: [8, 5], name: 'The Room', same: [[24, 5]], note: 'later, again' }],
      cast: { beside: [8, 5], title: 'Who', people: [{ name: 'Someone, a role', picture: [40, 2, 2, 2], visits: [{ label: 'Once', at: [40, 5] }] }] },
    })!;
    expect(cuts).toHaveLength(1);
    // a room shown by scenes that never scroll is the screen they show
    expect(cuts[0].rect).toEqual({ x: 0, y: 0, w: 16, h: 10 });
    expect(cuts[0].scenes).toEqual([2, 3]);
    expect(cuts[0].copies).toEqual([{ x: 16, y: 0, w: 16, h: 10 }]);
    expect(cuts[0].cast!.people[0].visits[0].scenes).toEqual([4]);
    expect(passesThrough(game, [5])).toBe(true);
    expect(passesThrough(game, [2])).toBe(false);
  });
});

describe('trimming a crop', () => {
  it('cuts empty sides of padding (and the stars scattered in it) back to one block, never past a mark', () => {
    const cells = new Uint8Array(MLEN * MWID).fill(OPEN);
    for (let i = 0; i < cells.length; i += 13) cells[i] = 2; // stars
    for (let y = 10; y < 20; y++) for (let x = 10; x < 30; x++) cells[y * MLEN + x] = WALL;
    const area = { x: 0, y: 0, w: 50, h: 40 };
    expect(trimPadding(area, cells, [])).toEqual({ x: 9, y: 9, w: 22, h: 12 });
    expect(trimPadding(area, cells, [{ x: 40, y: 15, w: 1, h: 1 }])).toEqual({ x: 9, y: 9, w: 33, h: 12 });
    // a way that goes round keeps its lap
    expect(trimPadding(area, cells, [], [true, false])).toEqual({ x: 0, y: 9, w: 50, h: 12 });
  });
});

describe('on the real disks', () => {
  const games = join(__dirname, '../../../../games');
  const load = (id: string) => {
    const d = readDisk(join(games, id, 'disk'))!;
    return {
      game: d.game,
      levels: levelsOf(d.game, { get: (n) => d.files.get(n.toLowerCase()) }, listedSecrets(id)!, listedViews(id), listedUnrolled(id), listedRoomHints(id)),
    };
  };

  it("draws Final Curtain's green room once, with its five suspects beside it, and its stage rooms apart", () => {
    const green = load('sleuth').levels.filter((l) => l.group.map === 'green.map');
    expect(green.map((l) => l.name)).toEqual(['The Green Room', 'Dawn', 'How?', 'Why?', 'The Commissioner']);
    expect(green[0].area).toEqual({ x: 0, y: 0, w: 16, h: 10 });
    expect(green[0].cast!.people).toHaveLength(5);
    expect(green[0].cast!.people.every((p) => p.visits.every((v) => v.scenes.length === 4))).toBe(true);
  });

  it('prints each room of the Teleport-A-Phone Exchange apart, its booths named by the room they reach', () => {
    const ex = load('year2000').levels.filter((l) => l.group.map === 'exchange.map');
    expect(ex).toHaveLength(6);
    expect(ex[0].marks.filter((m) => m.kind === 'exit').map((m) => m.text)).toEqual(['Florida', 'Sea', 'TV set']);
  });

  it("numbers Ohm Sweet Ohm's boards as the hint book does, each one its slot", () => {
    const boards = load('logic').levels;
    const computer = boards.find((l) => l.name === 'Board 19: The Home Computer')!;
    expect(computer.area).toEqual({ x: 2, y: 2, w: 16, h: 10 });
    expect(boards.filter((l) => l.name.startsWith('Board '))).toHaveLength(23);
  });

  it("leaves out Quest for the Round Tuit's talk map, and prints its towns apart", () => {
    const { levels } = load('realm');
    expect(levels.some((l) => l.group.map === 'pass.map')).toBe(false);
    expect(levels.filter((l) => l.group.map === 'town.map').map((l) => l.name)).toEqual(['Laterburg', 'Nowish']);
  });

  it("lays Teddy's Little Bigger Adventure's main street out hedge to hedge, its den apart", () => {
    const main = load('teddy2').levels.filter((l) => l.group.map === 'main.map');
    expect(main.map((l) => l.name)).toEqual(['Main Street', "Gwinn's Den"]);
    expect(main[0].unrolled!.loops).toEqual([false, false]);
    expect(load('teddy').levels.some((l) => l.name === 'The Dog House')).toBe(true);
  });

  it('keeps marks of every level inside its crop', () => {
    for (const id of ['sleuth', 'year2000', 'logic', 'realm', 'teddy', 'teddy2', 'risi'])
      for (const l of load(id).levels)
        for (const m of l.marks)
          expect(m.x >= l.area.x && m.y >= l.area.y && m.x + m.w <= l.area.x + l.area.w && m.y + m.h <= l.area.y + l.area.h, `${id} ${l.name}`).toBe(true);
  });
});
