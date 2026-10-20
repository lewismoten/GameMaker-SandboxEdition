// The background blocks (sandcast.bbl): the sandbox, castles, moats, hose streams, tide,
// tunnels, Gwin's patio and the BBS room, with every block's rules.
import { FONT8X8 } from '../../web/src/gfx/font8x8';
import { BACKBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../web/src/formats/blocks';
import { ANSI, BEETLE, GRASS, GREY, OCHRE, PINK, PURPLE, RED, SAND, STEEL, WATER, WOOD, YELLOW } from './palette';
import { BlockSet, CTR, MON, SEQ } from './rules';
import { Pixels, art, ball, bevel, dither, pebbles, ripples, rng, sandTexture, shade, shadowOnSand, tile } from './art';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;

export const bg = new BlockSet(BACKBL, false);
let juiceArt: Pixels;

/** Sand floor with an object drawn on top (clear pixels show sand). */
function onSand(seed: number, obj: Pixels, shadow = true): Pixels {
  const p = sandTexture(seed);
  if (shadow) shadowOnSand(p, (x, y) => obj.get(x - 1, y - 2) >= 0 && obj.get(x - 1, y - 2) !== 255 && obj.get(x, y) === 255);
  return p.blit(obj, 0, 0, 255);
}

const sand = (seed: number) => sandTexture(seed);

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
  // A squeaky rubber bone: one of Teddy's toys, scattered by Gwin. Points.
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
  // A tennis ball: P picks it up, F tosses it. Gwin will drop anything for one.
  const p = sprite20();
  ball(p, 10, 11, 5, YELLOW, 3);
  for (let y = 5; y < 17; y++) for (let x = 4; x < 16; x++) if (Math.hypot(x - 10, y - 11) <= 5 && dither(x, y, 0.35)) p.set(x, y, GRASS[5]);
  for (let t = -5; t <= 5; t += 0.5) p.set(10 + t, 11 + Math.cos(t / 1.7) * 2 - 1, STEEL[7]);
  p.set(8, 8, STEEL[7]);
  bg.add('tennis', onSand(70, p), { effect: SEQ.fetch, eamt: 1, score: 25, touch: 'sand0' });
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
  bg.add('popsicle', onSand(75, p), { hp: 40, touch: 'sand0' });
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

// ---------------------------------------------------------------- anthills
function anthill(plugged: boolean): Pixels {
  const p = sand(81);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 9;
      const dy = (y - 11) / 8;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      p.set(x, y, shade(OCHRE, 4 - dx * 1.4 - dy * 1.6 + (((x * 7 + y * 3) % 5) - 2) * 0.3));
    }
  if (plugged) {
    p.disc(10, 10, 3.5, SAND[7]).disc(9, 9, 2, SAND[8]);
    p.set(14, 4, RED[4]).line(14, 5, 14, 9, WOOD[5]).set(15, 4, RED[4]).set(15, 5, RED[3]);
  } else p.disc(10, 10, 2.8, OCHRE[0]).disc(10, 11, 1.5, 0).set(8, 8, OCHRE[6]).set(12, 8, OCHRE[5]);
  return p;
}
bg.add('anthill', anthill(false), { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'plugged', birthMon: MON.ant, birthTime: 70 });
bg.add('plugged', anthill(true), { solid: SOLID, score: 150, touch: 'plugged2' });
bg.add('plugged2', anthill(true), { solid: SOLID });

