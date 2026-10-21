// Monster blocks (sandcast.mbl): the sand clods, splashes and puffs Teddy throws, ants,
// beetles, crabs, Gwinn's slobbery balls and rope toys, her paws (which get angry once
// splashed) and wagging tail, water droplets, the BBS's line-noise gremlins, Teddy's tossed
// tennis ball and spin whirl, and Gwinn herself (standing, napping across a doorway, happy
// with a ball).
import { MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';
import { ANSI, BEETLE, GRASS, OCHRE, PINK, RED, SAND, STEEL, WATER, WOOD, YELLOW } from '../art/palette';
import { BlockSet } from '../rules';
import { CLEAR, Pixels, art, ball, dither, outline, rng, shade, sprite } from '../art/draw';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

// ================================================================= monsters
export const mb = new BlockSet(MONBL, true);

function clod(frame: number): Pixels {
  const p = sprite();
  const r = rng(200 + frame);
  ball(p, 10, 10, 4.5, SAND, 5);
  for (let k = 0; k < 7; k++) {
    const a = r() * Math.PI * 2 + frame;
    const d = 5 + r() * 3;
    p.set(10 + Math.cos(a) * d, 10 + Math.sin(a) * d, SAND[r() > 0.5 ? 7 : 4]);
  }
  p.set(8 + frame * 3, 8, SAND[9]);
  return outline(p, OCHRE[1]);
}
mb.add('clod0', clod(0));
mb.add('clod1', clod(1));
function splash(frame: number): Pixels {
  const p = sprite();
  const r = rng(210 + frame);
  ball(p, 10, 10, frame ? 5 : 4, WATER, 6);
  for (let k = 0; k < 10; k++) {
    const a = r() * Math.PI * 2;
    const d = 5 + r() * 4;
    const x = 10 + Math.cos(a) * d;
    const y = 10 + Math.sin(a) * d;
    p.set(x, y, WATER[r() > 0.5 ? 8 : 6]).set(x + 1, y, WATER[5]);
  }
  p.set(8, 8, WATER[9]).set(9, 7, WATER[9]);
  return outline(p, WATER[1]);
}
mb.add('splash0', splash(0));
mb.add('splash1', splash(1));
for (let k = 0; k < 3; k++) {
  const p = sprite();
  const r = rng(220 + k);
  for (let n = 0; n < 9 + k * 4; n++) {
    const a = r() * Math.PI * 2;
    const d = 2 + k * 2.5 + r() * 2;
    ball(p, 10 + Math.cos(a) * d, 10 + Math.sin(a) * d, 2.4 - k * 0.5, SAND, 7 - k);
  }
  mb.add(`puff${k}`, p);
}
function ant(frame: number): Pixels {
  // Facing right; legs scuttle.
  const p = sprite();
  const body = OCHRE[0];
  ball(p, 5, 12, 3.4, RED, 1);
  ball(p, 10, 12, 2, RED, 1);
  ball(p, 14.5, 11.5, 2.6, RED, 1);
  p.set(15, 10, RED[5]).set(4, 10, RED[3]);
  p.line(16, 9, 18, 6, body).line(15, 9, 16, 5, body);
  const legs = frame ? [-1, 1, -1] : [1, -1, 1];
  [7, 10, 12].forEach((x, i) => {
    p.line(x, 13, x + legs[i] * 2, 17, body);
    p.line(x, 11, x - legs[i] * 2, 7, body);
  });
  p.set(16, 11, STEEL[7]);
  return p;
}
mb.add('ant0', ant(0), { hp: -4 });
mb.add('ant1', ant(1), { hp: -4 });
function beetle(frame: number, flipped = false): Pixels {
  const p = sprite();
  const legs = frame ? 1 : -1;
  for (const [x, d] of [
    [6, 1],
    [10, -1],
    [14, 1],
  ]) {
    p.line(x, 6, x + d * legs * 2, 2, BEETLE[0]);
    p.line(x, 14, x - d * legs * 2, 18, BEETLE[0]);
  }
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 9) / 7.5;
      const dy = (y - 10) / 5.6;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      const shine = Math.max(0, 1 - Math.hypot(x - 7, y - 7) / 4);
      p.set(x, y, flipped ? shade(OCHRE, 4 - dy * 2) : shade(BEETLE, 2.3 - dy * 1.2 + shine * 3));
    }
  if (!flipped) p.line(3, 10, 15, 10, BEETLE[0]);
  else for (let x = 3; x < 16; x += 3) p.line(x, 6, x, 14, OCHRE[1]);
  ball(p, 17, 10, 2.4, BEETLE, flipped ? 1 : 2);
  p.line(18, 8, 19, 6, BEETLE[0]).line(18, 12, 19, 14, BEETLE[0]);
  return p;
}
mb.add('beetle0', beetle(0), { hp: -8 });
mb.add('beetle1', beetle(1), { hp: -8 });
mb.add('beetleFlip', beetle(0, true));
function crab(frame: number, flipped = false): Pixels {
  const p = sprite();
  const up = frame ? 1 : 0;
  // Claws.
  for (const s of [-1, 1]) {
    const cx = 10 + s * 7;
    ball(p, cx, 6 + up * s, 2.8, RED, 4);
    p.set(cx + s, 3 + up * s, CLEAR).set(cx + s, 4 + up * s, RED[1]);
    p.line(10 + s * 4, 10, cx, 8 + up * s, RED[2]);
    // Legs.
    for (let k = 0; k < 3; k++) p.line(10 + s * 5, 12 + k * 2, 10 + s * (8 + ((k + frame) % 2)), 14 + k * 2, RED[2]);
  }
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 6.5;
      const dy = (y - 12) / 4.5;
      if (dx * dx + dy * dy <= 1) p.set(x, y, flipped ? shade(PINK, 3 - dy) : shade(RED, 4 - dy * 1.4 - dx * 0.4));
    }
  if (!flipped) {
    p.line(8, 8, 8, 6, RED[1]).line(12, 8, 12, 6, RED[1]);
    p.set(8, 5, 0).set(12, 5, 0).set(8, 4, STEEL[7]).set(12, 4, STEEL[7]);
    p.line(8, 14, 12, 14, RED[2]);
  } else p.line(6, 12, 14, 12, PINK[1]);
  return p;
}
mb.add('crab0', crab(0), { hp: -2 });
mb.add('crab1', crab(1), { hp: -2 });
mb.add('crabFlip', crab(0, true));
function slobberBall(frame: number): Pixels {
  // One of Gwinn's tennis balls, soggy with slobber, rolling (the seam turns).
  const p = sprite();
  ball(p, 10, 10, 6.5, YELLOW, 3);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (Math.hypot(x - 10, y - 10) <= 6.5 && dither(x, y, 0.3)) p.set(x, y, shade(GRASS, 5));
  const a = frame * 0.8;
  for (let t = -6; t <= 6; t += 0.5) {
    const x = 10 + Math.cos(a) * t + Math.sin(a) * Math.cos(t / 2.2) * 3;
    const y = 10 + Math.sin(a) * t - Math.cos(a) * Math.cos(t / 2.2) * 3;
    if (Math.hypot(x - 10, y - 10) < 6) p.set(x, y, STEEL[7]);
  }
  // Drool.
  p.line(6, 15, 5, 19 - frame, WATER[7]).set(5, 19 - frame, WATER[9]);
  p.line(13, 16, 14, 18 + frame, WATER[7]);
  p.set(8, 7, STEEL[7]).set(7, 8, WATER[9]);
  return outline(p, GRASS[0]);
}
mb.add('slobber0', slobberBall(0), { hp: -5 });
mb.add('slobber1', slobberBall(1), { hp: -5 });
function ropeToy(frame: number): Pixels {
  // A knotted tug rope, red and white, tumbling end over end.
  const p = sprite();
  const a = frame ? Math.PI / 4 : -Math.PI / 4;
  for (let t = -6; t <= 6; t += 0.25) {
    const x = 10 + Math.cos(a) * t;
    const y = 10 + Math.sin(a) * t;
    const stripe = Math.floor((t + 6) * 1.2) % 2 === 0;
    p.disc(x, y, 1.6, stripe ? RED[4] : STEEL[7]);
  }
  for (const e of [-1, 1]) {
    const x = 10 + Math.cos(a) * 7 * e;
    const y = 10 + Math.sin(a) * 7 * e;
    ball(p, x, y, 3, RED, 3);
    p.set(x + e * 2, y + 2, STEEL[7]).set(x - 2, y + e * 2, STEEL[6]);
  }
  return outline(p, RED[0]);
}
mb.add('rope0', ropeToy(0), { hp: -2 });
mb.add('rope1', ropeToy(1), { hp: -2 });
function paw(frame: number, angry: boolean, left: boolean): Pixels {
  const p = sprite();
  // Gwinn's big brown paws. Splashed once, she starts scrabbling in her sleep (muddy, claws out).
  const ramp = angry ? OCHRE : WOOD;
  const r = rng(260 + frame + (angry ? 2 : 0));
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 9;
      const dy = (y - 11 - frame) / 8;
      if (dx * dx + dy * dy <= 1 || (y < 11 + frame && Math.abs(x - 10) < 8)) {
        const fur = Math.sin(x * 1.7 + y * 0.6) > 0.8 && y < 9;
        p.set(x, y, shade(ramp, (fur ? 2.5 : 3.8) - dy * 1.2 + (angry ? 0 : 0.5)));
        if (angry && r() < 0.12) p.set(x, y, OCHRE[1]);
      }
    }
  for (const x of [5, 10, 15]) {
    p.disc(x, 15 + frame, 2, angry ? OCHRE[1] : WOOD[0]);
    p.line(x, 17 + frame, x, 19, angry ? STEEL[7] : STEEL[3]);
  }
  p.disc(10, 10 + frame, 2.6, angry ? OCHRE[1] : WOOD[0]);
  if (angry)
    for (const [x, y] of [
      [1, 4],
      [18, 6],
      [2, 12],
      [17, 13],
    ])
      p.set(x, y, SAND[7]).set(x + 1, y - 1, SAND[5]);
  return left ? p : p.flipX();
}
mb.add('pawL0', paw(0, false, true), { hp: -3, solid: SOLID });
mb.add('pawL1', paw(1, false, true), { hp: -3, solid: SOLID });
mb.add('pawLAngry0', paw(0, true, true), { hp: -4, solid: SOLID });
mb.add('pawLAngry1', paw(1, true, true), { hp: -4, solid: SOLID });
mb.add('pawR0', paw(0, false, false), { hp: -3, solid: SOLID });
mb.add('pawR1', paw(1, false, false), { hp: -3, solid: SOLID });
mb.add('pawRAngry0', paw(0, true, false), { hp: -4, solid: SOLID });
mb.add('pawRAngry1', paw(1, true, false), { hp: -4, solid: SOLID });
{
  // A soaked paw, dripping, pulled back.
  const p = paw(0, false, true).map((_x, _y, c) => (c === CLEAR ? c : WOOD.includes(c) ? shade(WOOD, WOOD.indexOf(c) - 1.5) : c));
  for (const [x, y] of [
    [4, 19],
    [9, 18],
    [16, 19],
    [12, 17],
  ])
    p.set(x, y, WATER[7]).set(x, y - 1, WATER[5]);
  mb.add('pawWet', p);
}
function tail(frame: number): Pixels {
  // Gwinn's tail, an otter tail as thick as a rope toy, wagging across the flagstones.
  const p = sprite();
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = 2 + t * 16;
    const y = 13 - Math.sin(t * Math.PI) * (frame ? 9 : 5) + (frame ? 0 : t * 3);
    const r = 3.4 - t * 1.4;
    const stripe = Math.sin(t * 18) > 0.3;
    for (let dy = -r; dy <= r; dy += 0.5)
      for (let dx = -r; dx <= r; dx += 0.5) {
        if (dx * dx + dy * dy > r * r) continue;
        const lit = (-dx - dy) / (r * 2);
        p.set(x + dx, y + dy, shade(WOOD, (stripe ? 3.2 : 3.8) + lit * 2));
      }
  }
  return outline(p, WOOD[0]);
}
mb.add('tail0', tail(0), { hp: -2 });
mb.add('tail1', tail(1), { hp: -2 });
{
  const p = sprite();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 4;
      const dy = (y - 12) / 5;
      if (dx * dx + dy * dy <= 1 || (y < 12 && y > 4 && Math.abs(x - 10) < (y - 4) / 2)) p.set(x, y, shade(WATER, 6 - dx - dy));
    }
  p.set(9, 10, WATER[9]);
  mb.add('droplet', outline(p, WATER[2]), { hp: -3 });
}
for (let k = 0; k < 3; k++) {
  // Line-noise gremlins: garbage characters from a dropped carrier.
  const p = sprite();
  const r = rng(250 + k);
  const glyphs = ['}', '~', '{', '#', '@', '%'];
  void glyphs;
  for (let n = 0; n < 40; n++) {
    const x = 3 + Math.floor(r() * 14);
    const y = 3 + Math.floor(r() * 14);
    p.set(x, y, [ANSI[13], ANSI[11], ANSI[14], ANSI[15]][Math.floor(r() * 4)]);
  }
  p.rect(6, 7, 2, 2, ANSI[15]).rect(12, 7, 2, 2, ANSI[15]).set(7, 8, 0).set(13, 8, 0);
  p.line(6, 13, 13, 13 + (k - 1), ANSI[12]);
  mb.add(`gremlin${k}`, p, { hp: -5 });
}

