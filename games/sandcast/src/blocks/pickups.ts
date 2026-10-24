// Things Teddy picks up: piles of wet sand, shells and starfish, tennis balls, the golden
// shells that open the sea gate, ice pops, juice (an extra life), water balloons, the
// shovel and the bucket. Each is an object block whose touch adds to a counter
// (effect/eamt) and turns it back into plain sand. Returns the juice art, which the BBS
// room draws again over its own floor.
import { GRASS, OCHRE, PINK, RED, SAND, STEEL, WATER, WOOD, YELLOW } from '../art/palette';
import { CTR, SEQ } from '../rules';
import { Pixels, art, ball, dither, shade } from '../art/draw';
import { SOLID, bg, onSand, sprite20 } from './common';

export function addPickups(): Pixels {
  let juiceArt!: Pixels;
  // ---------------------------------------------------------------- pickups
  {
    // A bucketful of wet sand, turned out like a little turret: scoop it up.
    const p = sprite20();
    for (let y = 4; y < 18; y++)
      for (let x = 4; x < 16; x++) {
        const t = (x - 4) / 11;
        const ridge = (x - 4) % 3 === 0 ? -0.8 : 0;
        p.set(x, y, shade(SAND, 7.4 - t * 3.4 + ridge + (y > 15 ? -0.8 : 0)));
      }
    for (let x = 4; x < 16; x++) p.set(x, 18, SAND[2]);
    // Top: an ellipse with notches.
    for (let y = 2; y < 7; y++)
      for (let x = 4; x < 16; x++) {
        const dx = (x - 9.5) / 6;
        const dy = (y - 4.5) / 2.5;
        if (dx * dx + dy * dy <= 1) p.set(x, y, (x + 1) % 4 === 0 && y < 4 ? SAND[5] : shade(SAND, 8.6 - dy * 0.6));
      }
    p.set(6, 8, SAND[9]).set(7, 12, SAND[9]).set(5, 15, SAND[8]);
    p.set(17, 3, STEEL[7]).set(17, 2, STEEL[5]).set(17, 4, STEEL[5]).set(16, 3, STEEL[5]).set(18, 3, STEEL[5]);
    bg.add('pile', onSand(71, p), { effect: CTR.sand, eamt: 1, score: 5, touch: 'sand0' });
  }
  {
    // A squeaky rubber bone: one of Teddy's toys, scattered by Gwinn. Points.
    const p = sprite20();
    const bone = (x0: number, y0: number, x1: number, y1: number) => {
      for (let t = 0; t <= 1; t += 0.05) p.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2.2, PINK[2]);
      for (const [x, y] of [
        [x0, y0],
        [x1, y1],
      ])
        for (const d of [-1, 1]) ball(p, x + d * 2, y - d * 2, 2.6, PINK, 2);
    };
    bone(5, 14, 15, 5);
    p.line(7, 11, 12, 6, PINK[3]).set(9, 9, STEEL[7]);
    bg.add('shell', onSand(72, p), { score: 100, effect: CTR.toys, eamt: 1, touch: 'sand0' });
  }
  {
    // A flying disc, chewed at the edge. Lots of points.
    const p = sprite20();
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x - 10) / 8.5;
        const dy = (y - 10) / 6.5;
        const d = dx * dx + dy * dy;
        if (d <= 1) p.set(x, y, d > 0.7 ? RED[2] : d < 0.25 ? RED[5] : shade(RED, 4 - dy));
      }
    p.ring(10, 10, 4, RED[2]);
    for (const [x, y] of [
      [16, 13],
      [17, 12],
      [3, 7],
    ])
      p.set(x, y, 255);
    p.set(7, 7, STEEL[7]).set(8, 6, STEEL[7]);
    bg.add('starfish', onSand(73, p), { score: 500, effect: CTR.toys, eamt: 1, touch: 'sand0' });
  }
  {
    // A tennis ball: P picks it up, F tosses it. Gwinn will drop anything for one.
    const p = sprite20();
    ball(p, 10, 11, 5, YELLOW, 3);
    for (let y = 5; y < 17; y++) for (let x = 4; x < 16; x++) if (Math.hypot(x - 10, y - 11) <= 5 && dither(x, y, 0.35)) p.set(x, y, GRASS[5]);
    for (let t = -5; t <= 5; t += 0.5) p.set(10 + t, 11 + Math.cos(t / 1.7) * 2 - 1, STEEL[7]);
    p.set(8, 8, STEEL[7]);
    bg.add('tennis', onSand(70, p), { effect: SEQ.fetch, eamt: 1, score: 25, touch: 'sand0' });
  }
  {
    // A can of tennis balls, seen from above, set down wherever Gwinn naps across the way:
    // walk into it for another ball, as many times as you like, so throwing every ball away
    // can never leave Teddy stuck behind her.
    const p = sprite20();
    p.disc(10, 10, 9, STEEL[6]).disc(10, 10, 8, STEEL[2]);
    for (const [x, y] of [
      [7, 7],
      [13, 8],
      [9, 13],
    ]) {
      ball(p, x, y, 3.2, YELLOW, 3);
      p.set(x - 1, y - 1, STEEL[7]);
    }
    p.rect(3, 9, 1, 3, STEEL[7]);
    bg.add('ballCan', onSand(80, p), { solid: SOLID, effect: SEQ.fetch, eamt: 1 });
  }
  {
    // Golden conch shell.
    const p = sprite20();
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const dx = (x - 9) / 7;
        const dy = (y - 10) / 8;
        if (dx * dx + dy * dy > 1) continue;
        const spiral = Math.sin(Math.atan2(dy, dx) * 2 + Math.sqrt(dx * dx + dy * dy) * 9);
        p.set(x, y, shade(YELLOW, 2.2 + spiral * 1.2 - dx - dy * 0.6));
      }
    p.rect(14, 12, 4, 5, YELLOW[1]).rect(15, 13, 2, 3, PINK[2]);
    p.set(4, 4, STEEL[7]).set(3, 4, YELLOW[4]).set(5, 4, YELLOW[4]).set(4, 3, YELLOW[4]).set(4, 5, YELLOW[4]);
    p.set(15, 3, STEEL[7]).set(16, 3, YELLOW[4]).set(15, 2, YELLOW[4]);
    bg.add('goldShell', onSand(74, p), { effect: CTR.shells, eamt: 1, score: 250, touch: 'sand0' });
  }
  {
    // A bone-shaped dog biscuit (health).
    const p = art(
      [
        '',
        '',
        '',
        '',
        '  kkk         kkk',
        ' kBBBk       kBBBk',
        ' kBwBBkkkkkkkBBbBk',
        '  kBBBBBBBBBBBBBk',
        '   kBBwBBdBBdBBk',
        '   kBdBBBBBBBBBk',
        '  kBBBBBBBBBBBBBk',
        ' kBwBBkkkkkkkBBbBk',
        ' kBBbk       kbBBk',
        '  kkk         kkk',
      ],
      { k: WOOD[0], B: WOOD[5], b: WOOD[4], w: WOOD[6], d: WOOD[3] },
    );
    bg.add('icepop', onSand(75, p), { hp: 40, touch: 'sand0' });
  }
  {
    // A jar of peanut butter (extra life: no corgi can resist it).
    const p = art(
      [
        '',
        '',
        '     kkkkkkkkk',
        '    kRRRRRRRRrk',
        '    kRwRRRRRRrk',
        '    kkkkkkkkkkk',
        '    kPPPPPPPPpk',
        '    kWWWWWWWWwk',
        '    kWrrWrWrWwk',
        '    kWrWWrWrWwk',
        '    kWWWWWWWWwk',
        '    kPPPPPPPPpk',
        '    kPwPPPPPPpk',
        '    kPPPPPPPPpk',
        '     kkkkkkkkk',
      ],
      { k: OCHRE[0], R: RED[4], r: RED[2], w: STEEL[7], P: OCHRE[5], p: OCHRE[3], W: STEEL[7] },
    );
    p.map((_x, y, c) => (c === RED[2] && y > 5 ? RED[4] : c));
    bg.add('juice', onSand(76, p), { effect: CTR.lives, eamt: 1, score: 200, touch: 'sand0' });
    juiceArt = p;
  }
  {
    // Water balloon: three splashes for the bucket.
    const p = sprite20();
    ball(p, 9.5, 9, 6.5, WATER, 5);
    p.rect(9, 15, 2, 2, WATER[2]).rect(8, 17, 4, 1, WATER[3]);
    p.set(7, 5, STEEL[7]).set(6, 6, STEEL[7]).set(7, 6, WATER[9]);
    bg.add('balloon', onSand(77, p), { effect: SEQ.splash, eamt: 3, score: 20, touch: 'sand0' });
  }
  {
    // The shovel (picked up with P; Space flings sand; dig dunes by walking into them).
    const p = art(
      [
        '',
        '',
        '              kk',
        '             kyyk',
        '            kyyk',
        '           kyyk',
        '          kyyk',
        '         kyyk',
        '     kkkkyyk',
        '    kRRRRkk',
        '   kRwRRRRk',
        '   kRwRRRRk',
        '   kRRRRRrk',
        '   kRRRRrrk',
        '    kRRrrk',
        '     kkkk',
      ],
      { k: STEEL[1], y: WOOD[5], R: RED[4], r: RED[2], w: RED[6] },
    );
    bg.add('shovel', onSand(78, p), { obj: true, effect: CTR.shovel, eamt: 200, score: 50, touch: 'sand0' });
  }
  {
    // The bucket (B throws water; walk into dashed outlines to pack sand walls).
    const p = art(
      [
        '',
        '',
        '     kkkkkkkkkk',
        '    k          k',
        '   k  kkkkkkkk  k',
        '   k kBBBBBBBBk k',
        '    kBbbbbbbbbBk',
        '    kBbbbbbbbbBk',
        '    kBBBBBBBBBBk',
        '    kWWWWWWWWWBk',
        '    kWYYYWWWWWBk',
        '     kWYWWWWWBk',
        '     kWWWWWWWBk',
        '     kWWWWWWWBk',
        '      kWWWWWBk',
        '      kkkkkkkk',
      ],
      { k: WATER[0], B: WATER[3], b: WATER[1], W: WATER[5], Y: YELLOW[4] },
    );
    bg.add('bucket', onSand(79, p), { obj: true, effect: CTR.bucket, eamt: 200, score: 50, touch: 'sand0' });
  }
  return juiceArt;
}
