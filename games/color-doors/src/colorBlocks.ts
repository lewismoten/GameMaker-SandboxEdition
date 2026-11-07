// COLOR DOORS' own blocks, added to the Starter block set before the signs:
//   swatch.*     a flat tile of one plain color (eight of them), laid three wide and two high to make a swatch
//   wall         a pale stone wall to hang the swatches and signs on
//   doorTopW, doorBottomW, doorwayTopW, doorwayBottomW   the Starter doors with the wall behind them instead of sky
//   lampTop, lampMid, lampBottom, pole   a traffic light: red on top, amber in the middle, green at the bottom
//   tableTop, tableLeg   a plain wooden table
//   apple banana lime grapes orange   five fruits, each its own shape
//   rose sun iris bluebell   four flowers on green stems
// None of them does anything: the colors are the lesson, so every block here is only a picture.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** The eight swatch colors, by the word the label under each swatch says. Plain, saturated and common. */
export const SWATCHES: { word: string; rgb: RGB }[] = [
  { word: 'RED', rgb: [222, 36, 40] },
  { word: 'ORANGE', rgb: [250, 140, 16] },
  { word: 'YELLOW', rgb: [252, 228, 24] },
  { word: 'GREEN', rgb: [36, 168, 56] },
  { word: 'BLUE', rgb: [36, 84, 224] },
  { word: 'PURPLE', rgb: [140, 56, 196] },
  { word: 'PINK', rgb: [250, 140, 190] },
  { word: 'BROWN', rgb: [124, 76, 38] },
];

/** The palette ramps this game adds after the shared ones (one color each, so no shared index moves). */
export const swatchRamps = (b: { ramp: (n: string, k: number, a: RGB, z: RGB) => number[] }): void => {
  for (const s of SWATCHES) b.ramp(`sw-${s.word}`, 1, s.rgb, s.rgb);
  b.ramp('sw-amber', 1, [255, 190, 20], [255, 190, 20]);
  b.ramp('sw-limeGreen', 1, [130, 210, 40], [130, 210, 40]);
  // the title's three lights and their mixes
  const lights: [string, RGB][] = [
    ['red', [255, 40, 40]],
    ['green', [40, 255, 40]],
    ['blue', [50, 70, 255]],
    ['yellow', [255, 255, 40]],
    ['cyan', [40, 255, 255]],
    ['magenta', [255, 50, 255]],
    ['white', [255, 255, 255]],
  ];
  for (const [n, rgb] of lights) b.ramp(`lt-${n}`, 1, rgb, rgb);
};

const lower = (w: string): string => w.toLowerCase();
export const swatchBlock = (word: string): string => `swatch.${lower(word)}`;

/** The wall's color index and a way to put the wall behind a block that was drawn on sky. */
export const wallColor = (pal: Pal): number => pal.c('stone', 3);
const onWall = (pal: Pal, pic: Pixels): Pixels => new Pixels(20, 20).blit(pic, 0, 0).map((_x, _y, c) => (c === skyOf(pal) ? wallColor(pal) : c));