// Teddy's tennis ball, tossed (F).
function tennis(frame: number): Pixels {
  const p = sprite();
  ball(p, 10, 10, 4.5, YELLOW, 3);
  for (let y = 5; y < 16; y++) for (let x = 5; x < 16; x++) if (Math.hypot(x - 10, y - 10) <= 4.5 && dither(x, y, 0.35)) p.set(x, y, GRASS[5]);
  const a = frame * 1.6;
  for (let t = -4; t <= 4; t += 0.5) {
    const x = 10 + Math.cos(a) * t;
    const y = 10 + Math.sin(a) * t + Math.cos(t / 1.6) * 1.4;
    p.set(x, y, STEEL[7]);
  }
  p.set(8, 8, STEEL[7]);
  // Motion streaks.
  p.line(1, 9, 3, 9, STEEL[5]).line(2, 12, 4, 12, STEEL[4]);
  return outline(p, GRASS[0]);
}
mb.add('ball0', tennis(0));
mb.add('ball1', tennis(1));
// The whirl of sand Teddy's spin kicks up.
for (let k = 0; k < 2; k++) {
  const p = sprite();
  for (let i = 0; i < 70; i++) {
    const t = i / 70;
    const a = t * Math.PI * 4 + k * Math.PI;
    const d = 2 + t * 7.5;
    p.disc(10 + Math.cos(a) * d, 10 + Math.sin(a) * d * 0.8, 1.1, shade(SAND, 8 - t * 4));
  }
  mb.add(`whirl${k}`, p);
}

