// Level 14, The Beltway: THE CHEZ's driver's seat on the ring road at a blazing 25 MPH. The
// screen never scrolls. The seat is painted whole (art/cab.ts) and cut into blocks, cells that
// come out alike sharing one; then the tricks, all plain block timers:
//  - the far skyline (row 2) and the roadside trees (row 3's shoulders) are rings that shift their
//    strip left a few pixels a frame (as the swim's layers do): the skyline slowly, the trees fast;
//    Teddy's door window has the roadside racing right in five-pixel steps (art/cabInterior.ts DOOR);
//  - the speedometer's needle is pinned at 25, the 8-track's PLAY lamp blinks, Teddy pants, and the
//    trip meter counts the miles to the exit down;
//  - the lane strip (row 5): the driver walks it (sprites/driver.ts), its air pulling down onto the
//    control row (row 6). Each lane's control block is a chain on the traffic's timetable: plain,
//    then for WINDOW ticks as a car comes alongside on that lane, a danger block whose touch honks
//    (score down) and makes the cell that event's honked block, which waits the window out and then
//    rejoins the lane's chain (its first timer is the window's end, counted from the scene's start);
//  - at FLIP_AT the strip's block turns into its flipped block, whose air pulls right; the gate
//    opens, the chevrons light and the EXIT lamp opens onto the link;
//  - the rear-view mirror's glass is a spawner chain per lane (one block per car, each giving birth
//    once: kit/road3d.ts spawnChains), so a car's glint is born right where it shows; off the right
//    edge, the dashes' and posts' spawners give birth forever.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { spawnChains } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';
import { DOOR } from '../art/cabInterior';
import { chevrons, exitLamp, gauge, laneIcon, paintCab, playPic, skylineTile, teddyPant, treeTile, tripPic, GAUGE } from '../art/cab';
import type { Pal } from '../art/palette';
import { BELTMON } from '../beltMonsters';
import { GRAV, SOLID, kit, type Kit } from '../blocks/common';
import { CARS, DASH_EVERY, FLIP_AT, GLINT, KINDS, MILE, MILES, MIRROR, POST_EVERY, SIGN_AT, SPAWN, STRIP, WINDOW } from './beltwayPlan';
import { MapBuilder, at, type Level } from './maps';

const W = 16;
const H = 10;
/** Points a honk costs. */
export const HONK = -25;
/** The 8-track's PLAY lamp: ticks lit, ticks dark (about a beat of the song). */
const PLAY_BLINK = [6, 3];
/** The skyline's strip: pixels a frame and ticks a frame; the trees'. */
const SKYLINE = { shift: 5, ntime: 12 } as const;
const TREES = { shift: 5, ntime: 3 } as const;
/** Row 3's shoulder cells where the trees go by. */
const TREE_COLS = [2, 3, 4, 5, 10, 11];

/** Each lane's cars, by when they come alongside. */
export const laneCars = (lane: number) => CARS.filter(([, l]) => l === lane).map(([t]) => t);
/** The control cell's block names for lane `lane`: before car i, the danger, the honked one. */
export const ctlName = (lane: number, kind: 's' | 'd' | 'x', i: number) => `ctl${lane + 1}.${kind}${i}`;

/** What each screen cell is when it isn't a plain cut of the painting. */
type Special = (x: number, y: number) => string | undefined;