export function addColorBlocks(book: Book, pal: Pal): void {
  const { c, r } = pal;
  const sky = skyOf(pal);
  const ink = c('ink', 0);
  const air = { grav: PULL.down };

  // ---- swatch tiles: flat color, no edge, so three by two of them read as one swatch
  for (const s of SWATCHES) {
    const col = pal.c(`sw-${s.word}`, 0);
    const p = new Pixels(20, 20, col);
    book.add(swatchBlock(s.word), p, air);
  }

  // ---- the wall: pale stone in courses, very quiet
  {
    const p = new Pixels(20, 20, wallColor(pal));
    p.rect(0, 9, 20, 1, c('stone', 2)).rect(0, 19, 20, 1, c('stone', 2));
    p.rect(5, 0, 1, 9, c('stone', 2)).rect(15, 10, 1, 9, c('stone', 2));
    book.add('wall', p, air);
  }
  // the Starter doors again, with the wall behind them
  for (const [name, from] of [
    ['doorTopW', 'doorTop'],
    ['doorBottomW', 'doorBottom'],
    ['doorwayTopW', 'doorwayTop'],
    ['doorwayBottomW', 'doorwayBottom'],
  ] as const)
    book.add(name, onWall(pal, book.pics.get(from)!), air);

  // ---- a traffic light: a dark box, a round lamp in each of three blocks
  const lamp = (name: string, lit: number, hi: number, role: 'top' | 'mid' | 'bottom') => {
    const p = new Pixels(20, 20, sky);
    p.rect(3, role === 'top' ? 2 : 0, 14, role === 'bottom' ? 18 : role === 'top' ? 18 : 20, ink);
    p.rect(4, role === 'top' ? 3 : 0, 12, role === 'bottom' ? 16 : role === 'top' ? 17 : 20, c('stone', 0));
    p.disc(10, 10, 6.4, ink).disc(10, 10, 5.4, lit).disc(8, 8, 1.6, hi);
    book.add(name, p, air);
  };
  lamp('lampTop', c('red', 2), c('red', 4), 'top');
  lamp('lampMid', c('sw-amber', 0), c('gold', 5), 'mid');
  lamp('lampBottom', c('green', 2), c('green', 4), 'bottom');
  {
    const p = new Pixels(20, 20, sky);
    p.rect(8, 0, 4, 20, c('stone', 1)).rect(8, 0, 1, 20, c('stone', 3)).rect(11, 0, 1, 20, c('stone', 0));
    book.add('pole', p, air);
  }

  // ---- a table and fruit
  {
    const w = r('wood');
    const top = new Pixels(20, 20, sky);
    top.rect(0, 14, 20, 6, w[2]).rect(0, 14, 20, 1, w[4]).rect(0, 19, 20, 1, w[0]);
    book.add('tableTop', top, { ...air, solid: 0 });
    const leg = new Pixels(20, 20, sky);
    leg.rect(8, 0, 4, 20, w[2]).rect(8, 0, 1, 20, w[4]).rect(11, 0, 1, 20, w[1]);
    book.add('tableLeg', leg, air);
  }
  const fruit = (name: string, draw: (p: Pixels) => void) => {
    const p = new Pixels(20, 20, sky);
    draw(p);
    book.add(name, p, air);
  };
  const stem = (p: Pixels, x: number, y: number) => p.rect(x, y, 2, 4, c('wood', 1)).rect(x + 2, y, 4, 2, c('green', 2));
  fruit('apple', (p) => {
    p.disc(7, 12, 5.6, ink).disc(13, 12, 5.6, ink).disc(7, 12, 4.6, c('sw-RED', 0)).disc(13, 12, 4.6, c('sw-RED', 0));
    p.rect(7, 12, 7, 6, c('sw-RED', 0)).rect(7, 7, 7, 4, c('sw-RED', 0));
    p.disc(6, 11, 1.4, c('red', 4)).set(9, 8, ink);
    stem(p, 9, 3);
  });
  fruit('banana', (p) => {
    // a crescent: a row of discs along a shallow curve, dark outline first, then the yellow
    const bend = (t: number) => [2 + t * 16, 5 + 8 * (1 - 4 * (t - 0.5) * (t - 0.5))] as const;
    for (let t = 0; t <= 1; t += 0.04) p.disc(bend(t)[0], bend(t)[1] + 1, 3.4, ink);
    for (let t = 0; t <= 1; t += 0.04) p.disc(bend(t)[0], bend(t)[1] + 1, 2.4, c('sw-YELLOW', 0));
    p.rect(1, 2, 3, 3, c('wood', 1));
  });
  fruit('lime', (p) => {
    p.disc(10, 12, 7, ink).disc(10, 12, 6, c('sw-limeGreen', 0)).disc(8, 10, 1.7, c('green', 4));
    p.rect(9, 2, 2, 4, c('wood', 1)).rect(11, 3, 5, 2, c('green', 2));
  });
  fruit('grapes', (p) => {
    const dots = [
      [6, 7],
      [10, 7],
      [14, 7],
      [8, 11],
      [12, 11],
      [10, 15],
    ];
    for (const [x, y] of dots) p.disc(x, y, 3.5, ink);
    for (const [x, y] of dots) p.disc(x, y, 2.7, c('sw-PURPLE', 0)).set(x - 1, y - 1, c('purple', 4));
    p.rect(10, 1, 2, 3, c('wood', 1)).rect(11, 2, 5, 2, c('green', 2));
  });
  fruit('orange', (p) => {
    p.disc(10, 12, 7, ink).disc(10, 12, 6, c('sw-ORANGE', 0)).disc(8, 10, 1.7, c('orange', 4));
    for (const [x, y] of [
      [8, 13],
      [12, 11],
      [10, 15],
      [13, 14],
      [7, 10],
    ])
      p.set(x, y, c('orange', 1));
    p.set(10, 6, c('green', 1)).rect(10, 4, 4, 2, c('green', 2));
  });

  // ---- flowers on green stems
  const flower = (name: string, petal: number, light: number, heart: number, shape: 'round' | 'star' | 'bell' | 'plain') => {
    const p = new Pixels(20, 20, sky);
    p.rect(9, 9, 2, 11, c('green', 1)).rect(11, 14, 4, 2, c('green', 2)).rect(5, 12, 4, 2, c('green', 2));
    if (shape === 'bell') {
      p.disc(10, 6, 4.5, ink).disc(10, 6, 3.5, petal).rect(6, 7, 9, 4, ink).rect(7, 7, 7, 3, petal);
      p.set(7, 11, ink).set(10, 11, ink).set(13, 11, ink);
    } else {
      const arms: [number, number][] =
        shape === 'star'
          ? [
              [0, -5],
              [5, 0],
              [0, 5],
              [-5, 0],
              [3, -3],
              [3, 3],
              [-3, 3],
              [-3, -3],
            ]
          : [
              [0, -4],
              [4, 0],
              [0, 4],
              [-4, 0],
            ];
      for (const [dx, dy] of arms) p.disc(10 + dx, 7 + dy, 3.4, ink);
      for (const [dx, dy] of arms) p.disc(10 + dx, 7 + dy, 2.6, petal);
      p.disc(10, 7, 3, heart).set(9, 6, light);
    }
    book.add(name, p, air);
  };
  flower('rose', c('sw-RED', 0), c('red', 4), c('gold', 3), 'round');
  flower('sun', c('sw-YELLOW', 0), c('gold', 5), c('dirt', 1), 'star');
  flower('iris', c('sw-PURPLE', 0), c('purple', 4), c('gold', 4), 'plain');
  flower('bluebell', c('sw-BLUE', 0), c('blue', 4), c('white', 3), 'bell');
  void SOLID;
}
