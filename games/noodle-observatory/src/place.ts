// A level's map, painted from a PLAN: the things you meet from left to right, in the order Nell does them. The same
// plan draws the map (here) and gives the bot its orders (tools/route.ts walks it), so the two cannot drift apart.
//
// Every room is enclosed: a ceiling (or, on the roof, open night sky), solid walls at both ends, a floor at row G
// and solid ground below it. Outside the room the world is solid wall or night sky, never an invisible wall.
//   sign     a board on two posts, to read             washer   a star washer to pick up (10 points)
//   pocket   a ladder up to a shelf, a part (or a washer) on it, and back down by the ladder or off the shelf's end
//   gate     a full-height wall with a padded socket at the bottom: it takes one part from its counter, then
//            shows the part fitted and lets Nell through
//   pad      a marked pad on the floor: stepping on it sets a shutter (adds to a counter) and leaves a stamp
//   pit      a gap in the floor with a soft cushion one row down: hop it (a slip is only a hop back out)
//   lamp     a hanging lamp in a painted pool of light (lights-out)   window   a 2x2 window on the dusk
import { MLEN, newMap, reindexMonsters, type GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import type { Book } from '../../kit/starter/book';
import type { Sign } from '../../kit/starter/sign';
import type { Icon } from './art';

/** The floor's row in every room built from a plan. */
export const G = 10;

export interface Exit {
  from: [number, number];
}

/** A map whose top-left block sits at (ORIGIN, ORIGIN) in the 100x100 world. */
export class Place {
  readonly map: GameMap = newMap();
  start: [number, number] = [0, 0];
  readonly exits: Exit[] = [];
  private monsters = 0;

  constructor(
    readonly book: Book,
    readonly width: number,
    readonly height: number,
    /** What fills the world outside the room: above it, and below/beside it. */
    outsideTop: string,
    outsideRest: string,
  ) {
    const top = book.n(outsideTop);
    const rest = book.n(outsideRest);
    for (let y = 0; y < MLEN; y++) for (let x = 0; x < MLEN; x++) this.map.blocks[y * MLEN + x] = y < ORIGIN ? top : rest;
  }

  set(x: number, y: number, name: string): this {
    this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN] = this.book.n(name);
    return this;
  }

  get(x: number, y: number): number {
    return this.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN];
  }

  /** A monster standing on level block (x, y). */
  mon(monnum: number, x: number, y: number): this {
    if (this.monsters >= 200) throw new Error('Too many monsters');
    this.map.monsters[this.monsters++] = { monnum, status: 0, xtra: 0, curx: x + ORIGIN, cury: y + ORIGIN, extra: 0 };
    return this;
  }

  /** A sign with its board's top-left block at (x, y), its posts below. */
  sign(x: number, y: number, s: Sign): this {
    s.board.forEach((row, dy) => row.forEach((name, dx) => this.set(x + dx, y + dy, name)));
    const below = y + s.board.length;
    this.set(x, below, s.legs[0]).set(x + s.board[0].length - 1, below, s.legs[1]);
    return this;
  }

  /** The entrance's doorway (Nell starts in it, feet at row y) and the exit's (its bottom block is the link). */
  entrance(x: number, y: number): this {
    this.set(x, y - 1, 'inTop').set(x, y, 'inBot');
    this.start = [x + ORIGIN, y + ORIGIN];
    return this;
  }

  exit(x: number, y: number, pics = true): this {
    if (pics) this.set(x, y - 1, 'outTop').set(x, y, 'outBot');
    this.exits.push({ from: [x + ORIGIN, y + ORIGIN] });
    return this;
  }

  done(): GameMap {
    reindexMonsters(this.map);
    return this.map;
  }
}

/** A part (or lens, or place setting) to carry: its picture and the counter it adds to. */
export interface Part {
  icon: Icon;
  ch: number;
  /** A pad to step on (the loft's shutters) instead of a part to pick up. */
  pad?: boolean;
}

export type Step =
  | { t: 'sign'; x: number; key: string }
  | { t: 'washer'; x: number }
  | { t: 'take'; x: number; part: Part }
  | { t: 'planter'; x: number }
  | {
      t: 'pocket';
      ladder: number;
      row: number;
      to: number;
      part?: Part & { x: number };
      washer?: number;
      /** Back down by the ladder, or off the shelf's far end onto the floor. */
      back: 'ladder' | 'drop';
      /** Shelf columns that wobble and tip on a clock (wait until one is level). */
      tilt?: [number, number];
      /** A solid padded pillar under the shelf, these columns (climb over it). */
      pillar?: [number, number];
      /** A second shelf above, up a ladder standing on this one. */
      up?: { ladder: number; row: number; to: number; part?: Part & { x: number }; washer?: number };
    }
  | { t: 'gate'; x: number; part: Part }
  | { t: 'pad'; x: number; part: Part }
  | { t: 'pit'; x: number; n: number }
  | { t: 'look'; x: number; ticks: number };