export function beltwayBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book } = k;
  const still = paintCab(k);
  const panting = paintCab(k);
  teddyPant(k, panting);
  const cell = (p: Pixels, x: number, y: number) => p.crop(x * 20, y * 20, 20, 20);
  // a strip moving left `shift` pixels a frame: a ring per column of the tile
  const stream = (name: string, tile: Pixels, shift: number, ntime: number) => {
    const n = tile.w / 20;
    const frames = tile.w / shift;
    const wide = new Pixels(tile.w * 2, 20).blit(tile, 0, 0).blit(tile, tile.w, 0);
    for (let j = 0; j < n; j++)
      for (let f = 0; f < frames; f++)
        book.add(`${name}${j}.${f}`, wide.crop((j * 20 + f * shift) % tile.w, 0, 20, 20), { ntime, next: `${name}${j}.${(f + 1) % frames}` });
  };
  stream('skyline', skylineTile(k), SKYLINE.shift, SKYLINE.ntime);
  stream('trees', treeTile(k), TREES.shift, TREES.ntime);
  // the door window's roadside racing right: each racing cell a ring of DOOR.phases, alike frames sharing a block
  const doorFrames = Array.from({ length: DOOR.phases }, (_, f) => paintCab(k, f * DOOR.step));
  const doorSeen = new Map<string, string>();
  const doorHead = new Map<string, string>();
  DOOR.cells.forEach(([x, y]) => {
    const names = doorFrames.map((fr, f) => {
      const p = cell(fr, x, y);
      const key = `${f}:${Buffer.from(p.px).toString('base64')}`;
      if (!doorSeen.has(key)) doorSeen.set(key, `door${x}.${y}.${f}`);
      return doorSeen.get(key)!;
    });
    doorHead.set(`${x},${y}`, names[0]);
    names.forEach((n, f) => {
      if (n === `door${x}.${y}.${f}`) book.add(n, cell(doorFrames[f], x, y), { ntime: 1, next: `door${x}.${y}.${(f + 1) % DOOR.phases}` });
    });
  });
  // the instruments
  book.add('speedo', gauge(k, 0.5, 'MPH'));
  for (let m = MILES; m >= 0; m--) book.add(`trip${m}`, tripPic(k, m), m ? { ntime: MILE, next: `trip${m - 1}` } : {});
  book.add('play0', playPic(k, true), { ntime: PLAY_BLINK[0], next: 'play1' });
  book.add('play1', playPic(k, false), { ntime: PLAY_BLINK[1], next: 'play0' });
  // Teddy pants now and then: only the cells his tongue changes are a ring
  const pantCells: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 13; x < W; x++) if (cell(still, x, y).px.some((v, i) => v !== cell(panting, x, y).px[i])) pantCells.push([x, y]);
  pantCells.forEach(([x, y]) => {
    book.add(`teddy${x}.${y}.0`, cell(still, x, y), { ntime: 40, next: `teddy${x}.${y}.1` });
    book.add(`teddy${x}.${y}.1`, cell(panting, x, y), { ntime: 24, next: `teddy${x}.${y}.0` });
  });
  // the lane strip: all its lanes one block, pulling down onto the controls till the flip, then right
  const strip = cell(still, STRIP.lanes[1], STRIP.row);
  book.add('strip', strip, { grav: GRAV.down, ntime: FLIP_AT, next: 'strip.flip' });
  book.add('strip.flip', strip, { grav: GRAV.right });
  book.add('cap', cell(still, STRIP.capL, STRIP.row), { solid: SOLID });
  const lit = (draw: (p: Pixels) => void, x: number) => {
    const p = cell(still, x, STRIP.row);
    draw(p);
    return p;
  };
  const back = (x: number) => lit((p) => p.rect(2, 7, 16, 10, k.c('shade', 1)), x);
  book.add('gate', cell(still, STRIP.gate, STRIP.row), { solid: SOLID, ntime: FLIP_AT, next: 'gate.open' });
  book.add('gate.open', back(STRIP.gate), { grav: GRAV.right });
  book.add('run', cell(still, STRIP.run, STRIP.row), { grav: GRAV.right, ntime: FLIP_AT, next: 'run.lit' });
  book.add(
    'run.lit',
    lit((p) => chevrons(k, p, 0, 0, true), STRIP.run),
    { grav: GRAV.right },
  );
  book.add('exit', cell(still, STRIP.exit, STRIP.row), { solid: SOLID, ntime: FLIP_AT, next: 'exit.open' });
  book.add(
    'exit.open',
    lit((p) => exitLamp(k, p, 0, 0, true), STRIP.exit),
    { grav: GRAV.right },
  );
  // the control row: a chain per lane on its cars' timetable
  for (const lane of [-1, 0, 1]) {
    const x = STRIP.lanes[lane + 1];
    const plain = cell(still, x, STRIP.control);
    const honk = new Pixels(20, 20).blit(plain, 0, 0);
    laneIcon(k, honk, 0, 0, lane, true);
    const times = laneCars(lane);
    let from = 0;
    times.forEach((t, i) => {
      const [a, b] = [t - WINDOW / 2, t + WINDOW / 2];
      book.add(ctlName(lane, 's', i), plain, { solid: SOLID, ntime: a - from, next: ctlName(lane, 'd', i) });
      book.add(ctlName(lane, 'd', i), plain, { solid: SOLID, ntime: WINDOW, next: ctlName(lane, 's', i + 1), touch: ctlName(lane, 'x', i), score: HONK });
      book.add(ctlName(lane, 'x', i), honk, { solid: SOLID, ntime: b, next: ctlName(lane, 's', i + 1) });
      from = b;
    });
    book.add(ctlName(lane, 's', times.length), plain, { solid: SOLID });
  }
  // the mirror's glass, a chain per lane: each car's glint is born in its lane's cell GLINT ticks
  // before it comes alongside (and the EXIT sign, last, in the middle lane's)
  for (const chain of mirrorChains()) {
    const glass = cell(still, MIRROR.cols[chain.lane + 1], MIRROR.row);
    for (const b of chain.blocks) book.add(b.name, glass, { birthMon: b.kind, birthTime: b.birthTime, next: b.next, ntime: b.ntime });
    book.add(chain.end, glass);
  }
  // off the right edge: the dashes' and the posts' spawners
  const blank = new Pixels(20, 20, k.c('shade', 0));
  [-1, 1].forEach((side, i) => {
    book.add(`dashSpawn${i}`, blank, { birthMon: BELTMON.dash(side), birthTime: DASH_EVERY });
    book.add(`postSpawn${i}`, blank, { birthMon: BELTMON.post(side), birthTime: POST_EVERY });
  });
  // every other cell: a plain cut of the painting, alike cells sharing a block
  const special = specials(pantCells, doorHead);
  const seen = new Map<string, string>();
  const cells = new Map<string, string>();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ring = special(x, y);
      if (ring) {
        cells.set(`${x},${y}`, ring);
        continue;
      }
      const p = cell(still, x, y);
      const solid = y >= STRIP.control && x >= STRIP.capL && x <= STRIP.exit;
      const key = `${solid}:${Buffer.from(p.px).toString('base64')}`;
      if (!seen.has(key)) {
        seen.set(key, `cab${x}.${y}`);
        book.add(`cab${x}.${y}`, p, solid ? { solid: SOLID } : {});
      }
      cells.set(`${x},${y}`, seen.get(key)!);
    }
  LAYOUT.set(book, cells);
  return k;
}

