// Level 14, The Test Drive (the curb set, side on). The new AM dial says "kHz", which Doc Leo
// reads as "Keeps Humming while Zooming": the radio only plays while the car moves, so off they
// go round town. THE CHEZ (the hero, sprites/chezHero.ts) drives left along the street past the
// shops; Left goes, letting go coasts, Right brakes.
//
// The signals stand at the corners, a pole two blocks high: the light's head in the row of the
// car's top block, the pole's foot in the car's own row, the stop line painted on the street
// at the pole. Both are rings of blocks on the same timings, so the head (with a bar that drains
// through each phase, a countdown) and the foot keep step; every light shares the one ring,
// each started at its own member (a ring's timers belong to its block numbers). The car touches
// the foot as its front reaches the pole: on red that's a ticket (points off; the camera clicks
// and a friendly siren boo-bees) and the pole's camera holds up a smiley card; on green it's a
// cheerful toot and points on; either way that corner is done with. Yellow does nothing. Stop
// signs count to three on their post (the foot tickets while the dots fill), then light GO.
// Nobody is ever in the street.
import { addFork, glint } from '../blocks/fork';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { AIR, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { SHOP_SIGNS, shopSign } from '../art/shopSigns';
import { MapBuilder, at, type Level } from './maps';

/** Ticks a bar of a light's countdown lasts (about a second). */
export const BAR = 18;
/** A light's ring: green, then yellow, then red, a bar each member; [phase, bars left]. */
export const LIGHT: ['g' | 'y' | 'r', number][] = [
  ['g', 5],
  ['g', 4],
  ['g', 3],
  ['g', 2],
  ['g', 1],
  ['y', 2],
  ['y', 1],
  ['r', 5],
  ['r', 4],
  ['r', 3],
  ['r', 2],
  ['r', 1],
];
/** A stop sign's ring: three dots lit one by one (ticks each), then GO. */
export const STOP_COUNT = 16;
export const STOP_GO = 20;
const STOP_RING = [1, 2, 3, 0];
/** A ticket, and a polite pass on green. */
export const FINE = -50;
export const PASS = 25;
/** The street's rows: the car's top block, the car, the street it drives on. */
export const DRIVE = { top: 7, row: 8, street: 9 } as const;

export interface Signal {
  kind: 'light' | 'stop';
  /** The pole's column (the stop line is at its right edge; the car comes from the right). */
  x: number;
  /** The ring member the light starts at. */
  start: number;
}
export interface Route {
  file: string;
  w: number;
  signals: Signal[];
  /** The first street's secret: a tuning fork in the crosswalk of a corner, a glint above it (level x). */
  fork?: number;
  /** The halfway landmark: a clock tower two blocks wide at this column (level x), above the shops. */
  tower: number;
}

const light = (x: number, start: number): Signal => ({ kind: 'light', x, start });
const stop = (x: number): Signal => ({ kind: 'stop', x, start: 0 });
/** The two drives: round the block, then down Main Street (a run of lights, then a stop sign). */
export const ROUTES: Route[] = [
  { file: 'road1', w: 94, signals: [stop(80), light(68, 9), light(57, 4), stop(46), light(35, 11), light(24, 1), light(12, 7)], fork: 55, tower: 48 },
  { file: 'road2', w: 94, signals: [light(81, 6), light(71, 10), light(61, 2), light(51, 8), stop(40), light(29, 5), light(18, 0), light(8, 9)], tower: 45 },
];
/** Where the car starts (level x) and where the street leaves the scene. */
export const startX = (r: Route) => r.w - 9;
export const EXIT_X = 1;

/** A light's phase at ring member `m`. */
export const phaseOf = (m: number) => LIGHT[m % LIGHT.length];

export const lightName = (m: number) => `light.${m}`;
export const footName = (m: number) => `foot.${m}`;
export const stopName = (m: number) => `stop.${m}`;
export const stopFootName = (m: number) => `sfoot.${m}`;

export function driveBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'curb');
  const { book, c, R } = k;
  // the sky behind a corner, one gradient a row tall
  const sky = gradient(new Pixels(20, 200, 0), 0, 0, 20, 200, R('wall'), 0, 4);
  const skyRow = (y: number) => sky.crop(0, y * 20, 20, 20);
  for (let y = 0; y < DRIVE.street; y++) book.add(`air${y}`, skyRow(y), AIR);
  // the shops: brick, a window, a cornice along the roof, a striped awning, a shop window and a door
  const brick = () => {
    const p = k.P(c('brick', 2));
    for (let y = 0; y < 20; y += 5) {
      p.rect(0, y, 20, 1, c('brick', 0));
      for (let x = (y / 5) % 2 ? 5 : 0; x < 20; x += 10) p.rect(x, y, 1, 5, c('brick', 0));
    }
    return p;
  };
  book.add('brick', brick(), AIR);
  // three windows, so a row of shops doesn't repeat one pane: a glint top left, a glint top right with a
  // paler low pane, and a shade half drawn over a glint at the bottom right
  const glass = (glints: (w: Pixels) => void) => {
    const w = brick();
    w.rect(4, 3, 12, 14, c('paint', 3)).rect(5, 4, 10, 12, c('siding', 1));
    glints(w);
    return w.rect(9, 4, 1, 12, c('paint', 3));
  };
  book.add(
    'window',
    glass((w) => w.rect(5, 4, 4, 5, c('siding', 3))),
    AIR,
  );
  book.add(
    'window2',
    glass((w) => w.rect(10, 4, 5, 5, c('siding', 3)).rect(5, 11, 4, 5, c('siding', 2))),
    AIR,
  );
  book.add(
    'window3',
    glass((w) => w.rect(5, 4, 10, 5, c('paint', 2)).rect(5, 8, 10, 1, c('paint', 1)).rect(10, 11, 5, 5, c('siding', 3))),
    AIR,
  );
  for (const [y, name] of [
    [2, 'cornice2'],
    [3, 'cornice3'],
    [4, 'cornice4'],
  ] as const) {
    const p = skyRow(y);
    p.blit(brick().crop(0, 0, 20, 14), 0, 6)
      .rect(0, 4, 20, 3, c('stone', 3))
      .rect(0, 7, 20, 1, c('stone', 1));
    book.add(name, p, AIR);
  }
  // the clock tower at the halfway point, two blocks wide: a gold spire, a belfry, the clock, a stone shaft
  const tw = (draw: (p: Pixels) => void, row: number) => {
    const p = new Pixels(40, 20, 0);
    p.blit(skyRow(row), 0, 0).blit(skyRow(row), 20, 0);
    draw(p);
    return [p.crop(0, 0, 20, 20), p.crop(20, 0, 20, 20)];
  };
  const stone = (p: Pixels, y: number, h: number) => p.rect(6, y, 28, h, c('stone', 2)).rect(6, y, 2, h, c('stone', 3)).rect(32, y, 2, h, c('stone', 1));
  const parts = [
    tw((p) => {
      for (let i = 0; i < 16; i++) p.rect(20 - Math.ceil(i / 1.6), 4 + i, Math.ceil(i / 1.6) * 2, 1, c('gold', 2));
      p.rect(19, 0, 2, 5, c('gold', 3)).rect(21, 0, 4, 2, c('red', 2));
    }, 0),
    tw((p) => {
      stone(p, 0, 20);
      p.rect(16, 4, 8, 14, c('ink', 1)).rect(17, 5, 6, 12, c('siding', 1));
    }, 1),
    tw((p) => {
      stone(p, 0, 20);
      p.disc(20, 10, 9, c('stone', 3)).disc(20, 10, 8, c('paint', 3)).ring(20, 10, 8, c('ink', 0));
      for (const [dx, dy] of [
        [0, -6],
        [6, 0],
        [0, 6],
        [-6, 0],
      ])
        p.rect(20 + dx - 1, 10 + dy - 1, 2, 2, c('ink', 0));
      p.line(20, 10, 20, 5, c('ink', 0)).line(20, 10, 24, 12, c('ink', 0));
    }, 2),
    tw((p) => stone(p, 0, 20), 3),
  ];
  parts.forEach(([l, r], i) => {
    book.add(`tower${i}.l`, l, AIR);
    book.add(`tower${i}.r`, r, AIR);
  });
  // where the tower meets the shops: the cornice with the stone shaft carried down through its sky rows to the ledge
  const base = new Pixels(40, 20, 0);
  for (const x of [0, 20]) base.blit(skyRow(4), x, 0).blit(brick().crop(0, 0, 20, 14), x, 6);
  base.rect(0, 4, 40, 3, c('stone', 3)).rect(0, 7, 40, 1, c('stone', 1));
  stone(base, 0, 4);
  book.add('towerbase.l', base.crop(0, 0, 20, 20), AIR);
  book.add('towerbase.r', base.crop(20, 0, 20, 20), AIR);
  const awning = brick();
  for (let x = 0; x < 20; x += 6) awning.rect(x, 0, 3, 12, c('accent', 2)).rect(x + 3, 0, 3, 12, c('paint', 3));
  for (let x = 0; x < 20; x += 3) awning.rect(x, 12, 2, 2, c('accent', 1));
  book.add('awning', awning, AIR);
  const shop = brick();
  shop.rect(1, 0, 18, 20, c('stone', 1)).rect(2, 1, 16, 15, c('siding', 2)).rect(3, 2, 6, 6, c('siding', 3)).rect(1, 16, 18, 4, c('stone', 2));
  book.add('shop', shop, AIR);
  const door = brick();
  door.rect(5, 2, 10, 18, c('wood', 1)).rect(7, 4, 6, 7, c('siding', 2)).set(13, 13, c('gold', 2));
  book.add('door', door, AIR);
  for (const sign of SHOP_SIGNS) book.add(`sign.${sign}`, shopSign(k, sign), AIR);
  // the street: asphalt, the curb's lip along the far side, and the stop line seen edge on
  const street = k.pic('street');
  street.rect(0, 0, 20, 1, c('shade', 4));
  book.add('road', street, { solid: SOLID });
  // the street patched in places, and a vent low in the brick
  book.add('road.patch', k.pic('road').rect(4, 5, 11, 7, c('shade', 0)).rect(5, 6, 9, 5, c('shade', 1)), { solid: SOLID });
  const vent = brick();
  vent.rect(5, 6, 10, 8, c('ink', 1));
  for (let y = 7; y < 14; y += 2) vent.rect(6, y, 8, 1, c('metal', 2));
  book.add('brick.vent', vent, AIR);
  const line = k.pic('road');
  line.rect(0, 0, 4, 2, c('paint', 3)).rect(0, 2, 4, 1, c('paint', 1));
  book.add('stopline', line, { solid: SOLID });
  // the cross street at a corner: its far curb and a manhole cover, seen beyond
  const cross = skyRow(DRIVE.row);
  cross.rect(0, 12, 20, 8, c('shade', 1)).rect(0, 12, 20, 1, c('stone', 3)).rect(6, 17, 8, 1, c('shade', 3));
  book.add('cross', cross, AIR);

  // the pole: steel, with a little foot plate
  const pole = (p: Pixels) => p.rect(9, 0, 2, 20, c('metal', 2)).rect(9, 0, 1, 20, c('metal', 4)).rect(7, 17, 6, 3, c('metal', 1));
  const footPic = () => pole(k.pic('cross'));
  // the light's head: three lamps in a black housing with visors, and the countdown bar beside it
  const LAMP = { r: 'red', y: 'yellow', g: 'green' } as const;
  const lit = (ramp: string) => c(ramp, ramp === 'green' ? 2 : 3);
  const head = (phase: 'r' | 'y' | 'g', bars: number) => {
    const p = skyRow(DRIVE.top);
    p.rect(9, 18, 2, 2, c('metal', 2));
    p.rect(4, 0, 9, 19, c('ink', 0)).frame(4, 0, 9, 19, c('ink', 1));
    (['r', 'y', 'g'] as const).forEach((l, i) => {
      const y = 3 + i * 6;
      const on = l === phase;
      p.disc(8.5, y, 2.4, on ? lit(LAMP[l]) : c('ink', 1));
      if (on) p.set(8, y - 1, c('paint', 3));
      p.rect(5, y - 3, 7, 1, c('ink', 1));
    });
    // the countdown: a bar of `bars` notches in the lit lamp's color, draining
    p.rect(14, 1, 4, 17, c('ink', 0));
    for (let b = 0; b < bars; b++) p.rect(15, 15 - b * 3, 2, 2, lit(LAMP[phase]));
    return p;
  };
  LIGHT.forEach(([phase, bars], m) => {
    const next = (m + 1) % LIGHT.length;
    book.add(lightName(m), head(phase, bars), { ...AIR, ntime: BAR, next: lightName(next) });
    const kind = phase === 'r' ? { score: FINE, touch: 'ticket' } : phase === 'g' ? { score: PASS, touch: 'passed' } : {};
    book.add(footName(m), footPic(), { ...AIR, ...kind, ntime: BAR, next: footName(next) });
  });
  // a corner done with: the pole as it was; or, ticketed, its camera holding up a smiley card
  book.add('passed', footPic(), AIR);
  const ticket = footPic();
  ticket.rect(11, 1, 6, 4, c('metal', 1)).disc(16, 3, 1.2, c('paint', 3)).rect(12, 0, 2, 1, c('metal', 3));
  ticket.disc(4.5, 5, 4, c('yellow', 3)).set(3, 4, c('ink', 0)).set(6, 4, c('ink', 0)).rect(3, 7, 4, 1, c('ink', 0));
  ticket.rect(4, 9, 1, 6, c('wood', 2));
  book.add('ticket', ticket, AIR);

  // the stop sign: a red octagon lettered STOP (a 3x5 letter each), and three dots below it that count to three
  const GLYPHS = ['111100111001111', '111010010010010', '111101101101111', '111101111100100'];
  STOP_RING.forEach((dots, m) => {
    const p = skyRow(DRIVE.top);
    p.rect(9, 12, 2, 8, c('metal', 2));
    for (let y = 0; y < 13; y++) {
      const inset = Math.max(0, 3 - y, y - 9);
      p.rect(2 + inset, y, 16 - inset * 2, 1, c('red', 2));
    }
    GLYPHS.forEach((g, i) => [...g].forEach((b, j) => b === '1' && p.set(3 + i * 4 + (j % 3), 4 + Math.floor(j / 3), c('paint', 3))));
    const go = dots === 0;
    for (let d = 0; d < 3; d++) {
      const on = go || d < dots;
      p.disc(4 + d * 6, 16, 1.6, on ? (go ? c('green', 2) : c('yellow', 3)) : c('ink', 1));
    }
    const next = (m + 1) % STOP_RING.length;
    book.add(stopName(m), p, { ...AIR, ntime: go ? STOP_GO : STOP_COUNT, next: stopName(next) });
    book.add(stopFootName(m), footPic(), {
      ...AIR,
      ...(go ? { score: PASS, touch: 'passed' } : { score: FINE, touch: 'ticket' }),
      ntime: go ? STOP_GO : STOP_COUNT,
      next: stopFootName(next),
    });
  });
  addFork(k, 'cross');
  glint(k, 'air6');
  return k;
}