/** Decorations that are not on the way: lamps and windows. */
export interface Decor {
  lamps?: [number, number][];
  windows?: [number, number, boolean][];
  /** Shafts of light through the loft's shutters: [column, first row, last row, brightness 0..2]. */
  shafts?: [number, number, number, number][];
  /** The round light high in the night sky (2x2, top-left). */
  moon?: [number, number];
  /** A railing along a row from one column to another: [row, from, to]. */
  rails?: [number, number, number][];
}

/** Whether a place is open to the sky (the roof) or closed by a ceiling. */
export const openSky = (outsideTop: string): boolean => outsideTop === 'bg';

/**
 * Paints a room `w` wide from a plan: ceiling (unless `open`), walls, floor at G, the entrance at column 2 and the
 * exit at w - 3. Backdrop cells take variants bg, bg1, bg2, bg3 in a scatter.
 */
export function paintRoom(book: Book, w: number, plan: Step[], decor: Decor, open: boolean, signs: Record<string, Sign>): Place {
  const h = G + 3;
  const m = new Place(book, w, h, open ? 'bg' : 'wall', 'base');
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = (x * 7 + y * 13) % 11;
      const bg = v === 3 ? 'bg1' : v === 7 ? 'bg2' : v === 9 ? 'bg3' : 'bg';
      m.set(x, y, y === G ? 'floor' : y > G ? 'base' : !open && y === 0 ? 'ceil' : bg);
    }
  // walls at both ends, up to the top of the world on the roof
  for (const x of [0, w - 1]) for (let y = open ? -ORIGIN : 0; y < G; y++) m.set(x, y, 'wall');
  // keep the backdrop plain behind the doors and the signs
  m.entrance(2, G - 1).exit(w - 3, G - 1);
  for (const [x, y] of decor.windows ?? []) {
    m.set(x, y, 'win0')
      .set(x + 1, y, decor.windows!.find((d) => d[0] === x)![2] ? 'win1moon' : 'win1')
      .set(x, y + 1, 'win2')
      .set(x + 1, y + 1, 'win3');
  }
  for (const [x, y0, y1, k] of decor.shafts ?? []) {
    m.set(x, 0, 'shutO');
    for (let y = Math.max(1, y0); y <= y1; y++) m.set(x, y, `shaft${k}`);
  }
  for (const [y, x0, x1] of decor.rails ?? []) for (let x = x0; x <= x1; x++) m.set(x, y, 'rail');
  if (decor.moon) for (let q = 0; q < 4; q++) m.set(decor.moon[0] + (q % 2), decor.moon[1] + (q >> 1), `moon${q}`);
  for (const [x, y] of decor.lamps ?? [])
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m.set(x + dx, y + dy, dx || dy ? `glow${dx + 1}${dy + 1}` : 'lamp');
  for (const s of plan) paintStep(m, s, open, signs);
  return m;
}

const partBlock = (p: Part): string => (p.pad ? `pad.${p.icon}` : `tok.${p.icon}`);

function paintShelf(m: Place, ladder: number, row: number, to: number, bottom: number, tilt?: [number, number]): void {
  for (let y = row - 1; y <= bottom; y++) m.set(ladder, y, 'climb');
  for (let x = ladder + 1; x <= to; x++) m.set(x, row, tilt && x >= tilt[0] && x <= tilt[1] ? 'tilt0' : 'shelf');
}

function paintStep(m: Place, s: Step, open: boolean, signs: Record<string, Sign>): void {
  switch (s.t) {
    case 'sign': {
      const sg = signs[s.key];
      m.sign(s.x, G - 1 - sg.board.length, sg);
      break;
    }
    case 'washer':
      m.set(s.x, G - 1, 'washer');
      break;
    case 'take':
      m.set(s.x, G - 1, partBlock(s.part));
      break;
    case 'planter':
      m.set(s.x, G - 1, 'planter');
      break;
    case 'pocket': {
      paintShelf(m, s.ladder, s.row, s.to, G - 1, s.tilt);
      if (s.pillar) for (let x = s.pillar[0]; x <= s.pillar[1]; x++) for (let y = s.row + 1; y < G; y++) m.set(x, y, 'pillar');
      if (s.part) m.set(s.part.x, s.row - 1, partBlock(s.part));
      if (s.washer !== undefined) m.set(s.washer, s.row - 1, 'washer');
      if (s.up) {
        paintShelf(m, s.up.ladder, s.up.row, s.up.to, s.row - 1);
        if (s.up.part) m.set(s.up.part.x, s.up.row - 1, partBlock(s.up.part));
        if (s.up.washer !== undefined) m.set(s.up.washer, s.up.row - 1, 'washer');
      }
      break;
    }
    case 'gate':
      for (let y = open ? -ORIGIN : 0; y < G - 2; y++) m.set(s.x, y, 'wall');
      m.set(s.x, G - 2, 'lintel').set(s.x, G - 1, `socket.${s.part.icon}`);
      break;
    case 'pad':
      m.set(s.x, G - 1, `pad.${s.part.icon}`);
      break;
    case 'pit':
      for (let x = s.x; x < s.x + s.n; x++) m.set(x, G, 'pit').set(x, G + 1, 'cushion');
      break;
    case 'look':
      break;
  }
}
