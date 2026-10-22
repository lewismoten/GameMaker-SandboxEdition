// library.map: the reading room behind The Dog House's red door, and the Reserve Stacks.
//
// The reading room has a door for each wing (a felt egg in its egg cup over each one), the
// Word Counter jammed at its desk, and a door into the Reserve Stacks. In the Stacks a
// corridor runs past eight egg cup gates, one per wing, to the thirty-third book. A gate
// takes four of its wing's restored stories (counter 20 + w) and gives all four back the
// moment Joe steps through it, so it only ever checks; Game-Maker refuses the touch while
// the wing has fewer than four.
import { Pixels } from '../../../kit/pixels';
import { bevel, blob, micro } from '../art/draw';
import { c, r } from '../art/pal';
import { blank, corgi, docLeo, figure, floor, gwinn, mirror, on, sign } from '../art/kit';
import { BOOKS_PER_WING, wingCounter } from '../ids';
import { Area, type Cell, type Window } from './area';
import { shelf, type WingSpec } from './wing';

/** Door labels, wing by wing (five letters fit on a door). */
export const DOOR_LABELS = ['CLOWN', 'LAB', 'DOCKS', 'YARD', 'HOME', 'NIGHT', 'OTHER', '2000'];

function wingDoor(label: string, egg: WingSpec['egg'], seed: number): Pixels {
  const p = shelf(seed, 'red');
  bevel(p, 3, 4, 14, 16, r('wood'), 3, 1);
  p.rect(5, 12, 10, 1, c('wood', 1));
  micro(p, 10 - Math.round((label.length * 4 - 1) / 2), 7, label, c('ink', 0));
  p.rect(14, 14, 2, 2, c('brass', 4));
  // the egg cup over the door, and its felt egg
  const [felt, band, dot] = egg;
  p.rect(6, 0, 8, 4, c('wood', 1));
  blob(p, 10, 0.5, 2.5, 2.5, r(felt[0]), Math.max(0, felt[1] - 2), felt[1]);
  p.rect(8, 1, 4, 1, c(band[0], band[1])).set(9, 0, c(dot[0], dot[1]));
  p.rect(8, 2, 4, 2, c('brass', 3));
  return p;
}

/** The Word Counter: a brass adding machine as big as a desk, display and crank, jammed. */
function wordCounter(part: string, shown: string): Pixels {
  const big = new Pixels(80, 40);
  big.rect(0, 0, 80, 40, c('wood', 2));
  bevel(big, 2, 4, 76, 34, r('brass'), 2, 2);
  // the display window
  big.rect(18, 7, 44, 13, c('ink', 0)).rect(20, 9, 40, 9, c('green', 0));
  micro(big, 40 - Math.round((shown.length * 8 - 2) / 2), 10, shown, c('green', 4), 2);
  // keys
  for (let i = 0; i < 8; i++) bevel(big, 8 + i * 8, 24, 6, 6, r('paper'), 3, 1);
  // the crank, and a sad little paper tape
  big.rect(70, 12, 4, 14, c('tin', 3)).disc(72, 10, 3, c('red', 3));
  big.rect(6, 6, 6, 18, c('paper', 4));
  for (let y = 8; y < 24; y += 3) big.rect(7, y, 4, 1, c('grey', 2));
  micro(big, 22, 32, 'WORD COUNTER', c('ink', 0));
  const [col, row] = [Number(part[0]), Number(part[1])];
  return big.crop(col * 20, row * 20, 20, 20);
}

function armchair(under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 2, 4, 16, 14, r('green'), 2, 2);
  p.rect(5, 7, 10, 7, c('green', 3)).rect(2, 9, 3, 8, c('green', 1)).rect(15, 9, 3, 8, c('green', 1));
  return p;
}

function cardCatalog(): Pixels {
  const p = new Pixels(20, 20, c('wood', 2));
  for (let y = 1; y < 19; y += 6) for (let x = 1; x < 19; x += 6) p.rect(x, y, 5, 5, c('wood', 3)).rect(x + 1, y + 1, 3, 1, c('paper', 4)).set(x + 2, y + 3, c('brass', 3));
  return p;
}