// ---------------------------------------------------------------- castles of sand
function bricks(seed: number, merlon: boolean): Pixels {
  const p = tile(SAND[3]);
  const r = rng(seed);
  for (let row = 0; row < 4; row++) {
    const y = row * 5;
    const off = row % 2 ? 5 : 0;
    for (let bx = -1; bx < 3; bx++) {
      const x = bx * 10 + off;
      const s = 6 + Math.floor(r() * 2);
      p.rect(x + 1, y + 1, 9, 4, SAND[s]);
      p.rect(x + 1, y + 1, 9, 1, SAND[s + 1]);
      p.rect(x + 1, y + 4, 9, 1, SAND[s - 2]);
    }
  }
  if (merlon) {
    p.rect(0, 0, 20, 6, SAND[2]);
    for (const x of [1, 11]) bevel(p, x, 0, 8, 6, SAND, 7);
  }
  return p;
}
bg.add('wall', bricks(91, false), { solid: SOLID });
bg.add('merlon', bricks(92, true), { solid: SOLID });
{
  // Tower foundation: a ring drawn in the sand with a stake, waiting for sand.
  const p = tile(SAND[4]);
  p.blit(sandTexture(93, 4, SAND, 0.1), 0, 0);
  for (let a = 0; a < 40; a++) {
    if (a % 4 === 3) continue;
    const t = (a / 40) * Math.PI * 2;
    p.set(10 + Math.cos(t) * 8, 10 + Math.sin(t) * 8, SAND[1]);
    p.set(10 + Math.cos(t) * 8.6, 10 + Math.sin(t) * 8.6, SAND[6]);
  }
  p.line(10, 4, 10, 11, WOOD[4]).rect(11, 4, 4, 3, RED[4]).set(11, 4, RED[6]);
  bg.add('found', p, { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'scaffold' });
  bg.add('found2', p, { solid: SOLID, effect: CTR.sand, eamt: -1, touch: 'scaffold2' });
}
function tower(flagFrame: number, built: number): Pixels {
  const p = tile(SAND[2]);
  p.blit(sandTexture(94, 5, SAND, 0.15), 0, 0);
  const R = built ? 9.5 : 8;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = x - 9.5;
      const dy = y - 9.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R) continue;
      const rim = d > R - 2.5;
      const notch = rim && Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 2 === 0;
      let c = rim ? (notch ? 3 : 7) : 5;
      if (rim && !notch) c += (-dx - dy) / 8;
      if (!rim) c += (dx + dy) / 10;
      p.set(x, y, shade(SAND, c));
    }
  if (!built) {
    p.rect(5, 6, 4, 3, SAND[8]).rect(11, 11, 3, 3, SAND[3]);
    p.line(10, 3, 10, 10, WOOD[4]).rect(11, 3, 4, 3, RED[4]);
    return p;
  }
  // The flag on top flutters.
  p.line(9, 2, 9, 10, WOOD[2]).line(10, 2, 10, 10, WOOD[5]);
  const f = flagFrame
    ? [
        [11, 2, 5, 2],
        [11, 4, 6, 2],
      ]
    : [
        [11, 2, 6, 2],
        [11, 4, 5, 2],
      ];
  for (const [x, y, w, h] of f) p.rect(x, y, w, h, RED[4]);
  p.rect(11, 2, 1, 4, RED[6]).set(11 + (flagFrame ? 5 : 6) - 1, 3, RED[2]);
  return p;
}
bg.add('scaffold', tower(0, 0), { solid: SOLID, effect: CTR.flags, eamt: 1, score: 300, touch: 'tower' });
bg.add('scaffold2', tower(0, 0), { solid: SOLID, effect: CTR.flags2, eamt: 1, score: 300, touch: 'tower' });
bg.add('tower', tower(0, 1), { solid: SOLID, next: 'towerB', ntime: 6 });
bg.add('towerB', tower(1, 1), { solid: SOLID, next: 'tower', ntime: 6 });
function portcullis(open: boolean): Pixels {
  const p = tile(SAND[1]);
  p.rect(0, 0, 20, 20, open ? OCHRE[2] : OCHRE[0]);
  if (open) {
    p.blit(sandTexture(95, 4, SAND, 0.1), 0, 4);
    p.rect(0, 0, 20, 4, WOOD[1]);
    for (let x = 1; x < 20; x += 4) p.rect(x, 0, 2, 4, WOOD[4]);
    p.rect(0, 0, 2, 20, SAND[6]).rect(18, 0, 2, 20, SAND[3]);
    return p;
  }
  for (let x = 1; x < 20; x += 4) p.rect(x, 0, 2, 20, WOOD[4]).rect(x, 0, 1, 20, WOOD[6]);
  for (let y = 3; y < 20; y += 5) p.rect(0, y, 20, 2, WOOD[3]).rect(0, y, 20, 1, WOOD[5]);
  for (let x = 1; x < 20; x += 4) p.set(x, 18, STEEL[5]).set(x + 1, 19, STEEL[3]);
  return p;
}
bg.add('gate', portcullis(false), { solid: SOLID, effect: CTR.flags, eamt: -4, score: 500, touch: 'gateOpen' });
bg.add('gate2', portcullis(false), { solid: SOLID, effect: CTR.flags2, eamt: -4, score: 500, touch: 'gateOpen' });
bg.add('gateOpen', portcullis(true));
{
  // The lagoon's sea gate opens for three golden shells (its emblem shows one).
  const p = portcullis(false);
  p.rect(6, 5, 8, 9, OCHRE[0]);
  for (let y = 6; y < 13; y++)
    for (let x = 7; x < 13; x++) {
      const dx = (x - 9.5) / 3;
      const dy = (y - 9.5) / 3.5;
      if (dx * dx + dy * dy <= 1) p.set(x, y, shade(YELLOW, 3 - dx - dy + (Math.sin(x * 2 + y) > 0.5 ? 1 : 0)));
    }
  bg.add('shellGate', p, { solid: SOLID, effect: CTR.shells, eamt: -3, score: 500, touch: 'gateOpen' });
}
{
  // The keep's doorway: walk in to leave the castle.
  const p = bricks(96, false);
  for (let y = 3; y < 20; y++)
    for (let x = 3; x < 17; x++) {
      const dx = (x - 9.5) / 6.5;
      const dy = (y - 9) / 6;
      if (y < 9 && dx * dx + dy * dy > 1) continue;
      p.set(x, y, y > 16 ? OCHRE[1] : 0);
    }
  for (let x = 4; x < 16; x++) p.set(x, 18, OCHRE[3]);
  p.set(9, 8, YELLOW[4]).set(10, 8, YELLOW[4]).set(9, 9, YELLOW[2]).set(10, 9, YELLOW[2]);
  bg.add('door', p);
}
// Dashed outline: walk into it with your bucket to pack a wall of wet sand.
{
  const p = sand(97);
  for (let i = 0; i < 18; i++) {
    if (i % 4 === 3) continue;
    for (const [x, y] of [
      [1 + i, 1],
      [1 + i, 18],
      [1, 1 + i],
      [18, 1 + i],
    ])
      p.set(x, y, OCHRE[2]);
  }
  p.rect(7, 7, 6, 6, OCHRE[4]).rect(8, 8, 4, 4, OCHRE[5]);
  bg.add('outline', p, { effect: CTR.bucket, eamt: -1, score: 25, touch: 'packed' });
}
{
  const p = tile();
  const r = rng(98);
  bevel(p, 0, 0, 20, 20, OCHRE, 4, 2);
  for (let k = 0; k < 30; k++) p.set(2 + Math.floor(r() * 16), 2 + Math.floor(r() * 16), OCHRE[r() > 0.5 ? 3 : 5]);
  p.rect(4, 4, 12, 1, OCHRE[6]);
  bg.add('packed', p, { solid: SOLID });
}

