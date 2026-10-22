// The Future Shelf (the Tomorrow Egg from In The Year 2000!): books from a strange year called
// 2026. Prompted Royalty, Everything But the Tea, Craigslist Said It Was Healthy, and The Day
// the Vase Fell.
import { Pixels } from '../../../../kit/pixels';
import { blob, micro } from '../../art/draw';
import { c, r } from '../../art/pal';
import { blank, corgi, figure, floor, on, sign, wall } from '../../art/kit';
import type { Area } from '../area';
import type { WingSpec } from '../wing';
import { WINGS } from '../../stories';

function backdrop(): Pixels {
  const p = new Pixels(20, 20, c('blue', 1));
  for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 20, c('blue', 2));
  p.rect(0, 17, 20, 3, c('grey', 4));
  return p;
}

function tripod(under: Pixels): Pixels {
  const p = on(under);
  p.line(10, 9, 4, 19, c('ink', 1)).line(10, 9, 16, 19, c('ink', 1)).line(10, 9, 10, 19, c('ink', 1));
  p.rect(5, 3, 10, 6, c('ink', 1)).rect(13, 4, 4, 4, c('grey', 2)).disc(15, 6, 1.5, c('sky', 4));
  return p;
}

function studioLight(under: Pixels): Pixels {
  const p = on(under);
  p.rect(9, 8, 2, 11, c('ink', 1)).rect(5, 18, 10, 1, c('ink', 1));
  p.rect(3, 1, 14, 8, c('paper', 4)).frame(3, 1, 14, 8, c('grey', 2));
  return p;
}

const royal = (queen: boolean) =>
  figure(queen ? { shirt: ['purple', 3], dress: true, hair: ['grey', 4], hairStyle: 'bun', hat: { kind: 'crown', color: ['brass', 3] }, face: 'happy' } : { shirt: ['red', 3], pants: ['ink', 1], beard: ['grey', 4], hat: { kind: 'crown', color: ['brass', 3] } });

function laptop(under: Pixels, portrait: boolean): Pixels {
  const p = on(under);
  p.rect(2, 13, 16, 3, c('grey', 3));
  p.rect(3, 3, 14, 10, c('ink', 1)).rect(4, 4, 12, 8, portrait ? c('sky', 3) : c('blue', 1));
  if (portrait) for (let i = 0; i < 4; i++) p.rect(5 + i * 3, 7, 2, 4, c(['red', 'purple', 'green', 'orange'][i], 3)).set(5 + i * 3, 6, c('skin', 3)).set(6 + i * 3, 6, c('brass', 4));
  else micro(p, 5, 6, 'AI', c('green', 4));
  return p;
}

const agent = (step: number) => figure({ shirt: ['ink', 1], pants: ['ink', 1], tie: ['ink', 0], face: 'shades', hair: ['ink', 1] }, step);

function roofSniper(): Pixels {
  const p = wall('brick', 'grey', 9);
  p.rect(3, 4, 14, 9, c('sky', 3)).rect(3, 4, 14, 2, c('sky', 4));
  p.rect(10, 7, 3, 3, c('ink', 1)).line(9, 8, 5, 8, c('ink', 1));
  return p;
}

function onigiri(): Pixels {
  const p = new Pixels(20, 20, c('grey', 3));
  for (const top of [1, 11]) {
    p.rect(0, top + 7, 20, 2, c('grey', 1));
    for (let i = 0; i < 3; i++) {
      const x = 1 + i * 6;
      for (let y = 0; y < 6; y++) p.rect(x + 2 - Math.floor(y / 2), top + y + 1, 1 + Math.floor(y / 2) * 2, 1, c('paper', 4));
      p.rect(x + 1, top + 5, 4, 2, c('ink', 1));
    }
  }
  return p;
}

function teaFridge(): Pixels {
  const p = new Pixels(20, 20, c('grey', 4));
  p.rect(1, 1, 18, 18, c('sky', 4));
  for (const y of [2, 10])
    for (let x = 2; x < 18; x += 4) p.rect(x, y, 3, 7, c('green', 3)).rect(x, y, 3, 2, c('paper', 4));
  return p;
}

