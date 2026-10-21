// Y2K.CBL (Dex, in sneakers and in a fishbowl space helmet) and Y2K.MBL (everything else
// that moves). Drawn as 20x20 sprites on transparent squares.
import { Pixels, rng } from '../kit/pixels';
import { BlockSet, type BlockDef } from './book';
import { T, blob, oval, outline, recolor, rotate, sprite } from './src/art/draw';
import { micro } from './src/art/font';
import { CTR } from './src/ids';
import { coverPic } from './items';
import { C, PAL } from './src/art/pal';

const R = PAL.r;
const K = () => C('grey', 0);

// ------------------------------------------------------------------ Dex
function dexKey(): Record<string, number> {
  return {
    k: K(),
    c: C('pink', 3),
    C: C('pink', 1),
    h: C('hair', 1),
    s: C('skin', 2),
    S: C('skin', 1),
    e: C('grey', 0),
    m: C('red', 2),
    j: C('chrome', 6),
    J: C('chrome', 4),
    p: C('teal', 3),
    g: C('gold', 4),
    b: C('grey', 7),
    B: C('neon', 2),
    z: C('teal', 4),
  };
}

const D_HEAD = [
  '.....kkkkkk.....',
  '....kccccccck...',
  '...kcCccccccCk..',
  '...kChhhhhhhhk..',
  '...khssssssshk..',
  '...ksseSsseSssk.',
  '...kssssssssk...',
  '....kssmmssk....',
];
const D_HEAD_BLINK = [...D_HEAD.slice(0, 5), '...kssksssksssk.', ...D_HEAD.slice(6)];
const D_HEAD_UP = [
  '.....kkkkkk.....',
  '....kccccccck...',
  '...kcccccccCck..',
  '...kChhhhhhhhk..',
  '...khhhhhhhhhk..',
  '...khhhhhhhhhk..',
  '...khhhhhhhhk...',
  '....kSShhSSk....',
];
const D_BODY = ['...kkjjjjjjkk...', '..kgjjjpjjjjgk..', '..kgjjjpjjjjgk..', '..kskJjpjjJksk..', '....kjjpjjjk....', '....kJJJJJJk....'];
const D_LEGS0 = ['....kjjjkjjjk...', '....kjjk.kjjk...', '....kBBk.kBBk...', '...kbbbk.kbbbk..'];
const D_LEGS1 = ['....kjjjkjjjk...', '....kBBk.kjjk...', '...kbbbk.kBBk...', '.........kbbbk..'];
const D_LEGS2 = ['....kjjjkjjjk...', '....kjjk.kBBk...', '....kBBk.kbbbk..', '...kbbbk........'];

const D_HEAD_SIDE = [
  '.....kkkkkk.....',
  '....kcccccckk...',
  '...kCccccccccck.',
  '...khhhhhsssk...',
  '...khhhsssssk...',
  '...khhssssesk...',
  '....khsssssSk...',
  '.....kssssmk....',
];
const D_BODY_SIDE = ['.....kjjjjjk....', '....kjjjjpjjk...', '....kjjgjpjjk...', '....kjjgjpjjk...', '.....kjsjpjk....', '.....kJJJJJk....'];
const D_LEGS_S0 = ['.....kjjjjjk....', '.....kjjjjjk....', '.....kBBBBk.....', '.....kbbbbbbk...'];
const D_LEGS_S1 = ['....kjjjkjjjk...', '...kjjk...kjjk..', '...kBBk...kBBk..', '..kbbbk....kbbbk'];

function dexPic(rows: string[]): Pixels {
  for (const r of rows) if (r.length > 20) throw new Error(`Sprite row too long: ${r}`);
  return sprite(rows, dexKey(), 20, 20, 2, 20 - rows.length);
}

/** The same Dex in a moon suit: a white suit and a glass fishbowl helmet. */
function spacesuit(p: Pixels): Pixels {
  const q = recolor(p, (c) => (c === C('chrome', 6) ? C('paper', 2) : c === C('chrome', 4) ? C('paper', 0) : c === C('teal', 3) ? C('purple', 3) : c));
  // Helmet: a glass ring around the head with a shine.
  for (let a = 0; a < Math.PI * 2; a += 0.04) {
    const x = 9.5 + Math.cos(a) * 7.2;
    const y = 5.5 + Math.sin(a) * 6.2;
    q.set(x, y, a > 3.6 && a < 4.6 ? C('grey', 7) : C('glass', 2));
  }
  q.set(5, 2, C('grey', 7)).set(6, 1, C('grey', 7));
  // Air tank peeking over the shoulder.
  q.rect(15, 9, 2, 5, C('chrome', 3));
  return q;
}