// ---------------------------------------------------------------- water: moat, fords, crumbling bridges
function water(frame: number, seed = 101, deep = 2): Pixels {
  const p = tile();
  return p.map((x, y) => {
    const w = Math.sin((x + frame * 3) / 3) + Math.sin((y * 1.3 - frame * 2 + x * 0.5) / 2.5);
    let c = deep + (w > 1.2 ? 2 : w > 0.6 ? 1 : 0);
    if (w > 1.75) c = deep + 4;
    if (((x * 13 + y * 7 + seed) % 23 === 0 && frame) || ((x * 11 + y * 5 + seed) % 29 === 0 && !frame)) c = deep + 5;
    return shade(WATER, c);
  });
}
bg.add('water', water(0), { solid: SOLID, next: 'water2', ntime: 9 });
bg.add('water2', water(1), { solid: SOLID, next: 'water', ntime: 9 });
{
  // A ford: stakes mark where sand can fill the water.
  const p = water(0, 103, 3);
  for (const x of [3, 9, 15]) {
    p.rect(x, 4, 3, 3, WOOD[2])
      .rect(x, 4, 3, 1, WOOD[5])
      .set(x, 7, WATER[6])
      .set(x + 2, 7, WATER[6]);
    p.rect(x, 13, 3, 3, WOOD[2])
      .rect(x, 13, 3, 1, WOOD[5])
      .set(x, 16, WATER[6])
      .set(x + 2, 16, WATER[6]);
  }
  bg.add('ford', p, { solid: SOLID, effect: CTR.sand, eamt: -1, score: 20, touch: 'causeway' });
}
{
  const p = sandTexture(104, 3, OCHRE, 0.25);
  p.rect(0, 0, 20, 1, WATER[6]).rect(0, 19, 20, 1, WATER[4]);
  for (const x of [3, 9, 15]) p.rect(x, 1, 3, 2, WOOD[4]).rect(x, 17, 3, 2, WOOD[3]);
  bg.add('causeway', p);
}
function bridge(stage: number): Pixels {
  const p = water(0, 105, 2);
  bevel(p, 0, 2, 20, 16, SAND, 6, 1);
  const r = rng(106);
  for (let k = 0; k < 12; k++) p.set(1 + Math.floor(r() * 18), 3 + Math.floor(r() * 14), SAND[r() > 0.5 ? 5 : 7]);
  // Cracks spread as it is walked on.
  const cracks = [
    [4, 5, 8, 9],
    [8, 9, 6, 13],
    [12, 3, 14, 8],
    [14, 8, 17, 10],
    [6, 13, 3, 16],
    [14, 8, 12, 15],
    [2, 7, 6, 8],
    [16, 12, 13, 16],
  ];
  for (let k = 0; k < Math.min(cracks.length, stage * 2); k++) {
    const [a, b, c, d] = cracks[k];
    p.line(a, b, c, d, SAND[2]);
  }
  if (stage >= 3) {
    p.rect(0, 2, 20, 1, WATER[4]).rect(5, 17, 6, 1, WATER[3]);
  }
  return p;
}
const CRUMBLE = 7;
for (let s = 0; s < CRUMBLE; s++) bg.add(`bridge${s}`, bridge(Math.floor((s * 4) / CRUMBLE)), { touch: s + 1 < CRUMBLE ? `bridge${s + 1}` : 'rubble' });
{
  const p = water(1, 107, 2);
  const r = rng(108);
  for (let k = 0; k < 7; k++) {
    const x = 1 + Math.floor(r() * 16);
    const y = 1 + Math.floor(r() * 16);
    p.rect(x, y, 2 + Math.floor(r() * 2), 2, SAND[4]).set(x, y, SAND[6]);
  }
  bg.add('rubble', p, { solid: SOLID });
}