function counter(under: Pixels, register: boolean): Pixels {
  const p = on(under);
  p.rect(0, 8, 20, 12, c('paper', 3)).rect(0, 8, 20, 2, c('grey', 4));
  if (register) p.rect(4, 2, 10, 6, c('grey', 2)).rect(5, 3, 8, 2, c('green', 4));
  else p.rect(3, 3, 14, 5, c('orange', 2)).rect(4, 4, 3, 3, c('brown', 2)).rect(9, 4, 3, 3, c('brown', 2));
  return p;
}

function socks(under: Pixels): Pixels {
  const p = on(under);
  p.rect(2, 2, 16, 16, c('grey', 3));
  p.rect(4, 4, 3, 8, c('red', 3)).rect(4, 11, 5, 3, c('red', 3)).rect(12, 4, 3, 8, c('blue', 3)).rect(12, 11, 5, 3, c('blue', 3));
  p.rect(7, 15, 6, 2, c('ink', 1)).rect(13, 16, 3, 2, c('paper', 4));
  return p;
}

/** The tea: the one thing in the store you can never get. It keeps its distance. */
function teaBottle(frame: number): Pixels {
  const p = blank();
  p.rect(7, 5 + frame, 6, 13, c('green', 3)).rect(8, 2 + frame, 4, 3, c('green', 4)).rect(8, 1 + frame, 4, 1, c('paper', 4));
  p.rect(7, 9 + frame, 6, 4, c('paper', 4));
  micro(p, 8, 10 + frame, 'TE', c('green', 1));
  return p;
}

function question(frame: number): Pixels {
  const p = blank();
  blob(p, 10, 9, 7, 6, r('paper'), 3, 4);
  p.rect(5, 14, 3, 3, c('paper', 4));
  micro(p, 7 + frame, 7, '??', c('red', 2));
  return p;
}

function ficus(under: Pixels, alive: boolean): Pixels {
  const p = on(under);
  p.rect(6, 14, 8, 5, c('red', 1)).rect(6, 14, 8, 1, c('red', 3)).rect(9, 6, 2, 8, c('brown', 2));
  if (alive) for (let i = 0; i < 6; i++) blob(p, 5 + (i % 3) * 5, 4 + Math.floor(i / 3) * 4, 3, 2.5, r('green'), 1, 5);
  else {
    p.line(10, 7, 5, 4, c('brown', 1)).line(10, 8, 15, 5, c('brown', 1));
    p.set(4, 16, c('brown', 3)).set(16, 17, c('brown', 3)).set(13, 18, c('brown', 2));
  }
  return p;
}

function officeDesk(under: Pixels): Pixels {
  const p = on(under);
  p.rect(0, 8, 20, 6, c('grey', 3)).rect(0, 8, 20, 1, c('grey', 5)).rect(1, 14, 2, 5, c('grey', 2)).rect(17, 14, 2, 5, c('grey', 2));
  p.rect(5, 2, 10, 6, c('ink', 1)).rect(6, 3, 8, 4, c('blue', 2));
  micro(p, 6, 3, 'ADS', c('paper', 4));
  return p;
}

function truck(part: number): Pixels {
  const big = new Pixels(40, 20, c('grey', 1));
  big.rect(0, 4, 26, 12, c('paper', 2)).rect(26, 7, 12, 9, c('red', 2)).rect(29, 8, 6, 4, c('sky', 3));
  for (const [x, col] of [[3, 'brown'], [9, 'green'], [15, 'blue'], [20, 'yellow']] as const) big.rect(x, 1, 4, 4, c(col, 2));
  big.disc(8, 17, 3, c('ink', 0)).disc(31, 17, 3, c('ink', 0));
  return big.crop(part * 20, 0, 20, 20);
}

function leaf(frame: number): Pixels {
  const p = blank();
  blob(p, 10 + frame * 2, 9 + frame, 4, 2, r('brown'), 1, 3);
  p.line(7 + frame * 2, 9 + frame, 13 + frame * 2, 9 + frame, c('brown', 0));
  return p;
}