export function buildCharBlocks(): BlockSet {
  const s = new BlockSet(50, true);
  const poses: [string, Pixels][] = [
    ['down0', dexPic([...D_HEAD, ...D_BODY, ...D_LEGS0])],
    ['down1', dexPic([...D_HEAD, ...D_BODY, ...D_LEGS1])],
    ['down2', dexPic([...D_HEAD, ...D_BODY, ...D_LEGS2])],
    ['blink', dexPic([...D_HEAD_BLINK, ...D_BODY, ...D_LEGS0])],
    ['up0', dexPic([...D_HEAD_UP, ...D_BODY, ...D_LEGS0])],
    ['up1', dexPic([...D_HEAD_UP, ...D_BODY, ...D_LEGS1])],
    ['up2', dexPic([...D_HEAD_UP, ...D_BODY, ...D_LEGS2])],
    ['side0', dexPic([...D_HEAD_SIDE, ...D_BODY_SIDE, ...D_LEGS_S0])],
    ['side1', dexPic([...D_HEAD_SIDE, ...D_BODY_SIDE, ...D_LEGS_S1])],
  ];
  // Zap: the Laser-Tag Zapper held out, with a muzzle flash.
  const zap = dexPic([...D_HEAD, ...D_BODY, ...D_LEGS0]);
  zap.rect(14, 9, 5, 3, C('chrome', 4)).rect(18, 9, 2, 3, C('orange', 4)).set(15, 8, C('neon', 3));
  poses.push(['zap', zap]);
  const zap2 = dexPic([...D_HEAD, ...D_BODY, ...D_LEGS0]);
  zap2.rect(14, 9, 5, 3, C('chrome', 4));
  oval(zap2, 18, 10, 2, 2, C('grey', 7));
  zap2.set(19, 7, C('gold', 5)).set(19, 13, C('gold', 5));
  poses.push(['zap2', zap2]);
  // Hurt: flash white and red.
  const base = poses[0][1];
  poses.push(['hurt', recolor(base, (c) => (c === T ? T : c === K() ? C('red', 2) : C('grey', 7)))]);
  poses.push(['hurt2', recolor(base, (c) => (c === T ? T : c === K() ? C('grey', 7) : C('red', 3)))]);
  // Die: spin and flop, with little stars.
  const spin = rotate(base);
  poses.push(['die0', spin]);
  poses.push(['die1', rotate(spin)]);
  const flat = new Pixels(20, 20, T).blit(rotate(rotate(spin)), 0, 3, T);
  poses.push(['die2', flat]);
  const dizzy = flat.crop(0, 0, 20, 20);
  for (const [x, y] of [
    [4, 3],
    [10, 1],
    [15, 4],
  ])
    dizzy
      .set(x, y, C('gold', 5))
      .set(x + 1, y, C('gold', 4))
      .set(x, y + 1, C('gold', 4));
  poses.push(['die3', dizzy]);
  for (const [n, p] of poses) s.add(n, p);
  for (const [n, p] of poses) s.add(`m_${n}`, spacesuit(p));
  return s;
}

// ------------------------------------------------------------------ monsters
const blankS = () => new Pixels(20, 20, T);

function shotPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 10, 6, 2.2, C('pink', 3));
  oval(p, 10, 10, 4, 1.3, C('grey', 7));
  for (let i = 0; i < 4; i++) p.set(2 + i * 2 + k, 10 + (i % 2 ? 2 : -2), C('neon', 3));
  return p;
}

function popPic(k: number): Pixels {
  const p = blankS();
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4 + k * 0.4;
    const r0 = 2 + k * 3;
    p.line(10 + Math.cos(ang) * r0, 10 + Math.sin(ang) * r0, 10 + Math.cos(ang) * (r0 + 3), 10 + Math.sin(ang) * (r0 + 3), a % 2 ? C('gold', 5) : C('grey', 7));
  }
  if (k === 0) oval(p, 10, 10, 3, 3, C('grey', 7));
  return p;
}

function mowerPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 17, 8, 2, C('grey', 1));
  p.rect(3, 6, 14, 10, C('red', 2)).rect(3, 6, 14, 3, C('red', 4));
  blob(p, 10, 5, 4, 3, R('chrome'), 3, 7);
  p.rect(8, 4, 1, 2, C('grey', 0)).rect(11, 4, 1, 2, C('grey', 0));
  p.line(10, 2, 10, 0, C('chrome', 5));
  p.set(10, 0, k ? C('red', 4) : C('gold', 5));
  // Spinning blades out the front.
  const by = 16;
  p.line(4, by, 16, by, C('chrome', 6));
  for (let x = 4 + k * 2; x < 17; x += 4) p.set(x, by + 1, C('green', 4)).set(x + 1, by - 1, C('green', 3));
  p.rect(2, 8, 2, 6, C('grey', 1)).rect(16, 8, 2, 6, C('grey', 1));
  outline(p, K());
  return p;
}

function dogPic(k: number, sparky = false, mad = false): Pixels {
  const p = blankS();
  oval(p, 10, 18, 7, 1.5, C('grey', 1));
  const body = sparky ? 'chrome' : 'gold';
  // A robot dog seen from the side: boxy body, round head, antenna tail.
  p.rect(4, 8, 10, 6, C(body, 4)).rect(4, 8, 10, 2, C(body, 6));
  const leg = (x: number, d: number) => p.rect(x, 14, 2, 4 - d, C(body, 2));
  leg(5, k);
  leg(8, 1 - k);
  leg(10, k);
  leg(12, 1 - k);
  blob(p, 15, 7, 4, 4, R(body), 3, 7);
  p.rect(17, 8, 3, 2, C(body, 3));
  p.rect(13, 2, 2, 3, C(body, 2));
  p.set(16, 6, mad ? C('red', 4) : C('grey', 0));
  p.line(4, 9, 1, 4 + k * 2, C('chrome', 3));
  p.set(1, 4 + k * 2, C('red', 4));
  if (sparky) {
    p.rect(12, 10, 4, 1, C('red', 3));
    // The cover page of Dex's report, in his mouth.
    p.rect(17, 9, 3, 4, C('paper', 2)).set(18, 10, C('denim', 2));
  }
  outline(p, K());
  return p;
}

function paperPic(k: number): Pixels {
  const p = blankS();
  const roll = blankS();
  roll.rect(5, 8, 10, 5, C('paper', 1)).rect(5, 8, 10, 1, C('paper', 2));
  for (let x = 6; x < 15; x += 2) roll.set(x, 10, C('grey', 3));
  roll.rect(9, 8, 2, 5, C('red', 3));
  p.blit(k ? rotate(roll) : roll, 0, 0, T);
  outline(p, K());
  return p;
}

function paperbotPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.2, C('grey', 1));
  blob(p, 10, 6, 5, 5, R('purple'), 1, 5);
  oval(p, 10, 6, 3, 1.5, C('neon', 2));
  p.rect(6, 10, 8, 4, C('purple', 2));
  p.rect(12, 9, 5, 5, C('paper', 1)).rect(12, 9, 5, 1, C('red', 3));
  oval(p, 10, 15 + k, 4, 1, C('teal', 4));
  oval(p, 10, 15 + k, 2, 0.6, C('grey', 7));
  outline(p, K());
  return p;
}

function alienPic(k: number, ramp: 'alien' | 'purple'): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.3, C('grey', 1));
  // Big head, huge friendly eyes, one hand waving hello.
  blob(p, 10, 6, 6, 5, R(ramp), 1, 3);
  oval(p, 7.5, 6, 1.8, 2.3, C('grey', 0));
  oval(p, 12.5, 6, 1.8, 2.3, C('grey', 0));
  p.set(7, 5, C('grey', 7)).set(12, 5, C('grey', 7));
  p.rect(9, 9, 3, 1, C('grey', 0));
  p.rect(8, 11, 5, 5, C(ramp, 2));
  p.rect(8, 16, 2, 2, C(ramp, 1)).rect(11, 16, 2, 2, C(ramp, 1));
  p.line(13, 12, 16, 9 - k * 2, C(ramp, 2));
  p.line(7, 12, 5, 14, C(ramp, 2));
  p.line(8, 1, 6, -1 + k, C(ramp, 2));
  p.line(12, 1, 14, -1 + k, C(ramp, 2));
  if (ramp === 'purple') {
    // A party hat. Everybody is happy to see you.
    for (let y = 0; y < 4; y++) p.rect(10 - y / 2, y - 3 + 3, y + 1, 1, C('gold', 4));
  }
  outline(p, K());
  return p;
}

