// The dream run's background blocks. The screen never scrolls: the sky and the ground stay
// still, and three bands between them slide left, each at its own speed, so the world seems
// to run past Teddy. Each band is one row of one block, and that block is a ring of pictures
// of the same band, each shifted a few pixels left of the one before. Every copy of a block
// shares one clock (PLAYGAME's changeblks), so the whole row slides together, and every band
// repeats every 20 pixels, so the ring comes back round with no seam:
//   far hills  2 px every 4 ticks (10 pictures), the town 2 px every 2 ticks (10 pictures),
//   the picket fence by the path 4 px every tick (5 pictures).
// The ground is drawn in level stripes, which look the same moving or still. Up in the sky,
// twelve paw prints fill in one by one as the run goes on; when the last one fills, the path
// turns into a look-alike that carries Teddy to the right, where a finish flag pops up over a
// hole into the end of the dream (the scene's link). The two cells off the right edge that
// give birth to what comes along the path are chains of look-alikes, one block for each thing
// (dream.ts lays out the map and the timetable).
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, cloud, copy, picket, r, sky } from '../blocks/tiles';

/** The view's top-left block (the scene never scrolls), Teddy's row and the ground's. */
export const VIEW = { x: 12, y: 35 };
export const LANE = VIEW.y + 5;
export const G = LANE + 1;
/** The cells off the right edge where things are born: on the path, and a block above it. */
export const SPAWN = VIEW.x + 16;
/** The right-hand column of the view: the finish flag, and the hole under it (the link). */
export const EDGE = VIEW.x + 15;
/** The paw-print meter: twelve prints along the top row, one a step. */
export const PRINTS = 12;
export const PRINT_TICKS = 90;
/** When the run ends: the last print fills, and the path carries Teddy to the finish. */
export const END = PRINTS * PRINT_TICKS;

/** A band: its row, how far each picture shifts it and how long each shows. */
export interface Band {
  row: number;
  shift: number;
  ticks: number;
}
export const HILLS: Band = { row: VIEW.y + 2, shift: 2, ticks: 4 };
export const TOWN: Band = { row: VIEW.y + 3, shift: 2, ticks: 2 };
export const FENCE: Band = { row: VIEW.y + 4, shift: 4, ticks: 1 };
/** Pixels a tick each band moves (the things on the path move with the fence). */
export const speed = (b: Band) => b.shift / b.ticks;

/** Picture k of a ring: `layer` moved k * shift pixels left (wrapping) over a still `back`. */
function shifted(back: Pixels, layer: Pixels, dx: number): Pixels {
  const p = copy(back);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const v = layer.get((x + dx) % 20, y);
      if (v !== CLEAR) p.set(x, y, v);
    }
  return p;
}

/** Adds a band's ring (`${name}0`, `${name}1`, ...); the map uses `${name}0`. */
function ring(t: Tiles, name: string, b: Band, back: Pixels, layer: Pixels): void {
  const n = 20 / b.shift;
  if (!Number.isInteger(n)) throw new Error(`dream: a ${b.shift} px step never comes back round in 20 px`);
  for (let k = 0; k < n; k++) t.air(`${name}${k}`, shifted(back, layer, k * b.shift), { next: `${name}${(k + 1) % n}`, ntime: b.ticks });
}

const wave = (x: number, mid: number, amp: number, at: number) => mid - amp * Math.cos((2 * Math.PI * (x - at)) / 20);

/** The far hills: a hazy hill behind, a nearer one with a little tree, over the evening sky. */
function hills(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  for (let x = 0; x < 20; x++) {
    const back = Math.round(wave(x, 8, 4, 4));
    const front = Math.round(wave(x, 13, 3, 14));
    for (let y = back; y < 20; y++) p.set(x, y, y === back ? c('leaf', 3) : c('leaf', 2));
    for (let y = front; y < 20; y++) p.set(x, y, y === front ? c('grass', 2) : c('grass', 1));
  }
  p.rect(14, 7, 1, 4, c('wood', 1));
  blob(p, 14.5, 6, 2.2, 2.4, r('leaf'), 0, 2);
  return p;
}

/** The town: a little house with a lit window and a round tree, on the hillside. */
function town(): Pixels {
  const p = new Pixels(20, 20, c('grass', 1));
  for (let y = 4; y < 9; y++) p.rect(7 - (y - 4), y, 1 + 2 * (y - 4), 1, c('roof', y === 4 ? 3 : 2));
  p.rect(3, 9, 9, 8, c('siding', 2)).rect(3, 9, 9, 1, c('siding', 1));
  p.rect(9, 3, 2, 3, c('brick', 2));
  p.rect(5, 11, 2, 2, c('glow', 2)).rect(9, 12, 2, 5, c('wood', 1));
  p.rect(16, 13, 1, 4, c('wood', 1));
  blob(p, 16.5, 11, 2.6, 3, r('leaf'), 1, 3);
  p.rect(0, 17, 20, 3, c('grass', 2));
  return p;
}

/** The paw print: four toes over a pad, 7x6, filled or only outlined. */
function paw(full: boolean): Pixels {
  const ink = full ? c('glow', 3) : c('sky', 2);
  const p = sky(0);
  const rows = ['.o.o.o.', 'o.....o', '..ooo..', '.ooooo.', '.ooooo.', '..ooo..'];
  p.draw(7, 7, rows, { o: ink });
  return p;
}

