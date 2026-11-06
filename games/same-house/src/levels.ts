// THE SAME HOUSE's two levels. Each is a hub (one scene) and a room map that three more scenes reuse.
//
//   1. Three Front Doors: a street with three houses that look alike, numbered 1, 2 and 3. Each door
//      goes to the SAME house map (HOUSE.MAP and HOUSE.BBL), but each door's scene loads its own palette
//      (RED, BLUE, GREEN): a different carpet, wallpaper, roof and curtains. The last door goes on.
//   2. One Room, Three Places: a square with three doors, labeled. Each goes to the same tower room
//      (TOWER.MAP) in a palette of wood, ice or lava.
//
// A "place" is a map and its block file. A scene is a place with a palette: the engine loads the palette
// file the scene names, and nothing in the map or the blocks knows what colors it will get.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { addSign, type Sign } from '../../kit/starter/sign';
import { PAL_NAMES, buildPalettes, type PalName, type Palettes } from './palettes';
import { banner, cap, carpet, frontWindow, lamp, merlon, painting, plate, roofTile, siding, slab, slit, sofa, towerWall, wallpaper, windowIn } from './props';

/** A map and the block file it is drawn with. */
export interface Place {
  file: string;
  map: StarterMap;
  book: Book;
  /** Where the hero stands on arriving (world blocks). */
  enter: [number, number];
}

export interface Level {
  title: string;
  /** What the level card says under the title. */
  hint: string;
  /** The hub: where the doors are, and the palette it is shown in. */
  hub: Place & { pal: PalName; doors: number[]; landings: [number, number][]; next: [number, number]; scene: string };
  /** The room: its exit, and the palette of each door's scene. */
  room: Place & { exit: [number, number]; pals: PalName[]; scenes: string[] };
}

export const finishBlocks = (p: Pick<Place, 'book'>): Block[] => p.book.finish();

export const GROUND = 10;
export const HOUSE_WIDTH = 26;
/** The street's first sign, its three doors' columns, the end door, and the house's exit column. */
export const STREET_DOORS = [13, 22, 31] as const;
export const STREET_END = 43;
export const PLAZA_DOORS = [8, 17, 26] as const;
export const PLAZA_END = 41;
export const HOUSE_EXIT = 20;
export const TOWER_EXIT = 20;
/** The coins of a house and of the tower room (level blocks): four each. */
const COINS_HOUSE: [number, number][] = [
  [9, 9],
  [12, 8],
  [13, 8],
  [16, 9],
];
const COINS_TOWER: [number, number][] = [
  [9, 9],
  [12, 9],
  [14, 9],
  [16, 9],
];

type SignName = 'one' | 'last' | 'inside' | 'wood' | 'ice' | 'lava' | 'three' | 'room';
const SIGNS: Record<SignName, string> = {
  one: 'THREE DOORS, ONE HOUSE MAP, THREE PALETTES',
  last: 'THE LAST DOOR GOES ON',
  inside: 'SAME MAP. NEW CARPET, PAPER, ROOF',
  wood: 'WOOD ROOM',
  ice: 'ICE ROOM',
  lava: 'LAVA ROOM',
  three: 'ONE ROOM MAP, THREE PLACES',
  room: 'SAME ROOM. A NEW PLACE',
};

function startBook(pal: Pal, signs: [SignName, number, number][]): { book: Book; signs: Record<string, Sign> } {
  const book = new Book('bbl');
  addStarterBlocks(book, pal);
  const out: Record<string, Sign> = {};
  for (const [n, w, h] of signs) out[n] = addSign(book, pal, `${n}.sign`, SIGNS[n], w, h);
  return { book, signs: out };
}

const air = { grav: PULL.down };

/** A copy of picture `pic` with the sky behind it replaced by the wall block's picture `bg` (the Starters' blocks are drawn on sky). */
function onWall(pal: Pal, pic: Pixels, bg: Pixels): Pixels {
  const sky = skyOf(pal);
  const out = new Pixels(pic.w, pic.h);
  out.px.set(pic.px);
  return out.map((x, y, c) => (c === sky ? bg.px[y * 20 + x] : c));
}