function cottage(): Pixels {
  const p = new Pixels(20, 20, c('green', 2));
  p.rect(3, 9, 14, 11, c('paper', 4)).rect(8, 13, 4, 7, c('wood', 1)).rect(4, 11, 3, 3, c('sky', 3));
  for (let i = 0; i < 8; i++) p.rect(1 + i, 9 - i, 18 - i * 2, 1, c('red', 2));
  return p;
}

function bridge(): Pixels {
  const p = floor('boards', 9);
  p.rect(0, 0, 20, 2, c('wood', 1)).rect(0, 18, 20, 2, c('wood', 1));
  return p;
}

/** Bob the giant, two blocks tall: his top half and his bottom half. */
function bob(half: 0 | 1, under: Pixels): Pixels {
  const tall = new Pixels(20, 40, 255);
  const f = figure({ shirt: ['green', 3], pants: ['blue', 2], hair: ['brown', 1], face: 'happy', arms: 'out' });
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
    const v = f.get(x, y);
    if (v !== 255) tall.rect(x, y * 2, 1, 2, v);
  }
  return on(under, tall.crop(0, half * 20, 20, 20).map((_, __, v) => v));
}

function shards(under: Pixels): Pixels {
  const p = on(under);
  for (const [x, y] of [[4, 12], [9, 15], [13, 11], [15, 16], [7, 9]]) p.rect(x, y, 3, 2, c('blue', 4)).set(x, y, c('paper', 4));
  return p;
}

function router(frame: number, under: Pixels): Pixels {
  const p = on(under);
  p.rect(3, 10, 14, 6, c('ink', 1)).line(5, 10, 3, 4, c('ink', 1)).line(15, 10, 17, 5, c('ink', 1));
  for (let i = 0; i < 4; i++) p.set(6 + i * 3, 13, (i + frame) % 2 ? c('green', 4) : c('ink', 0));
  p.line(4, 15, 15, 11, c('grey', 3)); // crushed
  return p;
}