// ---------------------------------------------------------------- hose streams (gravity currents)
function stream(dir: number, frame: number): Pixels {
  const p = tile();
  // Draw flowing right, then rotate.
  const q = tile().map((x, y) => {
    const ph = (x - frame * 5 + 40) % 10;
    const wave = Math.sin(y / 2.2 + x / 4);
    let c = 4 + (wave > 0.7 ? 1 : 0);
    const chevron = Math.abs(y - 9.5) / 2 + 1;
    if (Math.abs(ph - chevron) < 0.8 && y > 3 && y < 16) c = 7;
    else if (Math.abs(ph - chevron - 1) < 0.8 && y > 3 && y < 16) c = 6;
    return shade(WATER, c);
  });
  return p.map((x, y) => {
    if (dir === RIGHT) return q.get(x, y);
    if (dir === LEFT) return q.get(19 - x, y);
    if (dir === DOWN) return q.get(y, x);
    return q.get(19 - y, x);
  });
}
for (const [name, dir] of [
  ['right', RIGHT],
  ['left', LEFT],
  ['up', UP],
  ['down', DOWN],
] as const) {
  bg.add(`flow_${name}`, stream(dir, 0), { grav: dir, next: `flow_${name}2`, ntime: 3 });
  bg.add(`flow_${name}2`, stream(dir, 1), { grav: dir, next: `flow_${name}`, ntime: 3 });
}
function hose(vertical: boolean, nozzle: boolean): Pixels {
  const p = sand(111);
  const q = tile(255);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const a = vertical ? x : y;
      if (a < 4 || a > 15) continue;
      const t = (a - 4) / 11;
      q.set(x, y, shade(GRASS, 6 - t * 5 + (t < 0.2 ? -1 : 0)));
    }
  if (nozzle) {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const a = vertical ? x : y;
        const b = vertical ? y : x;
        if (b > 9 && a >= 5 && a <= 14) q.set(x, y, shade(YELLOW, 4 - (a - 5) / 3));
        if (b > 16 && a >= 7 && a <= 12) q.set(x, y, YELLOW[0]);
      }
  }
  shadowOnSand(p, (x, y) => q.get(x - 1, y - 2) >= 0 && q.get(x - 1, y - 2) !== 255 && q.get(x, y) === 255);
  return p.blit(q, 0, 0, 255);
}
bg.add('hoseH', hose(false, false), { solid: SOLID });
bg.add('hoseV', hose(true, false), { solid: SOLID });
bg.add('nozzle', hose(false, true), { solid: SOLID, birthMon: MON.droplet, birthTime: 22 });
{
  const p = sand(112);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 8.5;
      const dy = (y - 10) / 6;
      const d = dx * dx + dy * dy + Math.sin(x * 1.3) * 0.08;
      if (d < 1) p.set(x, y, d > 0.75 ? OCHRE[3] : shade(WATER, 4 + (dx < -0.3 && dy < -0.2 ? 2 : 0)));
    }
  bg.add('puddle', p);
}