function beamPic(k: number): Pixels {
  const p = blankS();
  for (let y = 0; y < 20; y++) for (let x = 6; x < 14; x++) if ((x + y + k) % 3 === 0) p.set(x, y, k ? C('teal', 5) : C('grey', 7));
  for (const [x, y] of [
    [5, 4],
    [15, 9],
    [4, 15],
    [14, 2],
  ])
    p.set(x, y + k, C('gold', 5));
  return p;
}

function carPic(k: number, color: string, truck = false): Pixels {
  const p = blankS();
  oval(p, 10, 17, 9, 1.8, C('grey', 1));
  const top = truck ? 3 : 5;
  for (let y = top; y < 15; y++)
    for (let x = 1; x < 19; x++) {
      const nx = (x - 10) / 9;
      const ny = (y - (top + 15) / 2) / ((15 - top) / 2);
      if (nx ** 4 + ny * ny <= 1) p.set(x, y, C(color, ny < -0.3 ? 4 : ny < 0.4 ? 3 : 1));
    }
  if (truck) {
    p.rect(2, 3, 10, 9, C(color, 2)).rect(2, 3, 10, 2, C(color, 4));
    micro(p, 3, 6, 'FAX', C('grey', 7));
    oval(p, 15, 8, 3, 2.5, C('glass', 2));
  } else {
    oval(p, 12, 8, 4, 2.5, C('glass', 1));
    oval(p, 12, 7.5, 2.5, 1.5, C('glass', 3));
    p.rect(1, 5, 3, 2, C(color, 2));
  }
  // Rocket exhaust flickers.
  p.rect(0, 9, 1, 3, C('orange', 4)).set(0 - k, 10, C('gold', 5));
  oval(p, 10, 15, 6, 0.8, k ? C('teal', 5) : C('teal', 3));
  outline(p, K());
  return p;
}

function faxbotPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.2, C('grey', 1));
  p.rect(5, 6, 10, 8, C('concrete', 3)).rect(5, 6, 10, 2, C('concrete', 4));
  p.rect(7, 3, 6, 4, C('paper', 2)).rect(8, 4, 4, 1, C('grey', 3));
  p.rect(7, 9, 3, 2, C('night', 1)).set(12, 10, C('neon', 3));
  for (const s of [-1, 1]) {
    const x = s < 0 ? 4 : 15;
    p.line(x, 9, x + s * 4, 6 + k * 3, C('grey', 7)).line(x, 10, x + s * 4, 8 + k * 3, C('grey', 5));
  }
  outline(p, K());
  return p;
}

function secbotPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 6, 1.5, C('grey', 1));
  p.rect(5, 8, 10, 9, C('denim', 2)).rect(5, 8, 10, 2, C('denim', 4));
  blob(p, 10, 6, 5, 4, R('chrome'), 3, 7);
  p.rect(7, 5, 6, 2, C('grey', 0))
    .set(8 + k * 3, 5, C('red', 4))
    .set(9 + k * 3, 5, C('red', 4));
  p.rect(9, 1, 2, 2, k ? C('red', 4) : C('denim', 4));
  micro(p, 6, 11, 'SEC', C('gold', 4));
  p.rect(6, 17, 3, 2, C('grey', 2)).rect(11, 17, 3, 2, C('grey', 2));
  outline(p, K());
  return p;
}

function cartPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 7, 1.3, C('grey', 1));
  for (let y = 4; y < 13; y++) for (let x = 3 + (y - 4) / 3; x < 17; x++) if ((x + y) % 2 === 0 || y === 4 || y === 12) p.set(x, y, C('chrome', 6));
  p.rect(15, 2, 3, 2, C('red', 3));
  // Shopping: a giant box of food pills.
  p.rect(7, 5, 5, 5, C('pink', 3));
  oval(p, 10, 15, 6, 1, k ? C('teal', 5) : C('teal', 3));
  outline(p, K());
  return p;
}

function telemarketerPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.2, C('grey', 1));
  p.rect(6, 9, 8, 8, C('gold', 3)).rect(6, 9, 8, 2, C('gold', 5));
  p.rect(7, 2, 6, 7, C('chrome', 5));
  p.set(8, 4, C('grey', 0)).set(11, 4, C('grey', 0));
  p.rect(8, 6, 4, 1, C('grey', 0));
  // A headset and a big old telephone handset.
  p.line(6, 2, 6, 6, C('grey', 1)).line(6, 6, 8, 7, C('grey', 1));
  p.rect(13, 9 + k, 4, 2, C('red', 3)).rect(15, 7 + k, 2, 6, C('red', 3));
  micro(p, 7, 12, '1-800', C('grey', 0));
  outline(p, K());
  return p;
}