// ================================================================= Gwinn
// Teddy's big sister: a chocolate-brown pit-lab mix, twice his size, with amber eyes, a liver
// nose, soft floppy ears, a little white patch on her chest, a pink collar and a tongue that
// never stays in. She fills a whole block; Teddy doesn't.
const G = {
  k: WOOD[0],
  B: WOOD[3],
  b: WOOD[2],
  L: WOOD[4],
  l: WOOD[5],
  W: STEEL[7],
  w: STEEL[5],
  e: WOOD[0],
  a: YELLOW[2],
  E: YELLOW[4],
  n: WOOD[1],
  N: PINK[0],
  t: PINK[2],
  T: PINK[1],
  c: PINK[3],
  C: PINK[1],
  y: STEEL[6],
};
const GWIN_FACE = [
  '     kkkkkkkkkk     ',
  '   kkbBBLLLLBBbkk   ',
  '  kbbBBLLlLLLBBbbk  ',
  ' kbbkBBLLLLLLBBkbbk ',
  ' kbbkBBEaBBEaBBkbbk ',
  'kbbbkBBaeBBaeBBBkbbk',
  'kbbk kBBBBLBBBBk kbk',
  'kbk  kBBBLLLBBBk  kk',
  ' k   kBBLnnnLBBk    ',
  '      kBLnNnLBk     ',
  '      kLLkTkLLk     ',
  '      kcckttkcck    ',
  '     kBCcyttcCBk    ',
  '    kBBBBktkBBBBk   ',
  '   kBBBBBWkWBBBBBk  ',
  '   kBBBBBWWWBBBBBk  ',
  '   kbBBBBBWBBBBBbk  ',
];
function gwinn(legs: number, tongue: number): Pixels {
  const rows = GWIN_FACE.slice();
  if (!tongue) rows[11] = '      kcckTTkcck    ';
  const feet = legs
    ? ['   kBBk kBBk kBk    ', '   kWWk kWWk kWWk   ', '   kkk  kkkk  kkk   ']
    : ['    kBk kBBk kBBk   ', '   kWWk kWWk kWWk   ', '   kkk  kkkk  kkk   '];
  return art([...rows, ...feet], G);
}
mb.add('gwin0', gwinn(0, 1), { hp: -3, solid: SOLID });
mb.add('gwin1', gwinn(1, 0), { hp: -3, solid: SOLID });
// Asleep across a doorway: a long brown loaf, ears flopped, belly rising and falling.
function gwinNap(breath: number): Pixels {
  const p = sprite();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 11) / 8.5;
      const dy = (y - 12) / (5.5 + breath * 0.6);
      if (dx * dx + dy * dy <= 1) p.set(x, y, shade(WOOD, 3.4 - dy * 1.2 + (dx < -0.6 ? -0.5 : 0)));
    }
  // Head resting on her paws at the left.
  ball(p, 4.5, 12, 4.5, WOOD, 3);
  p.rect(1, 15, 7, 2, WOOD[2]).rect(1, 16, 3, 2, WOOD[4]).rect(5, 16, 3, 2, WOOD[4]);
  p.line(3, 9, 7, 9, WOOD[1]).rect(5, 8, 3, 6, WOOD[2]); // floppy ear
  p.line(1, 12, 3, 12, WOOD[0]); // shut eye
  p.set(0, 13, WOOD[1]).set(0, 14, WOOD[1]); // liver nose
  p.rect(8, 9, 1, 7, PINK[3]).set(8, 15, PINK[1]); // her pink collar, peeking
  // Zzz.
  const z = (x: number, y: number) =>
    p
      .line(x, y, x + 2, y, STEEL[7])
      .line(x + 2, y, x, y + 2, STEEL[7])
      .line(x, y + 2, x + 2, y + 2, STEEL[7]);
  z(2 + breath, 1);
  if (breath) z(7, 3);
  return outline(p, WOOD[0]);
}
mb.add('gwinNap0', gwinNap(0), { hp: -1, solid: SOLID });
mb.add('gwinNap1', gwinNap(1), { hp: -1, solid: SOLID });
// With a ball in her mouth: the happiest dog in Pittsburgh, tail a blur, bothering nobody.
function gwinHappy(wag: number): Pixels {
  const rows = GWIN_FACE.slice();
  rows[4] = ' kbbkBBkkBBkkBBkbbk ';
  rows[10] = '      kWyyyyyWk     ';
  rows[11] = '     kcyyGyyycck    ';
  rows[12] = '     kByyyyyyyBk    ';
  const p = art([...rows, '   kBBk kBBk kBk    ', '   kWWk kWWk kWWk   ', '   kkk  kkkk  kkk   '], { ...G, G: GRASS[5], y: YELLOW[3] });
  // Wag lines.
  const x = wag ? 17 : 16;
  p.line(x, 13, x + 2, 11, STEEL[6]).line(x, 16, x + 2, 17, STEEL[6]);
  return p;
}
mb.add('gwinHappy0', gwinHappy(0));
mb.add('gwinHappy1', gwinHappy(1));