// ---------------------------------------------------------------- tides
// Traveling waves: eight phases of one cycle. Rows of the beach start at different phases,
// so a crest rolls up the sand; the surf pushes the knight inland (gravity up).
function surf(phase: number): Pixels {
  const p = sandTexture(121 + phase, [6, 4, 4, 3, 3, 3, 4, 4][phase], phase === 0 ? SAND : OCHRE, 0.18);
  const level = [0, 0, 0.35, 0.8, 1, 0.8, 0.35, 0][phase];
  if (phase === 0) return p;
  if (phase === 1 || phase === 7) return sandTexture(122, 3, OCHRE, 0.2);
  return p.map((x, y, c) => {
    const edge = 20 - level * 20 + Math.sin(x / 2.5 + phase) * 1.5;
    if (y < edge - 1) return c;
    if (y < edge + 1) return WATER[9];
    const foam = (x * 7 + y * 3 + phase) % 11 === 0;
    return foam ? WATER[8] : shade(WATER, phase === 4 ? 5 : 6) + 0;
  });
}
for (let k = 0; k < 8; k++)
  bg.add(`surf${k}`, surf(k), {
    next: `surf${(k + 1) % 8}`,
    ntime: 5,
    grav: k === 4 ? UP : 0,
    hp: k === 4 ? -1 : 0,
  });
// The tidal flat floods all at once on a long cycle: low, wet, flooded (the current shoves
// you back to shore), ebbing.
{
  const low = sandTexture(131, 3, OCHRE, 0.2);
  for (let k = 0; k < 3; k++) low.line(2 + k * 6, 4 + k * 5, 8 + k * 5, 6 + k * 5, OCHRE[5]);
  bg.add('flat', low, { next: 'flatWet', ntime: 150 });
  const wet = low.crop(0, 0, 20, 20).map((x, y, c) => ((x + y * 3) % 7 === 0 ? WATER[5] : c === OCHRE[3] ? OCHRE[2] : c));
  bg.add('flatWet', wet, { next: 'flatSea', ntime: 25 });
  bg.add('flatSea', water(0, 133, 3), { next: 'flatEbb', ntime: 110, grav: UP, hp: -1 });
  const ebb = water(1, 134, 4).map((x, y, c) => ((x * 3 + y * 5) % 4 === 0 ? OCHRE[3] : c));
  bg.add('flatEbb', ebb, { next: 'flat', ntime: 25, grav: UP });
}

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
  bg.add('rootDoor', p, { solid: SOLID, effect: CTR.acorns, eamt: -1, score: 100, touch: 'sand3' });
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