function art(a: Area): void {
  // Prompted Royalty
  a.tile('studio', floor('lino', 2, 'grey'));
  a.solid('backdrop', backdrop());
  a.solid('tripod', tripod(a.tiles.pic('studio')));
  a.solid('slight', studioLight(a.tiles.pic('studio')));
  a.prop('king', 'studio', royal(false));
  a.prop('queen', 'studio', royal(true));
  a.solid('laptop', laptop(a.tiles.pic('studio'), false));
  a.solid('portrait', laptop(a.tiles.pic('studio'), true));
  a.solid('sniper', roofSniper());
  a.prop('nancyP', 'studio', figure({ shirt: ['orange', 3], pants: ['ink', 1], hair: ['brown', 1], hairStyle: 'long', glasses: true }));
  sign(['PORTRAITS', 'WHILE YOU', 'DON\'T WAIT'], 3, { board: 'sky' }).forEach((px, i) => a.solid(`portraits${i}`, px));
  a.monster('agent', [[agent(0), 5], [agent(1), 5]], { hazard: true, path: [[0, 3, 1], [0, -3, 1]] });
  a.patrol('agent', [[5, 0, 1], [-5, 0, 1]], 'agentH');

  // Everything But the Tea
  a.tile('konbini', floor('lino', 4, 'sky'));
  a.solid('onigiri', onigiri());
  a.solid('teafridge', teaFridge());
  a.solid('register', counter(a.tiles.pic('konbini'), true));
  a.solid('chicken', counter(a.tiles.pic('konbini'), false));
  a.solid('socks', socks(a.tiles.pic('konbini')));
  a.prop('cashier', 'konbini', figure({ shirt: ['sky', 3], pants: ['ink', 1], hair: ['ink', 0], hat: { kind: 'cap', color: ['sky', 3] }, face: 'happy' }));
  sign(['30 RICE BALLS', 'NO TEA LEFT', 'GOOD LUCK'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`konbiniSign${i}`, px));
  a.monster('tea', [[teaBottle(0), 4], [teaBottle(1), 4]], { path: [[3, 0, 2], [0, 2, 2], [-3, 0, 2], [0, -2, 2]] });
  a.monster('question', [[question(0), 5], [question(1), 5]], { hazard: true, path: [[4, 0, 1], [-4, 0, 1]] });

  // Craigslist Said It Was Healthy
  a.tile('cube', floor('carpet', 8, 'grey'));
  a.tile('alley', floor('road', 8));
  a.solid('jarold', ficus(a.tiles.pic('cube'), false));
  a.solid('jaroldJr', ficus(a.tiles.pic('cube'), true));
  a.solid('odesk', officeDesk(a.tiles.pic('cube')));
  a.solid('truck0', truck(0));
  a.solid('truck1', truck(1));
  a.solid('cubewall', wall('panel'));
  a.solid('alleywall', wall('brick', 'brown', 12));
  a.prop('seller', 'alley', figure({ shirt: ['purple', 2], pants: ['ink', 1], hair: ['grey', 4], hairStyle: 'wild', arms: 'out' }));
  sign(['TAKE CARE OF', 'JAROLD', '-MANAGEMENT'], 3, { board: 'paper' }).forEach((px, i) => a.solid(`jaroldSign${i}`, px));
  a.monster('leaf', [[leaf(0), 4], [leaf(1), 4]], { hazard: true, path: [[0, 3, 1], [3, 0, 1], [0, -3, 1], [-3, 0, 1]] });

  // The Day the Vase Fell
  a.tile('green', floor('grass', 12));
  a.solid('stream', floor('water', 12));
  a.tile('bridge', bridge());
  a.solid('cottage', cottage());
  a.solid('bobTop', bob(0, a.tiles.pic('green')));
  a.solid('bobBot', bob(1, a.tiles.pic('green')));
  a.tile('shards', shards(a.tiles.pic('green')));
  a.solid('router0', router(0, a.tiles.pic('green')), { next: 'router1', ntime: 6 });
  a.solid('router1', router(1, a.tiles.pic('green')), { next: 'router0', ntime: 6 });
  sign(['WATER UNDER', 'THE BRIDGE'], 3, { board: 'blue', ink: 'paper' }).forEach((px, i) => a.solid(`bridgeSign${i}`, px));
  const little = (s: number) => figure({ shirt: ['red', 3], pants: ['brown', 1], hair: ['brown', 2], small: true, arms: 'up', face: 'sad' }, s);
  a.monster('little', [[little(0), 3], [little(1), 3]], { hazard: true, path: [[4, 0, 2], [-4, 0, 2]] });

  // the hallway's guest: Teddy, in the sunglasses of the future
  const cool = (s: number) => {
    const p = corgi(s);
    p.rect(14, 8, 5, 2, c('ink', 0));
    return p;
  };
  a.monster('teddyCool', [[cool(0), 4], [cool(1), 4]], { path: [[6, 0, 2], [-6, 0, 2]] });
}