function staticPic(k: number): Pixels {
  const p = blankS();
  const r = rng(k + 11);
  for (let y = 2; y < 18; y++)
    for (let x = 3; x < 17; x++) {
      const nx = (x - 10) / 7;
      const ny = (y - 9) / 8;
      if (nx * nx + ny * ny > 1 && y < 13) continue;
      if (y >= 13 && (x + k * 2) % 4 === 0) continue;
      p.set(x, y, C('grey', 2 + Math.floor(r() * 6)));
    }
  p.rect(7, 7, 2, 3, C('grey', 0)).rect(11, 7, 2, 3, C('grey', 0));
  return p;
}

function fishPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 10, 6, 4, C('orange', 3));
  oval(p, 10, 9, 5, 2, C('orange', 4));
  for (let i = 0; i < 4; i++) p.line(3, 10, 0, 7 + i * 2 + k, C('orange', 2));
  p.set(14, 9, C('grey', 0));
  // It wears a tiny diving helmet. It's the future.
  p.ring(14, 9, 3, C('glass', 3));
  outline(p, K());
  return p;
}

function dinoPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 7, 1.3, C('grey', 1));
  p.rect(5, 8, 9, 7, C('green', 3)).rect(5, 8, 9, 2, C('green', 4));
  blob(p, 15, 6, 4, 3.5, R('green'), 2, 4);
  p.rect(16, 8, 4, 2, C('green', 2));
  p.set(17, 9, C('grey', 7)).set(19, 9, C('grey', 7));
  p.set(16, 5, C('grey', 0));
  p.line(5, 11, 0, 13 + k, C('green', 2));
  p.rect(6, 15, 2, 3 - k, C('green', 2)).rect(11, 15, 2, 2 + k, C('green', 2));
  p.rect(13, 11, 2, 1, C('green', 2));
  outline(p, K());
  return p;
}

function grandmaPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.3, C('grey', 1));
  oval(p, 10, 3, 3, 2.5, C('grey', 6));
  blob(p, 10, 6, 4, 3.5, R('skin'), 1, 3);
  p.rect(7, 6, 2, 1, C('chrome', 2)).rect(11, 6, 2, 1, C('chrome', 2));
  p.rect(9, 8, 2, 1, C('red', 2));
  p.rect(6, 10, 8, 7, C('purple', 3)).rect(6, 10, 8, 2, C('purple', 4));
  p.line(14, 11, 17, 8 - k * 2, C('purple', 3));
  p.rect(7, 17, 2, 2, C('grey', 7)).rect(11, 17, 2, 2, C('grey', 7));
  outline(p, K());
  return p;
}

function meteorPic(k: number): Pixels {
  const p = blankS();
  for (let i = 0; i < 8; i++) p.line(13 - i, 4 + i, 19 - i * 0.5, 0 + i * 0.3, i % 2 ? C('orange', 4) : C('gold', 5));
  blob(p, 8, 12, 5, 5, R('wood'), 0, 3);
  p.set(6, 10, C('orange', 4)).set(10, 14, C('orange', 3));
  if (k) p.set(14, 2, C('red', 4));
  outline(p, K());
  return p;
}

function boomPic(k: number): Pixels {
  const p = blankS();
  blob(p, 10, 11, 7 - k, 6 - k, R('orange'), 1, 4);
  blob(p, 10, 10, 4 - k, 3, R('gold'), 3, 5);
  for (let a = 0; a < 6; a++) p.set(10 + Math.cos(a) * (8 + k), 10 + Math.sin(a) * (8 + k), C('grey', 6));
  return p;
}

function buggyPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 8, 1.3, C('moon', 0));
  p.rect(3, 9, 14, 4, C('gold', 3)).rect(3, 9, 14, 1, C('gold', 5));
  p.rect(9, 5, 5, 4, C('chrome', 4));
  p.disc(12, 4, 2, C('glass', 3));
  for (const x of [5, 15]) {
    p.disc(x, 15, 3, C('grey', 1));
    p.disc(x, 15, 1, C('chrome', 5));
    p.set(x + (k ? 2 : -2), 15, C('grey', 3));
  }
  p.line(4, 9, 2, 3, C('chrome', 5));
  p.set(2, 3, C('red', 4));
  outline(p, K());
  return p;
}