// ---------------------------------------------------------------- the patio, where Gwin naps
function flagstone(seed: number): Pixels {
  const p = tile(GREY[1]);
  const r = rng(seed);
  const stones = [
    [0, 0, 11, 8],
    [12, 0, 8, 11],
    [0, 9, 7, 11],
    [8, 9, 4, 11],
    [12, 12, 8, 8],
  ];
  for (const [x, y, w, h] of stones) {
    const s = 3 + Math.floor(r() * 2);
    p.rect(x + 1, y + 1, w - 1, h - 1, shade(GREY, s));
    p.rect(x + 1, y + 1, w - 1, 1, shade(GREY, s + 1));
    p.rect(x + 1, y + h - 1, w - 1, 1, shade(GREY, s - 1));
    for (let k = 0; k < 3; k++) p.set(x + 2 + Math.floor(r() * (w - 3)), y + 2 + Math.floor(r() * (h - 3)), shade(GREY, s - 1));
  }
  return p;
}
bg.add('patio', flagstone(171));
bg.add('patio2', flagstone(172));
{
  // Old garden bricks, weathered and mossy.
  const p = tile(GREY[1]);
  const r = rng(176);
  for (let row = 0; row < 5; row++) {
    const off = row % 2 ? 5 : 0;
    for (let bx = -1; bx < 3; bx++) {
      const x = bx * 10 + off;
      const c = r() > 0.5 ? WOOD : OCHRE;
      p.rect(x + 1, row * 4 + 1, 9, 3, c[2 + ((row + bx) & 1)]);
      p.rect(x + 1, row * 4 + 1, 9, 1, c[4]);
      if (r() > 0.75) p.rect(x + 2 + Math.floor(r() * 5), row * 4 + 3, 3, 1, GRASS[2]);
    }
  }
  bg.add('brick', p, { solid: SOLID });
}
{
  // Gwin's water bowl (her name in red on the side): fills your bucket three splashes' worth.
  const mk = (full: boolean) => {
    const p = sprite20();
    ball(p, 10, 10, 9, STEEL, 4);
    p.disc(10, 10, 6.5, full ? WATER[5] : STEEL[2]);
    if (full) p.disc(8, 8, 2, WATER[7]).set(7, 7, WATER[9]);
    p.rect(5, 1, 10, 2, RED[4]);
    for (const x of [6, 9, 12]) p.rect(x, 1, 1, 2, STEEL[7]);
    return onSand(173, p).map((_x, _y, c) => (SAND.includes(c) ? GREY[3] : c));
  };
  bg.add('bowl', mk(true), { solid: SOLID, effect: SEQ.splash, eamt: 3, score: 20, touch: 'bowlDry' });
  bg.add('bowlDry', mk(false), { solid: SOLID });
}
{
  // Gwin's toy box, overflowing: every so often a rope toy comes flying out.
  const p = tile(GREY[3]);
  p.blit(flagstone(174), 0, 0);
  bevel(p, 2, 6, 16, 12, WOOD, 3, 1);
  p.rect(3, 10, 14, 1, WOOD[1]);
  ball(p, 6, 6, 3, YELLOW, 3);
  p.line(9, 7, 15, 3, RED[4]).line(10, 7, 16, 3, STEEL[7]);
  ball(p, 15, 6, 2.5, PINK, 2);
  p.rect(8, 13, 4, 2, YELLOW[3]);
  bg.add('post2', p, { solid: SOLID, birthMon: MON.rope, birthTime: 160 });
}
{
  // The Crown of the Sandbox, in a puddle of light.
  const p = flagstone(175);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (dither(x, y, 1 - Math.hypot(x - 10, y - 11) / 10)) p.set(x, y, YELLOW[4]);
  art(
    [
      '',
      '',
      '',
      '    k   kk   k',
      '   kRk kWWk kRk',
      '   kYk kYYk kYk',
      '   kYYkYYYYkYYk',
      '   kYYYYYYYYYYk',
      '   kYyYYBBYYyYk',
      '   kYYYYBBYYYYk',
      '   kyyyyyyyyyyk',
      '   kkkkkkkkkkkk',
    ],
    { k: YELLOW[0], Y: YELLOW[4], y: YELLOW[2], R: RED[4], W: STEEL[7], B: WATER[5] },
    p,
  );
  bg.add('crown', p, { score: 5000 });
}
// Gwin herself, asleep across the top of the patio on Teddy's crown: 6 x 4 blocks of
// brown pit-lab. Her eye opens now and then; slobbery tennis balls roll out of her mouth.
const CAT_W = 6;
const CAT_H = 4;
function drawCat(eyes: 'open' | 'shut'): Pixels {
  // (Named for the slot it fills: this is Gwin, a brown pit-lab mix, sprawled asleep.)
  const c = new Pixels(CAT_W * 20, CAT_H * 20, 255);
  const body = (x: number, y: number) => {
    const bx = (x - 76) / 42;
    const by = (y - 46) / 28;
    return bx * bx + by * by;
  };
  const head = (x: number, y: number) => {
    // A broad pit-bull head with a lab's soft muzzle.
    const hx = (x - 30) / 26;
    const hy = (y - 44) / 22;
    return hx * hx + hy * hy;
  };
  for (let y = 0; y < c.h; y++)
    for (let x = 0; x < c.w; x++) {
      const b = body(x, y);
      const h = head(x, y);
      if (b <= 1) {
        const lit = (46 - y) / 28 - b * 0.6;
        const sheen = Math.sin(x / 7 + y / 11) > 0.85 ? 0.6 : 0;
        c.set(x, y, shade(WOOD, 3.3 + lit * 1.6 + sheen));
      }
      if (h <= 1) {
        const lit = (44 - y) / 22 - h * 0.5;
        c.set(x, y, shade(WOOD, 3.5 + lit * 1.5));
      }
    }
  // Floppy ears, folded down beside her face.
  for (const [ex, dir] of [
    [9, -1],
    [51, 1],
  ] as const)
    for (let y = 0; y < 22; y++)
      for (let x = -7; x <= 7; x++) {
        const w = 7 - Math.abs(y - 9) * 0.45;
        if (Math.abs(x) <= w) c.set(ex + x + dir * y * 0.15, 26 + y, shade(WOOD, 1.6 + (Math.abs(x) < w - 2 ? 0.8 : 0) - y / 30));
      }
  // White blaze: a stripe up her forehead and a big white chest under her chin.
  for (let y = 26; y < 50; y++) for (let x = 27; x < 34; x++) if (Math.abs(x - 30.5) < 1.2 + (y - 26) / 14) c.set(x, y, y > 46 ? STEEL[6] : STEEL[7]);
  for (let y = 58; y < 80; y++)
    for (let x = 44; x < 80; x++) {
      const dx = (x - 62) / 18;
      const dy = (y - 70) / 10;
      if (dx * dx + dy * dy < 1 && body(x, y) <= 1) c.set(x, y, shade(STEEL, 7 - dy));
    }
  // Muzzle, nose, and a pink tongue hanging out in her sleep.
  for (let y = 48; y < 66; y++)
    for (let x = 18; x < 43; x++) {
      const dx = (x - 30.5) / 12;
      const dy = (y - 56) / 9;
      if (dx * dx + dy * dy < 1) c.set(x, y, shade(WOOD, 4.6 - dy * 0.8));
    }
  c.rect(26, 50, 9, 5, STEEL[1]).rect(27, 50, 3, 1, STEEL[4]);
  c.line(30, 55, 30, 59, WOOD[0]).line(30, 59, 24, 62, WOOD[0]).line(30, 59, 37, 62, WOOD[0]);
  c.rect(30, 61, 5, 9, PINK[2]).rect(31, 62, 1, 6, PINK[1]).rect(30, 69, 5, 1, PINK[1]);
  // Eyes (both inside one block: x 20..40, y 40..60).
  for (const ex of [23, 38]) {
    if (eyes === 'open') {
      c.disc(ex, 43, 3.4, STEEL[7]).disc(ex, 43, 2.4, WOOD[1]).disc(ex, 43, 1.4, 0);
      c.set(ex - 1, 42, STEEL[7]);
    } else {
      for (let x = -3; x <= 3; x++) c.set(ex + x, 43 + Math.round((x * x) / 6), WOOD[0]);
    }
  }
  // Red collar with a gold tag.
  for (let x = 12; x < 50; x++) {
    const y = 66 + Math.round(Math.sin((x - 12) / 12) * 2);
    c.rect(x, y, 1, 3, RED[4]);
  }
  c.disc(44, 72, 2.5, YELLOW[3]).set(43, 71, YELLOW[4]);
  // Hind leg tucked along the bottom right.
  for (let y = 60; y < 78; y++)
    for (let x = 88; x < 118; x++) {
      const dx = (x - 103) / 15;
      const dy = (y - 70) / 8;
      if (dx * dx + dy * dy < 1) c.set(x, y, shade(WOOD, 3 - dy));
    }
  return c;
}
{
  const open = drawCat('open');
  const shut = drawCat('shut');
  for (let by = 0; by < CAT_H; by++)
    for (let bx = 0; bx < CAT_W; bx++) {
      const p = flagstone(180 + bx + by * CAT_W).blit(open.crop(bx * 20, by * 20, 20, 20), 0, 0, 255);
      const name = `cat${bx}${by}`;
      const eyeBlock = bx === 1 && by === 2;
      const mouth = bx === 1 && by === 3;
      bg.add(name, p, {
        solid: SOLID,
        hp: -3,
        ...(eyeBlock ? { next: 'catBlink', ntime: 70 } : {}),
        ...(mouth ? { birthMon: MON.slobber, birthTime: 64 } : {}),
      });
      if (eyeBlock)
        bg.add('catBlink', flagstone(180 + bx + by * CAT_W).blit(shut.crop(bx * 20, by * 20, 20, 20), 0, 0, 255), {
          solid: SOLID,
          hp: -3,
          next: name,
          ntime: 6,
        });
    }
}

