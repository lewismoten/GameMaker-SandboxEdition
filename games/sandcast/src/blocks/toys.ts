// Toys left in the sandbox (ABC blocks, a two-block dump truck, a pail, a rubber duck),
// sticker burrs that prick (hp -2), and the secret hole that looks like an ant hole but is
// really a scene link.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { GRASS, OCHRE, RED, SAND, STEEL, WATER, YELLOW } from '../art/palette';
import { Pixels, art, ball, bevel, rng, shade, tile } from '../art/draw';
import { SOLID, bg, onSand, sand, sprite20 } from './common';

export function addToys(): void {
  // ---------------------------------------------------------------- toys left in the sandbox
  function abc(ramp: number[], ch: string): Pixels {
    const p = tile();
    bevel(p, 0, 0, 20, 20, ramp, 3, 2);
    p.frame(3, 3, 14, 14, shade(ramp, 1));
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.rect(4 + x * 1.5, 4 + y * 1.5, 2, 2, STEEL[7]);
    return p;
  }
  bg.add('toyA', abc(RED, 'A'), { solid: SOLID });
  bg.add('toyB', abc(WATER.slice(1, 8), 'B'), { solid: SOLID });
  bg.add('toyC', abc(GRASS, 'C'), { solid: SOLID });
  {
    // A yellow dump truck, two blocks long (cab on the right).
    const big = new Pixels(40, 20, 255);
    bevel(big, 1, 2, 24, 16, YELLOW, 3, 2);
    big.rect(4, 5, 18, 10, YELLOW[1]).rect(5, 6, 16, 8, SAND[5]);
    for (let k = 0; k < 12; k++) big.set(6 + ((k * 7) % 14), 7 + ((k * 5) % 6), SAND[7]);
    bevel(big, 26, 3, 12, 14, RED, 4, 2);
    big.rect(30, 5, 6, 10, WATER[6]).rect(31, 6, 2, 3, WATER[9]);
    for (const x of [4, 18, 30]) {
      big.rect(x, 0, 6, 2, STEEL[1]);
      big.rect(x, 18, 6, 2, STEEL[1]);
    }
    bg.add('truckL', onSand(141, big.crop(0, 0, 20, 20)), { solid: SOLID });
    bg.add('truckR', onSand(142, big.crop(20, 0, 20, 20)), { solid: SOLID });
  }
  {
    // Somebody's upturned pail: a little round castle of its own.
    const p = sprite20();
    ball(p, 9.5, 9.5, 9, WATER.slice(2, 9), 3);
    p.ring(9.5, 9.5, 6, WATER[2]).ring(9.5, 9.5, 8.6, WATER[1]);
    p.disc(9.5, 9.5, 2, WATER[6]);
    bg.add('pail', onSand(143, p), { solid: SOLID });
  }
  {
    const p = art(
      [
        '',
        '          kkkk',
        '         kYYYYk',
        '        kYYwkYk',
        '        kYYYYYkOOk',
        '        kYYYYYYOOk',
        '   kk    kYYYYkkk',
        '  kYYk  kYYYYYYk',
        '  kYYYkkYYYYYYYYk',
        '  kYYYYYYYYYYYYYYk',
        '   kYYYYYYYYYYYyyk',
        '   kYYYYYYYYYYyyyk',
        '    kYYYYYYYYyyyk',
        '     kyyyyyyyyyk',
        '      kkkkkkkkk',
      ],
      { k: YELLOW[0], Y: YELLOW[3], y: YELLOW[2], w: STEEL[7], O: RED[4] },
    );
    bg.add('duck', onSand(144, p, true), { solid: SOLID });
  }
  {
    // Sticker weeds: they prick.
    const p = sprite20();
    const r = rng(145);
    for (let k = 0; k < 7; k++) {
      const x = 3 + Math.floor(r() * 13);
      const y = 4 + Math.floor(r() * 12);
      p.line(x, y, x + 3, y - 3, GRASS[2]).line(x, y, x - 2, y - 3, GRASS[3]);
      ball(p, x, y, 2.2, GRASS, 4);
      p.set(x - 2, y, STEEL[7])
        .set(x + 2, y + 1, STEEL[7])
        .set(x, y - 2, STEEL[7])
        .set(x + 1, y + 2, STEEL[6]);
    }
    bg.add('burr', onSand(146, p), { solid: SOLID, hp: -2 });
  }
  // Secret hole: looks like a little ant hole in the sand (a link to somewhere else).
  {
    const p = sand(147);
    p.disc(10, 11, 2.2, OCHRE[1]).disc(10, 11, 1.2, 0).set(8, 9, SAND[8]).set(12, 13, SAND[3]);
    bg.add('hole', p);
  }
}