/** Which of the three windows a cell gets: mixed along the street and up each shop, never the same all the way down a column. */
const windowAt = (x: number, y: number): string => ['window', 'window2', 'window3'][(Math.floor(x / 3) * 2 + y) % 3];

/** One of the drives: the street, the shops along it, a corner at every signal. */
export const drive = (r: Route) =>
  function drive(book: Kit['book']): Level {
    const { w } = r;
    const { top, row, street } = DRIVE;
    const m = new MapBuilder(book, {}, 'curb');
    for (let y = 0; y < street; y++) m.fill(0, y, w, 1, `air${y}`);
    m.fill(0, street, w, 1, 'road');
    // the shops between the corners: a cornice at its own height, windows, an awning, the shop front
    const corners = new Set(r.signals.flatMap((s) => [s.x - 3, s.x - 2, s.x - 1, s.x]));
    for (let x = 0; x < w; x++) {
      if (corners.has(x)) {
        if (x !== r.signals.find((s) => s.x === x)?.x) m.set(x, row, 'cross');
        continue;
      }
      const roof = 2 + ((Math.floor(x / 6) * 5) % 3);
      const tx = x - r.tower;
      if (tx === 0 || tx === 1) {
        // the clock tower rises over the shops (a spire in the sky rows above the shops' wall)
        for (let y = 0; y < 4; y++) m.set(x, y, `tower${y}.${tx ? 'r' : 'l'}`);
        for (let y = 4; y < top - 1; y++) m.set(x, y, y === 4 ? `towerbase.${tx ? 'r' : 'l'}` : x % 3 === 1 ? windowAt(x, y) : 'brick');
        m.set(x, top - 1, 'brick')
          .set(x, top, 'awning')
          .set(x, row, 'shop');
        continue;
      }
      m.set(x, roof, `cornice${roof}`);
      for (let y = roof + 1; y < top - 1; y++) m.set(x, y, x % 3 === 1 ? windowAt(x, y) : 'brick');
      // every other shop hangs out its sign over the awning (what it sells, in pictures)
      const sign = x % 12 === 3 ? SHOP_SIGNS[(Math.floor(x / 12) + w) % SHOP_SIGNS.length] : undefined;
      m.set(x, top - 1, sign ? `sign.${sign}` : x % 3 === 1 ? windowAt(x, top - 1) : 'brick');
      m.set(x, top, 'awning');
      m.set(x, row, x % 6 === 2 ? 'door' : 'shop');
    }
    for (const s of r.signals) {
      m.set(s.x, top, s.kind === 'light' ? lightName(s.start) : stopName(0));
      m.set(s.x, row, s.kind === 'light' ? footName(s.start) : stopFootName(0));
      m.set(s.x + 1, street, 'stopline');
    }
    if (r.fork !== undefined) m.set(r.fork, row, 'fork').set(r.fork, row - 2, 'air6.glint');
    m.link(EXIT_X, row);
    // variants here and there so the walls and floors don't repeat
    m.vary('brick', ['brick.vent'], 17).vary('road', ['road.patch'], 13);
    return { m, start: at(startX(r), 5), size: [w, 10] };
  };