function globe(under: Pixels): Pixels {
  const p = on(under);
  p.rect(9, 14, 2, 4, c('wood', 1)).rect(6, 17, 8, 2, c('wood', 2));
  blob(p, 10, 8, 6, 6, r('blue'), 1, 4);
  blob(p, 8, 7, 2.5, 3, r('green'), 1, 3);
  blob(p, 12, 10, 2, 2, r('green'), 1, 3);
  p.ring(10, 8, 7, c('brass', 3));
  return p;
}

function fern(under: Pixels): Pixels {
  const p = on(under);
  p.rect(6, 13, 8, 6, c('red', 1)).rect(6, 13, 8, 1, c('red', 3));
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.45;
    p.line(10, 13, 10 + Math.cos(a) * 8, 13 + Math.sin(a) * 9, c('green', 2 + (i % 2)));
  }
  return p;
}

/** The red door of The Dog House, from the inside: the way everybody came in. */
function redDoor(half: 0 | 1): Pixels {
  const p = new Pixels(20, 20, c('red', 2));
  p.rect(0, 0, 20, 2, c('red', 1)).rect(half ? 18 : 0, 0, 2, 20, c('red', 1));
  p.rect(half ? 0 : 3, 3, 17, 10, c('sky', 1)).rect(half ? 0 : 3, 3, 17, 1, c('sky', 3));
  if (half) {
    // the dog-bone handle and the paw-print knob
    p.rect(2, 14, 8, 2, c('ink', 0)).rect(1, 13, 2, 4, c('ink', 0)).rect(9, 13, 2, 4, c('ink', 0));
    p.disc(14, 15, 2, c('paper', 4)).set(14, 15, c('ink', 0)).set(13, 13, c('ink', 0)).set(15, 13, c('ink', 0));
  } else for (const y of [4, 15]) p.rect(0, y, 6, 2, c('ink', 0));
  return p;
}

/** An egg cup gate in the Reserve Stacks: brass bars, the wing's egg on top, "4" on the plate. */
function gate(label: string, egg: WingSpec['egg'], open: boolean, under: Pixels): Pixels {
  const p = on(under);
  const [felt, band] = egg;
  if (!open) {
    for (let x = 2; x < 20; x += 4) p.rect(x, 4, 2, 16, c('brass', 2)).rect(x, 4, 1, 16, c('brass', 4));
    p.rect(0, 10, 20, 2, c('brass', 1));
    p.rect(4, 12, 12, 7, c('paper', 4)).frame(4, 12, 12, 7, c('brass', 0));
    micro(p, 10 - Math.round((label.length * 4 - 1) / 2), 13, label, c('ink', 0));
  }
  blob(p, 10, 3, 3, 3.5, r(felt[0]), Math.max(0, felt[1] - 2), felt[1]);
  p.rect(7, 3, 6, 1, c(band[0], band[1]));
  p.rect(7, 5, 6, 2, c('brass', 3));
  return p;
}

/** The thirty-third book: plain grey, its spine label typed: 2026-12-20, Christmas Hotel (WIP). */
function blankBook(under: Pixels): Pixels {
  const p = on(under);
  bevel(p, 4, 1, 12, 18, r('grey'), 3, 1);
  p.rect(6, 4, 8, 10, c('paper', 4));
  micro(p, 6, 5, '33', c('ink', 0));
  micro(p, 6, 11 - 2, 'WIP', c('red', 2));
  p.rect(4, 16, 12, 1, c('brass', 3));
  return p;
}

const READING_ROOM = [
  'SSSSSSNNNNSSSSSS',
  'SS1SS2SSSS3SS4SS',
  'Sa......h.....aS',
  'S.....wwww.....S',
  'S..Tt.wwww..Tt.S',
  'S.......@......Z',
  'S..cc......g...S',
  'S.QQQ......KKK.S',
  'Sf............fS',
  'SS5SS6SdeS7SS8SS',
];

const STACKS = [
  'SSSSSSSSSSSSSSSS',
  'SB76543210.....S',
  'SSSSSSSSSSSS...S',
  'SAAA.......J...S',
  'S..............S',
  'S.......@....b.X',
  'S..q...........S',
  'S.....CCC......S',
  'S.f..........f.S',
  'SSSSSSSSSSSSSSSS',
];

export interface CompiledHub {
  area: Area;
  room: Window;
  stacks: Window;
  /** The eight wing doors in the reading room, by wing. */
  doors: { x: number; y: number }[];
  /** The reading room's door into the Reserve Stacks, and the Stacks' door back. */
  toStacks: { x: number; y: number };
  fromStacks: { x: number; y: number };
  /** The thirty-third book (a link to its card). */
  book33: { x: number; y: number };
  /** The gates, by wing. */
  gates: { x: number; y: number }[];
}