/** Each book's screen: the block every cell starts as (beltwayBlocks lays it out, beltway maps it). */
const LAYOUT = new WeakMap<Kit['book'], Map<string, string>>();

/** The mirror's spawner chains (kit/road3d.ts), one per lane. */
const mirrorChains = () =>
  spawnChains(
    [...CARS.map(([t, lane], i) => [t - GLINT, lane, BELTMON.mirror(lane, KINDS[i])] as const), [SIGN_AT, 0, BELTMON.exit(0)] as const],
    [-1, 0, 1],
    'mirror',
  );

/** The cells that are rings or chains, and their first block. */
function specials(pantCells: [number, number][], doorHead: Map<string, string>): Special {
  const chains = mirrorChains();
  return (x, y) => {
    if (y === MIRROR.row && (MIRROR.cols as readonly number[]).includes(x)) return chains[x - MIRROR.cols[0]].first;
    if (y === 2 && x >= 2 && x <= 11) return 'skyline0.0';
    if (y === 3 && TREE_COLS.includes(x)) return 'trees0.0';
    if (doorHead.has(`${x},${y}`)) return doorHead.get(`${x},${y}`);
    if (x === GAUGE.speedo[0] && y === GAUGE.speedo[1]) return 'speedo';
    if (x === GAUGE.trip[0] && y === GAUGE.trip[1]) return `trip${MILES}`;
    if (x === GAUGE.play[0] && y === GAUGE.play[1]) return 'play0';
    if (pantCells.some(([px, py]) => px === x && py === y)) return `teddy${x}.${y}.0`;
    if (y === STRIP.row) {
      if ((STRIP.lanes as readonly number[]).includes(x)) return 'strip';
      if (x === STRIP.capL) return 'cap';
      if (x === STRIP.gate) return 'gate';
      if (x === STRIP.run) return 'run';
      if (x === STRIP.exit) return 'exit';
    }
    if (y === STRIP.control && (STRIP.lanes as readonly number[]).includes(x)) return ctlName(x - 8, 's', 0);
    return undefined;
  };
}

export function beltway(book: Kit['book']): Level {
  const cells = LAYOUT.get(book);
  if (!cells) throw new Error('beltway: lay out its blocks first');
  // outside the screen: the plain dash under the exit run (solid, never seen)
  const m = new MapBuilder(book, {}, cells.get(`${STRIP.run},${STRIP.control}`)!);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) m.set(x, y, cells.get(`${x},${y}`)!);
  [-1, 1].forEach((_, i) => {
    m.set(SPAWN.dashes[i], SPAWN.row, `dashSpawn${i}`);
    m.set(SPAWN.posts[i], SPAWN.row, `postSpawn${i}`);
  });
  m.link(STRIP.exit, STRIP.row);
  return { m, start: at(8, STRIP.row), size: [W, H] };
}
