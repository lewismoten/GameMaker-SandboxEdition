// The burrows under the sandbox: packed earth, root-laced walls, cracks, the ants' nest,
// a door through the roots, acorns, mushrooms and the ladder back up. The burrow scenes
// load burrow.pal, a darker tint of the day palette, so they look underground.
import { BEETLE, GRASS, OCHRE, RED, SAND, STEEL, WOOD, YELLOW } from '../art/palette';
import { CTR, MON } from '../rules';
import { Pixels, art, ball, dither, rng, sandTexture, shade } from '../art/draw';
import { SOLID, bg, onSand, sprite20 } from './common';

export function addBurrows(): void {
  // ---------------------------------------------------------------- the burrows (underground)
  function burrowWall(seed: number, root: boolean): Pixels {
    const p = sandTexture(seed, 2, OCHRE, 0.35);
    const r = rng(seed + 1);
    for (let k = 0; k < 5; k++) {
      const x = Math.floor(r() * 18);
      const y = Math.floor(r() * 18);
      p.rect(x, y, 3, 2, OCHRE[1]).set(x, y, OCHRE[4]);
    }
    if (root) {
      let x = 4 + r() * 4;
      for (let y = 0; y < 20; y++) {
        x += (r() - 0.5) * 1.6;
        p.rect(x, y, 2, 1, WOOD[2]).set(x, y, WOOD[4]);
        if (y === 12) p.line(x, y, x + 6, y + 5, WOOD[3]);
      }
    }
    return p;
  }
  bg.add('earth', burrowWall(151, false), { solid: SOLID });
  bg.add('roots', burrowWall(153, true), { solid: SOLID });
  {
    const p = burrowWall(151, false).map((x, y, c) => (Math.abs(x - 9 - Math.sin(y / 2) * 2) < 0.8 ? OCHRE[0] : c));
    p.line(9, 4, 4, 8, OCHRE[0]).line(11, 12, 16, 15, OCHRE[0]);
    bg.add('crack', p);
  }
  {
    const p = sandTexture(155, 2, OCHRE, 0.2);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const d = Math.hypot(x - 10, y - 10);
        if (d < 8) p.set(x, y, shade(OCHRE, 3 - d / 3 + (y < 10 ? 1 : 0)));
      }
    p.disc(10, 10, 3.5, 0).set(8, 9, BEETLE[4]).set(12, 11, BEETLE[3]);
    bg.add('nest', p, { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'plugged', birthMon: MON.beetleChase, birthTime: 90 });
  }
  {
    const p = sandTexture(156, 3, SAND, 0.25);
    for (let k = 0; k < 6; k++) {
      const x0 = 1 + k * 3.3;
      for (let y = 0; y < 20; y++) {
        const x = x0 + Math.sin(y / 3 + k) * 1.2;
        p.rect(x, y, 2, 1, WOOD[k % 2 ? 2 : 3]).set(x, y, WOOD[5]);
      }
    }
    p.rect(7, 8, 6, 4, WOOD[1]).rect(8, 9, 4, 2, YELLOW[1]);
    bg.add('rootDoor', p, { solid: SOLID, effect: CTR.acorns, eamt: -1, score: 100, touch: 'sand0' });
  }
  {
    const p = art(
      [
        '',
        '',
        '         kk',
        '        ky',
        '     kkkkkkkkk',
        '    kWwWWWWWWWk',
        '    kWWWWWWWWWk',
        '    kkkkkkkkkkk',
        '     kAaAAAAAk',
        '     kAaAAAAAk',
        '     kAAAAAAak',
        '      kAAAAak',
        '       kAAak',
        '        kak',
        '         k',
      ],
      { k: WOOD[0], y: WOOD[4], W: WOOD[3], w: WOOD[5], A: WOOD[4], a: WOOD[6] },
    );
    bg.add('acorn', onSand(157, p), { effect: CTR.acorns, eamt: 1, score: 100, touch: 'sand0' });
  }
  for (const [name, frame] of [
    ['glow', 0],
    ['glow2', 1],
  ] as const) {
    const p = burrowWall(159, false);
    const c = [10, 10];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const d = Math.hypot(x - c[0], y - c[1]);
        if (d < (frame ? 7 : 5) && dither(x, y, 1 - d / 7)) p.set(x, y, GRASS[frame ? 6 : 5]);
      }
    p.rect(8, 9, 5, 2, YELLOW[4]).set(13, 9, GRASS[6]);
    bg.add(name, p, { solid: SOLID, next: frame ? 'glow' : 'glow2', ntime: frame ? 7 : 19 });
  }
  {
    const p = sprite20();
    ball(p, 10, 8, 7, RED, 4);
    for (const [x, y] of [
      [7, 5],
      [12, 7],
      [9, 10],
      [14, 4],
    ])
      p.disc(x, y, 1.2, STEEL[7]);
    p.rect(8, 13, 5, 6, SAND[8]).rect(8, 13, 5, 1, SAND[5]);
    bg.add('mushroom', onSand(160, p), { solid: SOLID });
  }
  {
    const p = sandTexture(161, 2, OCHRE, 0.2);
    p.rect(4, 0, 2, 20, WOOD[4]).rect(14, 0, 2, 20, WOOD[3]);
    for (let y = 2; y < 20; y += 5) p.rect(4, y, 12, 2, WOOD[5]).rect(4, y + 2, 12, 1, WOOD[1]);
    for (let y = 0; y < 20; y++) for (let x = 6; x < 14; x++) if (dither(x, y, (20 - y) / 40)) p.set(x, y, YELLOW[4]);
    bg.add('ladder', p);
  }
}