export function compileHub(wings: WingSpec[]): CompiledHub {
  const a = new Area('library');
  const parquet = floor('parquet', 1);
  a.tile('floor', parquet);
  const rug = floor('carpet', 9, 'purple');
  a.tile('rug', rug);
  a.solid('shelf', shelf(101, 'red'));
  wings.forEach((w, i) => a.tile(`door${i}`, wingDoor(DOOR_LABELS[i], w.egg, 110 + i)));
  for (let i = wings.length; i < 8; i++) a.solid(`door${i}`, wingDoor('SOON', [['grey', 3], ['grey', 1], ['grey', 4]], 110 + i));
  // the Word Counter's display: jammed, it flips between 099, 101 and STOP forever
  const shows = ['099', '101', 'STOP', '000'];
  shows.forEach((s, k) => {
    const next = shows[(k + 1) % shows.length];
    a.solid(`wc00${s}`, wordCounter('00', s), { next: `wc00${next}`, ntime: k === 2 ? 30 : 12 });
    a.solid(`wc10${s}`, wordCounter('10', s), { next: `wc10${next}`, ntime: k === 2 ? 30 : 12 });
    a.solid(`wc20${s}`, wordCounter('20', s), { next: `wc20${next}`, ntime: k === 2 ? 30 : 12 });
  });
  for (const part of ['30', '01', '11', '21', '31']) a.solid(`wc${part}`, wordCounter(part, '099'));
  a.solid('chair', armchair(parquet));
  a.solid('chairR', armchair(rug));
  a.solid('catalog', cardCatalog());
  a.solid('globe', globe(parquet));
  a.solid('fern', fern(parquet));
  a.solid('red0', redDoor(0));
  a.solid('red1', redDoor(1));
  a.solid('tableL', on(parquet, (() => {
    const p = blank();
    p.rect(0, 6, 20, 8, c('wood', 3)).rect(0, 13, 20, 2, c('wood', 1)).rect(3, 15, 2, 4, c('wood', 1));
    p.rect(5, 2, 8, 3, c('green', 2)).rect(8, 5, 2, 1, c('brass', 2));
    return p;
  })()));
  a.solid('tableR', on(parquet, (() => {
    const p = blank();
    p.rect(0, 6, 20, 8, c('wood', 3)).rect(0, 13, 20, 2, c('wood', 1)).rect(15, 15, 2, 4, c('wood', 1));
    p.rect(3, 7, 6, 4, c('blue', 2)).rect(10, 8, 6, 3, c('red', 2));
    return p;
  })()));
  a.tile('toStacks', on(shelf(120, 'purple'), (() => {
    const p = blank();
    bevel(p, 2, 2, 16, 18, r('purple'), 2, 1);
    micro(p, 4, 6, 'STAX', c('brass', 4));
    micro(p, 4, 12, '-->', c('brass', 4));
    return p;
  })()));
  sign(['QUIET PLEASE', 'WORDS AT WORK'], 4, { board: 'green', ink: 'paper', edge: 'brass' }).forEach((px, i) => a.solid(`quiet${i}`, on(shelf(130 + i, 'red'), px)));
  sign(['OVERDUE FINE:', 'ONE WORD', 'PER DAY'], 3).forEach((px, i) => a.solid(`fine${i}`, on(parquet, px)));
  sign(['BOOKS ARE NOT', 'CHEW TOYS.', 'YES, GWINN.'], 3).forEach((px, i) => a.solid(`chew${i}`, on(parquet, px)));
  // the Reserve Stacks
  wings.forEach((w, i) => {
    a.tile(`gateOpen${i}`, gate('', w.egg, true, parquet), { effect: wingCounter(i), eamt: BOOKS_PER_WING, touch: `gateDone${i}` });
    a.tile(`gateDone${i}`, gate('', w.egg, true, parquet));
    a.solid(`gate${i}`, gate(`${BOOKS_PER_WING}`, w.egg, false, parquet), { effect: wingCounter(i), eamt: -BOOKS_PER_WING, touch: `gateOpen${i}` });
  });
  a.tile('book33', blankBook(parquet));
  const lectern = blank();
  lectern.rect(6, 8, 8, 11, c('wood', 2)).rect(3, 4, 14, 5, c('wood', 3)).rect(5, 5, 10, 3, c('paper', 4));
  a.solid('lectern', on(parquet, lectern));
  sign(['RESERVE STACKS', 'STAFF AND', 'ROBOTS ONLY'], 3, { board: 'purple', ink: 'paper', edge: 'brass' }).forEach((px, i) => a.solid(`stax${i}`, on(parquet, px)));
  sign(['PLEASE FORM', 'A LINE', 'FACING FRONT'], 3).forEach((px, i) => a.solid(`line${i}`, on(parquet, px)));
  a.tile('back', on(shelf(140, 'purple'), (() => {
    const p = blank();
    bevel(p, 2, 2, 16, 18, r('wood'), 3, 1);
    micro(p, 3, 8, '<--', c('ink', 0));
    return p;
  })()));
  // Doc Leo, standing backward in line (as usual), and the rest of the line
  a.prop('leoBack', 'floor', mirror(docLeo(0)));
  a.prop('patron', 'floor', figure({ shirt: ['teal', 3], hair: ['ink', 1], pants: ['brown', 1] }));
  a.prop('patron2', 'floor', figure({ shirt: ['orange', 2], hair: ['grey', 4], hairStyle: 'bun', dress: true, glasses: true }));

  // monsters
  a.addShusher();
  a.monster('teddy', [[corgi(0), 4], [corgi(1), 4]], { path: [[5, 0, 2], [-5, 0, 2]] });
  a.monster('gwinn', [[gwinn(0, true), 3], [gwinn(1, true), 3]], { path: [[-5, 0, 3], [5, 0, 3]] });

  const shelfCells = { S: 'shelf', '.': 'floor' };
  const room = a.window(0, 0, READING_ROOM, {
    ...shelfCells,
    a: 'chair',
    h: { tile: '.', mon: 'shh' },
    w: 'wc30',
    '1': { tile: 'door0', mark: 'door0' },
    T: 'tableL',
    t: 'tableR',
    Z: { tile: 'toStacks', mark: 'toStacks' },
    c: 'catalog',
    g: 'globe',
    Q: 'fine0',
    K: 'chew0',
    f: 'fern',
    d: 'red0',
    e: 'red1',
    N: 'shelf',
    ...Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map((n) => [String(n), { tile: `door${n - 1}`, mark: `door${n - 1}` }])),
  } as Record<string, Cell>, 'floor');
  // the Word Counter (4x2) and the signs, set block by block
  a.set(6, 3, 'wc00099'), a.set(7, 3, 'wc10099'), a.set(8, 3, 'wc20099'), a.set(9, 3, 'wc30');
  a.set(6, 4, 'wc01'), a.set(7, 4, 'wc11'), a.set(8, 4, 'wc21'), a.set(9, 4, 'wc31');
  for (let i = 0; i < 4; i++) a.set(6 + i, 0, `quiet${i}`);
  for (let i = 0; i < 3; i++) a.set(2 + i, 7, `fine${i}`), a.set(11 + i, 7, `chew${i}`);
  a.monAt(2, 2, 'teddy');
  a.monAt(12, 8, 'gwinn');

  const stacks = a.window(16, 0, STACKS, {
    ...shelfCells,
    B: { tile: 'book33', mark: 'book33' },
    l: 'lectern',
    X: { tile: 'back', mark: 'back' },
    A: 'stax0',
    J: 'leoBack',
    b: 'patron',
    q: 'patron2',
    C: 'line0',
    f: 'fern',
    ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map((w) => [String(w), { tile: w < wings.length ? `gate${w}` : 'floor', mark: `gate${w}` }])),
  } as Record<string, Cell>, 'floor');
  for (let i = 0; i < 3; i++) a.set(17 + i, 3, `stax${i}`), a.set(16 + 6 + i, 7, `line${i}`);

  return {
    area: a,
    room,
    stacks,
    doors: [0, 1, 2, 3, 4, 5, 6, 7].map((w) => room.marks.get(`door${w}`)!),
    toStacks: room.marks.get('toStacks')!,
    fromStacks: stacks.marks.get('back')!,
    book33: stacks.marks.get('book33')!,
    gates: [0, 1, 2, 3, 4, 5, 6, 7].map((w) => stacks.marks.get(`gate${w}`)!),
  };
}
