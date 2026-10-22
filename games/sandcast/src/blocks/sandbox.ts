// The sandbox itself: sand floors, the wooden frame and the lawn around it, the toy chest,
// and the dunes Teddy digs through with his shovel (dune -> dune1 -> sand, each touch
// spending a shovel counter and the second one paying out a scoop of sand).
import { GRASS, OCHRE, RED, SAND, STEEL, WATER, WOOD, YELLOW } from '../art/palette';
import { CTR } from '../rules';
import { Pixels, bevel, pebbles, ripples, rng, sandTexture, shade, tile } from '../art/draw';
import { SOLID, bg, sand } from './common';

export function addSandbox(): void {
  // ---------------------------------------------------------------- sand floors
  bg.add('sand0', sand(11));
  bg.add('sand1', ripples(sand(12), 3));
  bg.add('sand2', pebbles(sand(13), 5, 2));
  bg.add('sand3', sand(14));
  // Packed courtyard sand inside the castles: pressed squares.
  bg.add(
    'court',
    sandTexture(21, 6, SAND, 0.14).map((x, y, c) => (x % 10 === 0 || y % 10 === 0 ? SAND[5] : x % 10 === 1 || y % 10 === 1 ? SAND[7] : c)),
  );
  // Damp sand (dark): paths, beaches.
  bg.add('damp', sandTexture(22, 3, OCHRE, 0.2));

  // ---------------------------------------------------------------- the sandbox frame and the lawn
  {
    const r = rng(31);
    const grass = tile().map(() => shade(GRASS, 2 + Math.floor(r() * 3)));
    for (let k = 0; k < 26; k++) {
      const x = Math.floor(r() * 20);
      const y = Math.floor(r() * 20);
      grass.line(x, y, x + (r() > 0.5 ? 1 : -1), y - 2 - Math.floor(r() * 2), shade(GRASS, 5 + Math.floor(r() * 2)));
    }
    for (let k = 0; k < 2; k++) {
      const x = 3 + Math.floor(r() * 14);
      const y = 3 + Math.floor(r() * 14);
      grass
        .set(x, y, YELLOW[4])
        .set(x + 1, y, YELLOW[3])
        .set(x, y + 1, YELLOW[2]);
    }
    bg.add('grass', grass, { solid: SOLID });
  }
  function plank(vertical: boolean): Pixels {
    const p = tile();
    const r = rng(vertical ? 41 : 42);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const a = vertical ? x : y;
        const b = vertical ? y : x;
        let c = 4;
        if (a === 0 || a === 10) c = 6;
        else if (a === 9 || a === 19) c = 1;
        else if ((b * 3 + a * 7 + Math.floor(r() * 3)) % 17 === 0) c = 2;
        else if (Math.sin(b / 2.3 + a * 1.7) > 0.85) c = 3;
        p.set(x, y, WOOD[c]);
      }
    const nail = (x: number, y: number) =>
      p
        .set(x, y, STEEL[6])
        .set(x + 1, y, STEEL[3])
        .set(x, y + 1, STEEL[2]);
    if (vertical) {
      nail(4, 3);
      nail(14, 15);
    } else {
      nail(3, 4);
      nail(15, 14);
    }
    return p;
  }
  bg.add('boardH', plank(false), { solid: SOLID });
  bg.add('boardV', plank(true), { solid: SOLID });
  {
    const p = tile(WOOD[1]);
    p.rect(1, 1, 18, 18, WOOD[3]);
    for (let k = 0; k < 4; k++) p.frame(2 + k * 2, 2 + k * 2, 16 - k * 4, 16 - k * 4, WOOD[k % 2 ? 4 : 5]);
    p.rect(1, 1, 18, 1, WOOD[6]).rect(1, 1, 1, 18, WOOD[5]);
    bg.add('post', p, { solid: SOLID });
  }
  // Teddy's toy chest (and, on top of it, his favorite napping spot).
  {
    const p = tile(WOOD[1]);
    bevel(p, 0, 0, 20, 20, WOOD, 4, 2);
    p.rect(0, 9, 20, 2, WOOD[1]).rect(8, 7, 4, 6, YELLOW[3]).rect(9, 8, 2, 3, YELLOW[0]);
    p.rect(2, 2, 3, 3, RED[4]).rect(15, 14, 3, 3, WATER[5]).rect(15, 2, 3, 3, GRASS[5]);
    bg.add('chest', p, { solid: SOLID });
  }

  // ---------------------------------------------------------------- dunes (dig with the shovel)
  function dune(stage: number): Pixels {
    const p = sand(51 + stage);
    const r = rng(60 + stage);
    const h = [9, 6, 3][stage];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x - 10) / 10;
        const dy = (y - 11) / 9;
        const d = dx * dx + dy * dy;
        if (d > 1.05 - stage * 0.25) continue;
        const lit = -dx * 0.9 - dy + (r() - 0.5) * 0.5;
        p.set(x, y, shade(SAND, 5 + lit * 2.2 + (h - 6) / 4));
      }
    if (stage > 0) {
      // Shovel bites.
      p.rect(6, 6, 4, 3, SAND[2]).rect(7, 7, 2, 1, SAND[1]);
      p.rect(11, 10, 3, 3, SAND[2]).rect(12, 11, 1, 1, SAND[1]);
    }
    if (stage > 1) p.rect(3, 13, 14, 3, SAND[3]);
    return p;
  }
  bg.add('dune', dune(0), { solid: SOLID, effect: CTR.shovel, eamt: -1, touch: 'dune1' });
  bg.add('dune1', dune(1), { solid: SOLID, effect: CTR.sand, eamt: 1, score: 10, touch: 'sand2' });
}