/** A sign standing in front of a wall: the kit's sign, drawn in a scratch book and added here with the wall behind it. */
function addSignOn(book: Book, pal: Pal, name: SignName, w: number, h: number, wall: string): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, `${name}.sign`, SIGNS[name], w, h);
  for (const [n, pic] of scratch.pics) book.add(n, onWall(pal, pic, book.pics.get(wall)!), air);
  return sign;
}

/** Doors, doorways, a coin and a sign that stand in front of a wall (siding, wallpaper, bricks) instead of the sky: new blocks named `<name>.in`, and a coin that turns back into the wall when taken. */
function addInside(book: Book, pal: Pal, wall: string): void {
  const bg = book.pics.get(wall)!;
  for (const n of ['doorTop', 'doorBottom', 'doorwayTop', 'doorwayBottom']) book.add(`${n}.in`, onWall(pal, book.pics.get(n)!, bg), air);
  book.add('coin.in', onWall(pal, book.pics.get('coin')!, bg), { ...air, score: 10, touch: wall });
}
const onGround = (ground: number, s: Sign) => ground - 1 - s.board.length;
const world = (x: number, y: number): [number, number] => [x + ORIGIN, y + ORIGIN];

/** Level 1's hub: a street of three houses with the same front. */
function street(pal: Pal): Level['hub'] {
  const { book, signs } = startBook(pal, [
    ['one', 4, 3],
    ['last', 4, 3],
  ]);
  book.add('siding', siding(pal), air);
  book.add('roof', roofTile(pal), air);
  const sid = book.pics.get('siding')!;
  addInside(book, pal, 'siding');
  book.add('front.window', frontWindow(pal, sid), air);
  for (const d of [1, 2, 3]) book.add(`plate.${d}`, plate(pal, sid, d), air);

  const W = 46;
  const g = new Grid(W, 15);
  g.row(GROUND, 0, W - 1, 'G').fill(0, GROUND + 1, W, 4, 'D');
  g.col(0, 0, 9, 'B').col(W - 1, 0, 9, 'B');
  g.put(1, 8, 's').put(1, 9, 'S');
  for (const [x, y] of [
    [4, 3],
    [20, 2],
    [34, 3],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [8, 18, 27, 38]) g.put(x, GROUND - 1, 'b');
  for (const x of [9, 19, 28, 40]) g.put(x, GROUND - 1, 'f');
  for (const x of [17, 26, 35]) g.put(x, GROUND - 1, 'c');
  g.put(STREET_END, 8, 'e').put(STREET_END, 9, 'E');
  const m = new StarterMap(book, g.rows());
  m.sign(3, onGround(GROUND, signs.one), signs.one);
  m.sign(37, onGround(GROUND, signs.last), signs.last);
  // three fronts, built from the same blocks: a roof, siding, two windows, a numbered door
  STREET_DOORS.forEach((d, i) => {
    const x0 = d - 3;
    for (let x = x0 + 2; x <= x0 + 4; x++) m.set(x, 4, 'roof');
    for (let x = x0 + 1; x <= x0 + 5; x++) m.set(x, 5, 'roof');
    for (let x = x0; x <= x0 + 6; x++) m.set(x, 6, 'roof');
    for (let y = 7; y <= 9; y++) for (let x = x0; x <= x0 + 6; x++) m.set(x, y, 'siding');
    m.set(x0 + 1, 8, 'front.window').set(x0 + 5, 8, 'front.window');
    m.set(d, 7, `plate.${i + 1}`);
    m.set(d, 8, 'doorTop.in').set(d, 9, 'doorBottom.in');
  });
  // the doors' bottom blocks and the end door are what the hero touches to go in
  return {
    file: 'street',
    map: m,
    book,
    enter: m.start,
    pal: 'street',
    doors: [...STREET_DOORS],
    landings: STREET_DOORS.map((d) => world(d + 2, 9)),
    next: world(STREET_END, 9),
    scene: 'Street',
  };
}

/** Level 1's room: a house cut in half, so you see the roof, the wallpaper, the carpet and the curtains. */
function house(pal: Pal): Level['room'] {
  const { book } = startBook(pal, []);
  book.add('wallpaper', wallpaper(pal), air);
  const wp = book.pics.get('wallpaper')!;
  addInside(book, pal, 'wallpaper');
  const inside = addSignOn(book, pal, 'inside', 4, 3, 'wallpaper');
  book.add('carpet', carpet(pal), { solid: SOLID });
  book.add('roof', roofTile(pal), { solid: SOLID });
  book.add('window', windowIn(pal, wp), air);
  book.add('painting', painting(pal, wp), air);
  book.add('sofa.l', sofa(pal, wp, 'l'), air);
  book.add('sofa.r', sofa(pal, wp, 'r'), air);

  const g = new Grid(HOUSE_WIDTH, 15);
  g.row(GROUND, 1, HOUSE_WIDTH - 2, 'G').fill(0, GROUND + 1, HOUSE_WIDTH, 4, 'D');
  g.col(0, 0, 9, 'B').col(HOUSE_WIDTH - 1, 0, 9, 'B');
  g.col(3, 5, 10, 'B').col(22, 5, 10, 'B');
  g.put(5, 8, 's').put(5, 9, 'S');
  g.put(HOUSE_EXIT, 8, 'e').put(HOUSE_EXIT, 9, 'E');
  const m = new StarterMap(book, g.rows());
  const door = (x: number) => x === 5 || x === HOUSE_EXIT;
  for (let y = 5; y <= 9; y++) for (let x = 4; x <= 21; x++) if (!(door(x) && y >= 8)) m.set(x, y, 'wallpaper');
  m.set(5, 8, 'doorwayTop.in').set(5, 9, 'doorwayBottom.in').set(HOUSE_EXIT, 8, 'doorTop.in').set(HOUSE_EXIT, 9, 'doorBottom.in');
  for (const [x, y] of COINS_HOUSE) m.set(x, y, 'coin.in');
  for (let x = 4; x <= 21; x++) m.set(x, GROUND, 'carpet');
  // the roof: four rows, stepped
  const rows: [number, number, number][] = [
    [1, 8, 17],
    [2, 6, 19],
    [3, 4, 21],
    [4, 2, 23],
  ];
  for (const [y, a, b] of rows) for (let x = a; x <= b; x++) m.set(x, y, 'roof');
  m.set(11, 6, 'window').set(15, 6, 'window').set(13, 6, 'painting');
  m.set(12, 9, 'sofa.l').set(13, 9, 'sofa.r');
  m.sign(7, onGround(GROUND, inside), inside);
  return {
    file: 'house',
    map: m,
    book,
    enter: m.start,
    exit: world(HOUSE_EXIT, 9),
    pals: ['red', 'blue', 'green'],
    scenes: ['House 1 red', 'House 2 blue', 'House 3 green'],
  };
}

/** Level 2's hub: a square with three labeled doors. */
function plaza(pal: Pal): Level['hub'] {
  const { book, signs } = startBook(pal, [
    ['wood', 4, 1],
    ['ice', 4, 1],
    ['lava', 4, 1],
    ['three', 4, 3],
  ]);
  const W = 44;
  const g = new Grid(W, 15);
  g.row(GROUND, 0, W - 1, 'G').fill(0, GROUND + 1, W, 4, 'D');
  g.col(0, 0, 9, 'B').col(W - 1, 0, 9, 'B');
  g.put(1, 8, 's').put(1, 9, 'S');
  for (const [x, y] of [
    [6, 3],
    [22, 2],
    [36, 4],
  ])
    g.put(x, y, '(').put(x + 1, y, ')');
  for (const x of [12, 21, 31, 38]) g.put(x, GROUND - 1, 'b');
  for (const x of [14, 23, 35]) g.put(x, GROUND - 1, 'f');
  for (const x of [10, 19, 28]) g.put(x + 1, GROUND - 1, 'c');
  for (const d of PLAZA_DOORS) g.put(d, 8, 'e').put(d, 9, 'E');
  g.put(PLAZA_END, 8, 'e').put(PLAZA_END, 9, 'E');
  const m = new StarterMap(book, g.rows());
  const names = ['wood', 'ice', 'lava'] as const;
  PLAZA_DOORS.forEach((d, i) => m.sign(d - 5, onGround(GROUND, signs[names[i]]), signs[names[i]]));
  m.sign(33, onGround(GROUND, signs.three), signs.three);
  return {
    file: 'plaza',
    map: m,
    book,
    enter: m.start,
    pal: 'street',
    doors: [...PLAZA_DOORS],
    landings: PLAZA_DOORS.map((d) => world(d + 2, 9)),
    next: world(PLAZA_END, 9),
    scene: 'Square',
  };
}

/** Level 2's room: a tower room with a battlement, bricks, two lamps, a banner and a slit of sky. */
function tower(pal: Pal): Level['room'] {
  const { book } = startBook(pal, []);
  book.add('tower.wall', towerWall(pal), air);
  const tw = book.pics.get('tower.wall')!;
  addInside(book, pal, 'tower.wall');
  const room = addSignOn(book, pal, 'room', 4, 3, 'tower.wall');
  book.add('slab', slab(pal), { solid: SOLID });
  book.add('cap', cap(pal), { solid: SOLID });
  book.add('merlon', merlon(pal), { ...air, solid: SOLID });
  book.add('lamp', lamp(pal, tw), air);
  book.add('banner', banner(pal, tw), air);
  book.add('slit', slit(pal, tw), air);

  const g = new Grid(HOUSE_WIDTH, 15);
  g.row(GROUND, 1, HOUSE_WIDTH - 2, 'G').fill(0, GROUND + 1, HOUSE_WIDTH, 4, 'D');
  g.col(0, 0, 9, 'B').col(HOUSE_WIDTH - 1, 0, 9, 'B');
  g.put(5, 8, 's').put(5, 9, 'S');
  g.put(TOWER_EXIT, 8, 'e').put(TOWER_EXIT, 9, 'E');
  const m = new StarterMap(book, g.rows());
  const door = (x: number) => x === 5 || x === TOWER_EXIT;
  for (let y = 5; y <= 9; y++) for (let x = 4; x <= 21; x++) if (!(door(x) && y >= 8)) m.set(x, y, 'tower.wall');
  m.set(5, 8, 'doorwayTop.in').set(5, 9, 'doorwayBottom.in').set(TOWER_EXIT, 8, 'doorTop.in').set(TOWER_EXIT, 9, 'doorBottom.in');
  for (const [x, y] of COINS_TOWER) m.set(x, y, 'coin.in');
  for (let y = 5; y <= 10; y++) m.set(3, y, 'cap').set(22, y, 'cap');
  for (let x = 3; x <= 22; x++) m.set(x, GROUND, 'slab').set(x, 4, 'cap').set(x, 3, 'cap');
  for (let x = 3; x <= 22; x += 2) m.set(x, 2, 'merlon');
  m.set(11, 6, 'lamp').set(17, 6, 'lamp').set(13, 6, 'banner').set(15, 6, 'slit');
  m.sign(7, onGround(GROUND, room), room);
  return {
    file: 'tower',
    map: m,
    book,
    enter: m.start,
    exit: world(TOWER_EXIT, 9),
    pals: ['wood', 'ice', 'lava'],
    scenes: ['Wood room', 'Ice room', 'Lava room'],
  };
}

/** The palettes and the levels in order. */
export function buildLevels(): { pal: Pal; pals: Palettes; levels: Level[] } {
  const pals = buildPalettes();
  const pal = pals.pal;
  return {
    pal,
    pals,
    levels: [
      { title: 'Three Front Doors', hint: 'Go in each door.', hub: street(pal), room: house(pal) },
      { title: 'One Room, Three Places', hint: 'Try all three doors.', hub: plaza(pal), room: tower(pal) },
    ],
  };
}

export { PAL_NAMES };