export const FUTURE: WingSpec = {
  wing: WINGS[7],
  tint: 'sky',
  egg: [['teal', 3], ['grey', 5], ['red', 3]],
  signs: [
    ['BOOKS FROM', 'THE FUTURE:', 'NO SPOILERS'],
    ['WHO IS', 'CHATGPT?', ''],
  ],
  guest: 'teddyCool',
  art,
  books: [
    {
      n: 28,
      floor: 'studio',
      rows: [
        '#NNNN123NNNNNNN#',
        '#o.bbbbbb....+.#',
        '#~.l.kq.l..A...#',
        '#*...........o.#',
        '#....t.........#',
        '#+..o...@..p.w.#',
        '#~.........a...#',
        '#o..+......*...#',
        '#.~....+.....o.E',
        '##X############L',
      ],
      legend: {
        N: 'sniper',
        b: 'backdrop',
        l: 'slight',
        k: 'king',
        q: 'queen',
        t: 'tripod',
        p: 'nancyP',
        w: 'laptop',
        '1': 'portraits0',
        '2': 'portraits1',
        '3': 'portraits2',
        A: { tile: '.', mon: 'agent' },
        a: { tile: '.', mon: 'agentH' },
      },
      note: 'A family portrait for the King and Queen. The family is off saving the world. The Secret Service is not; it hands out fines.',
      twist: {
        grid: [
          ['king', 'queen', 'slight'],
          ['tripod', 'portrait', 'nancyP'],
        ],
        caption: ['FIG. 28: "Don\'t you need to take', 'our picture first?" "Nope."'],
      },
    },
    {
      n: 32,
      floor: 'konbini',
      rows: [
        '#ffff123ffffff##',
        '#o...........+.#',
        '#.gggg..gggg.~.#',
        '#*........T....#',
        '#.gggg..gggg.o.#',
        '#+..o...@......#',
        '#..Q.......s.~o#',
        '#o..+...rccc*..#',
        '#~.....+.......E',
        '####X##########L',
      ],
      legend: {
        f: 'teafridge',
        g: 'onigiri',
        r: 'register',
        c: 'chicken',
        s: 'socks',
        '1': 'konbiniSign0',
        '2': 'konbiniSign1',
        '3': 'konbiniSign2',
        T: { tile: '.', mon: 'tea' },
        Q: { tile: '.', mon: 'question' },
      },
      note: 'A konbini in Tokyo. Thirty kinds of rice ball. The tea is the one thing you can never get. The cashier\'s questions cost you points.',
      twist: {
        grid: [
          ['onigiri', 'm:tea#0', 'teafridge'],
          ['chicken', 'register', 'socks'],
        ],
        caption: ['FIG. 32: So many questions.', '"Yes."'],
      },
    },
    {
      n: 27,
      floor: 'cube',
      rows: [
        '#www123wwwwwwww#',
        '#o.....d.j...+.#',
        '#~...........o.#',
        '#*...F.........#',
        '#BBBBBBB..BBBBB#',
        '#+..o...@......#',
        '#..TU.......~..#',
        '#o..+...s..*...#',
        '#~..o....+.....E',
        '#X#############L',
      ],
      legend: {
        w: 'cubewall',
        d: 'odesk',
        j: 'jarold',
        B: 'alleywall',
        T: 'truck0',
        U: 'truck1',
        s: 'seller',
        '1': 'jaroldSign0',
        '2': 'jaroldSign1',
        '3': 'jaroldSign2',
        F: { tile: '.', mon: 'leaf' },
      },
      note: 'Take care of Jarold, says the manager. Jarold is a ficus. Jarold is dead on arrival. There is an ad. There is an alley. The falling leaves are a fineable offense.',
      twist: {
        grid: [
          ['jarold', 'odesk', 'jaroldJr'],
          ['truck0', 'truck1', 'seller'],
        ],
        caption: ['FIG. 27: Jarold Jr. is thriving.', 'Craigslist said it was healthy.'],
      },
    },
    {
      n: 9,
      floor: 'green',
      rows: [
        '#hhh123hhhhhhhh#',
        '#o..........+..#',
        '#~..b......l...#',
        '#*..B..........#',
        '#ssssssskssssss#',
        '#+..o...@......#',
        '#..~..v......o.#',
        '#o..+...R..*...#',
        '#~.......+...o.E',
        '#X#############L',
      ],
      legend: {
        h: 'cottage',
        b: 'bobTop',
        B: 'bobBot',
        s: 'stream',
        k: 'bridge',
        v: 'shards',
        R: 'router0',
        '1': 'bridgeSign0',
        '2': 'bridgeSign1',
        '3': 'bridgeSign2',
        l: { tile: '.', mon: 'little' },
      },
      note: 'Bob the giant is not bright, but the village finds him odd jobs. Something got broken. Something got crushed. The little person is very upset, and fines everyone.',
      twist: {
        grid: [
          ['bobTop', 'cottage', null],
          ['bobBot', 'router0', 'shards'],
        ],
        caption: ['FIG. 9: Bob grinned.', '"Router!"'],
      },
    },
  ],
};