/** The meter's ends: the moon and its Z (the dream), and the finish flag. */
const moonCap = () => {
  const p = sky(0);
  p.disc(8, 10, 4, c('glow', 3)).disc(10, 9, 3, c('sky', 0));
  p.draw(13, 4, ['ooo', '..o', '.o.', 'ooo'], { o: c('paint', 3) });
  return p;
};
const flagCap = () => {
  const p = sky(0);
  p.rect(6, 4, 1, 12, c('paint', 3));
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) p.rect(7 + x * 2, 4 + y * 2, 2, 2, (x + y) % 2 ? c('ink', 0) : c('paint', 3));
  return p;
};

/** Teddy's path, in level stripes: grass behind, then the dirt path he runs on. */
function lane(): Pixels {
  const p = new Pixels(20, 20, c('grass', 3));
  p.rect(0, 0, 20, 2, c('grass', 1)).rect(0, 10, 20, 2, c('grass', 2));
  p.rect(0, 12, 20, 8, c('dirt', 4)).rect(0, 15, 20, 1, c('dirt', 3));
  return p;
}

/** The path's near edge and a stone curb: solid to stand on. */
function curb(): Pixels {
  const p = new Pixels(20, 20, c('grass', 2));
  p.rect(0, 0, 20, 5, c('dirt', 3)).rect(0, 5, 20, 1, c('dirt', 2));
  p.rect(0, 6, 20, 3, c('stone', 3)).rect(0, 9, 20, 1, c('stone', 1));
  p.rect(0, 14, 20, 1, c('grass', 1));
  return p;
}

/** Deeper lawn under the curb, in stripes. */
function lawn(k: number): Pixels {
  const p = new Pixels(20, 20, c('grass', k ? 1 : 2));
  p.rect(0, 6, 20, 1, c('grass', k ? 0 : 1)).rect(0, 15, 20, 1, c('grass', k ? 0 : 1));
  return p;
}

/**
 * The finish flag that pops up at the right edge at the end, over the path. PLAYGAME crops the
 * last 8 pixels off the right of the screen while playing, so it is all in the left 12.
 */
function finish(): Pixels {
  const p = lane();
  p.rect(1, 0, 2, 20, c('paint', 3)).rect(2, 0, 1, 20, c('paint', 1));
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) p.rect(3 + x * 2, 1 + y * 2, 2, 2, (x + y) % 2 ? c('ink', 0) : c('paint', 3));
  return p;
}

/** The hole at the end of the dream: dark, with a few stars twinkling in it. */
function hole(): Pixels {
  const p = curb();
  p.rect(0, 0, 20, 20, c('purple', 0)).rect(1, 0, 19, 20, c('ink', 0));
  for (const [x, y] of [
    [4, 4],
    [9, 8],
    [6, 13],
    [15, 16],
  ])
    p.set(x, y, c('glow', 3));
  return p;
}

/** The sun going down behind the hills, two blocks wide (still: it is far away). */
function sun(part: number): Pixels {
  const big = new Pixels(40, 20);
  big.blit(sky(1), 0, 0).blit(sky(1), 20, 0);
  big.disc(20, 22, 9, c('orange', 3)).disc(20, 22, 7, c('glow', 3));
  return big.crop(part * 20, 0, 20, 20);
}

export function dreamTiles(): Tiles {
  const t = new Tiles();
  t.air('sky0', sky(0));
  t.air('sky1', sky(1));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 23));
  t.air('sunL', sun(0));
  t.air('sunR', sun(1));
  ring(t, 'hills', HILLS, sky(2), hills());
  ring(t, 'town', TOWN, new Pixels(20, 20, CLEAR), town());
  ring(t, 'fence', FENCE, new Pixels(20, 20, CLEAR), picket(new Pixels(20, 20, c('grass', 2)), true));
  // the meter: print k fills at (k + 1) steps
  t.air('pawFull', paw(true));
  for (let k = 0; k < PRINTS; k++) t.air(`paw_${k}`, paw(false), { next: 'pawFull', ntime: (k + 1) * PRINT_TICKS });
  t.air('moonCap', moonCap());
  t.air('flagCap', flagCap());
  // the path, and the look-alike it turns into at the end (pulls right)
  t.air('laneGo', lane(), { grav: GRAV.right | GRAV.down });
  t.air('lane', lane(), { next: 'laneGo', ntime: END });
  t.air('finish', finish());
  t.air('laneEnd', lane(), { next: 'finish', ntime: END });
  t.wall('curb', curb());
  t.air('hole', hole());
  t.wall('edge', curb(), { next: 'hole', ntime: END });
  t.wall('lawn0', lawn(0));
  t.wall('lawn1', lawn(1));
  return t;
}

/**
 * A spawn cell's chain: a look-alike of `pic` shown first, then one block for each thing
 * ([tick, monster]), shown until the next, and a last one, from `done` on, that gives birth to
 * nothing. Block k starts at tick s and gives birth every s + 1 ticks from the scene's start,
 * so its first birth is on its first tick, and it shows for less than s + 1 ticks, so that is
 * its only one.
 */
export function spawnChain(t: Tiles, name: string, pic: Pixels, list: [number, number][], done: number): void {
  const at = [...list.map(([s]) => s), done];
  list.forEach(([s, mon], k) => {
    const n = at[k + 1] - s;
    if (n <= 0) throw new Error(`dream: ${name} out of order at ${s}`);
    if (n > s) throw new Error(`dream: ${name} at ${s} would give birth twice`);
    t.air(`${name}${k}`, copy(pic), { birthMon: mon, birthTime: s + 1, next: k + 1 < list.length ? `${name}${k + 1}` : `${name}Done`, ntime: n });
  });
  t.air(`${name}Wait`, copy(pic), { next: `${name}0`, ntime: at[0] });
  t.air(`${name}Done`, copy(pic));
}