function lavaPic(k: number): Pixels {
  const p = blankS();
  blob(p, 10, 11 - k, 5, 5, R('orange'), 1, 4);
  p.set(8, 9 - k, C('gold', 5)).set(12, 12 - k, C('red', 3));
  oval(p, 10, 18, 4, 1, C('grey', 1));
  outline(p, C('red', 1));
  return p;
}

function shopperPic(k: number): Pixels {
  const p = blankS();
  oval(p, 10, 18, 5, 1.2, C('grey', 1));
  p.rect(7, 8, 6, 8, C('teal', 3));
  blob(p, 10, 5, 3.5, 3.5, R('chrome'), 3, 7);
  p.rect(8, 4, 4, 1, C('neon', 3));
  p.rect(2, 10 + k, 4, 5, C('pink', 3)).rect(14, 10 + (1 - k), 4, 5, C('gold', 4));
  p.rect(8, 16, 1, 3, C('chrome', 3)).rect(11, 16, 1, 3, C('chrome', 3));
  outline(p, K());
  return p;
}

function skaterPic(k: number): Pixels {
  const p = blankS();
  // A teenager on a hoverboard. Also from 1989's idea of 2015, which is close enough.
  oval(p, 10, 19, 8, 1, C('grey', 1));
  p.rect(2, 15, 16, 2, C('pink', 3)).rect(2, 15, 16, 1, C('pink', 5));
  oval(p, 10, 17 + k, 5, 0.8, C('teal', 5));
  p.rect(7, 8, 6, 7, C('denim', 2));
  blob(p, 10, 5, 3, 3, R('skin'), 1, 3);
  p.rect(7, 2, 6, 2, C('gold', 4));
  p.line(7, 9, 3, 6 + k, C('denim', 2)).line(13, 9, 17, 11 - k, C('denim', 2));
  outline(p, K());
  return p;
}

function coverMon(): Pixels {
  return coverPic();
}

export interface MonsterBlocks {
  set: BlockSet;
}

export function buildMonsterBlocks(): BlockSet {
  const s = new BlockSet(100, true);
  const two = (name: string, f: (k: number) => Pixels, def: BlockDef = {}) => {
    s.add(`${name}0`, f(0), def);
    s.add(`${name}1`, f(1), def);
  };
  two('zap', shotPic);
  two('pop', popPic);
  two('mower', mowerPic, { hp: -2 });
  two('dog', (k) => dogPic(k), { hp: -10 });
  two('paper', paperPic, { hp: -6 });
  two('paperbot', paperbotPic, { hp: -2 });
  two('alien', (k) => alienPic(k, 'alien'), { hp: 25, score: 50 });
  two('alien2', (k) => alienPic(k, 'purple'), { hp: 25, score: 50 });
  two('beam', beamPic);
  two('carR', (k) => carPic(k, 'red'), { hp: -3 });
  two('carT', (k) => carPic(k, 'teal'), { hp: -5 });
  two('truck', (k) => carPic(k, 'gold', true), { hp: -3 });
  two('faxbot', faxbotPic, { hp: -8 });
  two('secbot', secbotPic, { hp: -12 });
  two('cart', cartPic, { hp: -2 });
  two('tele', telemarketerPic, { hp: -10 });
  two('static', staticPic, { hp: -8 });
  two('fish', fishPic, { hp: -2 });
  two('dino', dinoPic, { hp: -4 });
  two('grandma', grandmaPic, { hp: 40, score: 100 });
  two('meteor', meteorPic, { hp: -15 });
  two('boom', boomPic);
  two('buggy', buggyPic, { hp: -2 });
  two('lava', lavaPic, { hp: -8 });
  two('sparky', (k) => dogPic(k, true), { hp: -4 });
  two('sparkyMad', (k) => dogPic(k, true, true), { hp: -6 });
  two('dizzy', (k) => {
    const p = dogPic(0, true);
    // Seeing stars: three of them, going round.
    for (let i = 0; i < 3; i++) {
      const a = k * 1 + (i * Math.PI * 2) / 3;
      const x = 14 + Math.cos(a) * 5;
      const y = 2 + Math.sin(a) * 1.5;
      p.set(x, y, C('gold', 5))
        .set(x + 1, y, C('gold', 4))
        .set(x, y + 1, C('gold', 4));
    }
    return p;
  });
  s.add('cover', coverMon(), { effect: CTR.cover, eamt: 1, score: 2000 });
  two('shopper', shopperPic, { hp: -6 });
  two('skater', skaterPic, { hp: -4 });
  return s;
}