// ---------------------------------------------------------------- THE -= S A N D B O X =- BBS
{
  const p = tile(0);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * 2) % 10 === 0 && y % 4 === 1) p.set(x, y, ANSI[1]);
  p.set(4, 9, ANSI[8]).set(14, 17, ANSI[8]);
  bg.add('ansiFloor', p);
}
{
  // ANSI shade blocks: dark shade, medium shade, full block in blue/cyan.
  const p = tile(ANSI[1]);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const band = Math.floor(x / 7);
      const on = band === 0 ? (x + y) % 4 === 0 : band === 1 ? (x + y) % 2 === 0 : true;
      p.set(x, y, on ? ANSI[9] : ANSI[1]);
    }
  p.rect(0, 0, 20, 1, ANSI[11]);
  bg.add('ansiWall', p, { solid: SOLID });
}
const LETTER_COLORS = [ANSI[14], ANSI[11], ANSI[13], ANSI[10], ANSI[12], ANSI[15]];
function letterBlock(text: string, color: number, shadow: number): Pixels {
  const p = tile(0);
  const n = text.length;
  const scale = n === 1 ? 2 : 1;
  const w = 8 * scale * n;
  const ox = Math.floor((20 - w) / 2);
  const oy = n === 1 ? 2 : 6;
  [...text].forEach((ch, i) => {
    const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        if (g[y] & (1 << x)) {
          p.rect(ox + i * 8 * scale + x * scale + 1, oy + y * scale + 1, scale, scale, shadow);
          p.rect(ox + i * 8 * scale + x * scale, oy + y * scale, scale, scale, color);
        }
  });
  // A little dithered glow underneath, like an ANSI underline.
  for (let x = 1; x < 19; x++) if (x % 2) p.set(x, 19, ANSI[8]);
  return p;
}
['T', 'H', 'E', 'S', 'A', 'N', 'D', 'B', 'O', 'X'].forEach((ch, i) =>
  bg.add(`ltr${ch}`, letterBlock(ch, LETTER_COLORS[i % LETTER_COLORS.length], ANSI[i % 2 ? 5 : 1]), { solid: SOLID }),
);
bg.add('ltrDashEq', letterBlock('-=', ANSI[12], ANSI[4]), { solid: SOLID });
bg.add('ltrEqDash', letterBlock('=-', ANSI[12], ANSI[4]), { solid: SOLID });
{
  // A 3.5" floppy disk: shareware! Points.
  const p = art(
    [
      '',
      '',
      '   kkkkkkkkkkkkkk',
      '   kBBBSSSSSSBBBk',
      '   kBBBSkkSSSBBBk',
      '   kBBBSkkSSSBBBk',
      '   kBBBSSSSSSBBBk',
      '   kBBBBBBBBBBBBk',
      '   kBWWWWWWWWWWBk',
      '   kBWrrrrrrrrWBk',
      '   kBWWWWWWWWWWBk',
      '   kBWkkkkkkkkWBk',
      '   kBWWWWWWWWWWBk',
      '   kBWkkkkkWWWWBk',
      '   kBWWWWWWWWWWBk',
      '   kkkkkkkkkkkkkk',
    ],
    { k: 0, B: ANSI[1], S: STEEL[5], W: STEEL[7], r: ANSI[12] },
  );
  const q = tile(0).blit(bg.pic('ansiFloor'), 0, 0).blit(p, 0, 0, 255);
  bg.add('floppy', q, { score: 300, touch: 'ansiFloor' });
  bg.add('juiceBBS', tile(0).blit(bg.pic('ansiFloor'), 0, 0).blit(juiceArt, 0, 0, 255), { effect: CTR.lives, eamt: 1, score: 200, touch: 'ansiFloor' });
}
{
  // The SysOp's terminal, glowing green.
  const p = tile(0).blit(bg.pic('ansiFloor'), 0, 0);
  bevel(p, 1, 2, 18, 14, GREY, 3, 1);
  p.rect(3, 4, 14, 9, 0);
  for (let y = 5; y < 12; y += 2) p.rect(4, y, 4 + ((y * 5) % 9), 1, ANSI[10]);
  p.rect(4, 11, 2, 1, ANSI[15]);
  p.rect(3, 16, 14, 3, GREY[2]).rect(4, 17, 12, 1, GREY[4]);
  bg.add('terminal', p, { solid: SOLID });
}
{
  // The way out: a doorway of static.
  const p = tile(0);
  const r = rng(191);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, r() > 0.5 ? ANSI[r() > 0.5 ? 13 : 5] : ANSI[r() > 0.7 ? 15 : 0]);
  p.frame(0, 0, 20, 20, ANSI[14]);
  bg.add('noCarrier', p);
}

function sprite20(): Pixels {
  return new Pixels(20, 20, 255);
}

export const BG = bg;
export const B = (name: string) => bg.id(name);
export { PURPLE };
