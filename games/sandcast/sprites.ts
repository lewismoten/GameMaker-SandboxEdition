// Monster blocks (sandcast.mbl) and character blocks (sandcast.cbl).
import { CHARBL, MONBL, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../web/src/formats/blocks';
import { ANSI, BEETLE, GRASS, GREY, OCHRE, PINK, PURPLE, RED, SAND, STEEL, TABBY, WATER, WOOD, YELLOW } from './palette';
import { BlockSet } from './rules';
import { CLEAR, Pixels, art, ball, outline, rng, shade, sprite } from './art';

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
function hairball(frame: number): Pixels {
  const p = sprite();
  const r = rng(240 + frame);
  for (let n = 0; n < 160; n++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 6;
    const x = 10 + Math.cos(a) * d;
    const y = 11 + Math.sin(a) * d;
    p.line(x, y, x + Math.cos(a + frame) * 2, y + Math.sin(a + 1) * 2, shade(TABBY, 1 + r() * 4 - (y - 11) / 6));
  }
  p.set(8, 9, 0).set(12, 9, 0).set(8, 8, STEEL[7]).set(12, 8, STEEL[7]);
  return p;
}
mb.add('hairball0', hairball(0), { hp: -5 });
mb.add('hairball1', hairball(1), { hp: -5 });
function yarn(frame: number): Pixels {
  const p = sprite();
  ball(p, 10, 10, 7, PURPLE, 3);
  for (let k = 0; k < 5; k++) {
    const a = k * 0.7 + frame * 0.35;
    for (let t = -6; t <= 6; t++) {
      const x = 10 + Math.cos(a) * t;
      const y = 10 + Math.sin(a) * t + Math.cos(t / 2) * 1.5;
      if (Math.hypot(x - 10, y - 10) < 6.5) p.set(x, y, PURPLE[k % 2 ? 1 : 4]);
    }
  }
  p.line(16, 14, 19, 18 - frame * 2, PURPLE[2]);
  return p;
}
mb.add('yarn0', yarn(0), { hp: -2 });
mb.add('yarn1', yarn(1), { hp: -2 });
function paw(frame: number, angry: boolean, left: boolean): Pixels {
  const p = sprite();
  const ramp = angry ? RED : TABBY;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / 9;
      const dy = (y - 11 - frame) / 8;
      if (dx * dx + dy * dy <= 1 || (y < 11 + frame && Math.abs(x - 10) < 8)) {
        const stripe = !angry && Math.sin(y / 2.4) > 0.6 && y < 9;
        p.set(x, y, shade(ramp, (stripe ? 2.5 : 4.5) - dy * 1.2 + (angry ? 0 : 0.5)));
      }
    }
  for (const x of [5, 10, 15]) {
    p.disc(x, 15 + frame, 2, angry ? RED[6] : PINK[3]);
    if (angry) p.line(x, 17 + frame, x, 19, STEEL[7]);
  }
  p.disc(10, 10 + frame, 2.6, angry ? RED[6] : PINK[2]);
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
  const p = paw(0, false, true).map((_x, _y, c) => (c === CLEAR ? c : TABBY.includes(c) ? shade(TABBY, TABBY.indexOf(c) - 1.5) : c));
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
  // A fluffy tabby tail swishing across the flagstones, darker at the tip.
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
        p.set(x + dx, y + dy, t > 0.85 ? shade(TABBY, 1 + lit * 2) : shade(TABBY, (stripe ? 2.6 : 4.4) + lit * 2));
      }
  }
  return outline(p, TABBY[0]);
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

// ================================================================= the knight
export const cb = new BlockSet(CHARBL, true);

const K = {
  k: STEEL[0],
  S: STEEL[5],
  s: STEEL[3],
  w: STEEL[7],
  d: STEEL[1],
  r: RED[3],
  R: RED[5],
  b: WATER[3],
  B: WATER[5],
  Y: YELLOW[3],
  n: WOOD[1],
  c: RED[2],
  C: RED[4],
};

const HEAD_DOWN = [
  '         rR',
  '        rRRr',
  '       kkrRkk',
  '      kSSSSSsk',
  '     kSwSSSSssk',
  '     kSSSSSSssk',
  '     kkkkkkkkkk',
  '     kSdSdSdSdk',
  '     kSSSSSSssk',
  '      kssssssk',
];
const BODY_DOWN = ['    kkbbbYYbbbkk', '   kSkbbbYYbbbkSk', '   kskYYYYYYYYksk', '   kskbbbYYbbbksk', '    kkbbbYYbbbkk', '     kBBBBBBBBk'];
const LEGS = {
  stand: ['      kddkkddk', '      kddk kddk', '      knnk knnk', '      kkkk kkkk'],
  a: ['      kddkkddk', '      knnk kddk', '      kkkk knnk', '           kkkk'],
  b: ['      kddkkddk', '      kddk knnk', '      knnk kkkk', '      kkkk'],
};
const HEAD_UP = [
  '         rR',
  '        rRRr',
  '       krRRrk',
  '      kSSrRSsk',
  '     kSwSrRSssk',
  '     kSSSrRSssk',
  '     kSSSSSSssk',
  '     kSSSSSSssk',
  '     ksSSSSSsdk',
  '      kssssssk',
];
const BODY_UP = ['    kkcCCCCCckk', '   kSkcCCCCCCckSk', '   kskcCCCCCCcksk', '   kskcCCCCCCcksk', '    kkcCCCCCCckk', '     kcccccccck'];
const HEAD_RIGHT = [
  '     Rr',
  '    rRRr',
  '     rrkkkk',
  '     kSSSSSk',
  '    kSwSSSSsk',
  '    kSSSSSSsk',
  '    kSSSSkkkk',
  '    kSSSSdkdk',
  '    kSSSSSSsk',
  '     ksssssk',
];
const BODY_RIGHT = ['     kbbbbbbk', '    kbbkSSkbk', '    kbbkSSkbk', '    kbbbkkbbk', '     kbbbbbk', '     kBBBBBk'];
const LEGS_RIGHT = {
  stand: ['     kddkddk', '     kddkddk', '     knnknnk', '     kkkkkkk'],
  a: ['     kddkddk', '    kddk  kdk', '    knnk  knnk', '    kkkk  kkkk'],
  b: ['     kddkddk', '      kddkk', '      knnnk', '      kkkkk'],
};

function knight(head: string[], body: string[], legs: string[]): Pixels {
  return art([...head, ...body, ...legs], K);
}

/** Puts a bucket in the knight's hand. */
function withBucket(p: Pixels, x: number, y: number): Pixels {
  const b = art([' kkkk', 'k    k', 'kkkkkk', 'kBWWWk', 'kBWWWk', ' kBWk', ' kkkk'], { k: WATER[0], B: WATER[3], W: WATER[5] });
  return p.blit(b, x, y, CLEAR);
}

const STEPS = ['stand', 'a', 'b'] as const;
for (const st of STEPS) cb.add(`down_${st}`, knight(HEAD_DOWN, BODY_DOWN, LEGS[st]));
for (const st of STEPS) cb.add(`up_${st}`, knight(HEAD_UP, BODY_UP, LEGS[st === 'a' ? 'b' : st === 'b' ? 'a' : 'stand']));
for (const st of STEPS) cb.add(`right_${st}`, knight(HEAD_RIGHT, BODY_RIGHT, LEGS_RIGHT[st]));
for (const st of STEPS) cb.add(`bdown_${st}`, withBucket(knight(HEAD_DOWN, BODY_DOWN, LEGS[st]), 14, 11 + (st === 'a' ? 1 : 0)));
for (const st of STEPS)
  cb.add(`bup_${st}`, withBucket(knight(HEAD_UP, BODY_UP, LEGS[st === 'a' ? 'b' : st === 'b' ? 'a' : 'stand']), 0, 11 + (st === 'b' ? 1 : 0)));
for (const st of STEPS) cb.add(`bright_${st}`, withBucket(knight(HEAD_RIGHT, BODY_RIGHT, LEGS_RIGHT[st]), 11, 11));
// Plume sways while idle.
{
  const head = HEAD_DOWN.slice();
  head[0] = '          rR';
  head[1] = '         rRRr';
  cb.add('idle_sway', knight(head, BODY_DOWN, LEGS.stand));
}
// Flinging sand: shovel back over the shoulder, then forward with a spray.
{
  const p = knight(HEAD_DOWN, BODY_DOWN, LEGS.stand);
  p.line(15, 11, 18, 2, WOOD[5]).line(16, 11, 19, 2, WOOD[3]);
  p.rect(16, 0, 4, 3, RED[4]).set(16, 0, RED[6]);
  cb.add('fling_back', p);
  const q = knight(HEAD_DOWN, BODY_DOWN, LEGS.stand);
  q.line(14, 12, 17, 16, WOOD[5]).line(14, 13, 17, 17, WOOD[3]);
  q.rect(16, 16, 4, 4, RED[4]).set(16, 16, RED[6]);
  for (const [x, y] of [
    [18, 13],
    [19, 15],
    [17, 11],
  ])
    q.set(x, y, SAND[7]);
  cb.add('fling_fwd', q);
}
// Throwing water: bucket raised, then tipped.
{
  const p = withBucket(knight(HEAD_DOWN, BODY_DOWN, LEGS.stand), 14, 4);
  cb.add('splash_up', p);
  const q = withBucket(knight(HEAD_DOWN, BODY_DOWN, LEGS.stand), 14, 9);
  for (const [x, y] of [
    [19, 9],
    [18, 7],
    [19, 6],
    [17, 5],
  ])
    q.set(x, y, WATER[7]);
  cb.add('splash_out', q);
}
// Hurt: a flash of white, then red.
cb.add(
  'hurt_white',
  knight(HEAD_DOWN, BODY_DOWN, LEGS.stand).map((_x, _y, c) => (c === CLEAR ? c : c === K.k ? STEEL[4] : STEEL[7])),
);
cb.add(
  'hurt_red',
  knight(HEAD_DOWN, BODY_DOWN, LEGS.stand).map((_x, _y, c) => (c === CLEAR ? c : c === K.k ? RED[0] : shade(RED, 3 + (STEEL.includes(c) ? 2 : 0)))),
);
// Dying: the toy knight crumbles into a little pile of sand, helmet on top.
for (let k = 0; k < 4; k++) {
  const p = sprite();
  const pile = [0, 4, 6, 7][k];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const dx = (x - 10) / (6 + pile);
      const dy = (y - 19) / (pile + 0.1);
      if (pile && dx * dx + dy * dy <= 1) p.set(x, y, shade(SAND, 6 - dx * 1.5 - (y - 19 + pile) / (pile + 1)));
    }
  const knightPart = knight(HEAD_DOWN, BODY_DOWN, LEGS.stand);
  const keep = 20 - pile * 2.5;
  const drop = [0, 6, 10, 12][k];
  for (let y = 0; y < keep; y++)
    for (let x = 0; x < 20; x++) {
      const c = knightPart.get(x, y);
      if (c !== CLEAR && y + drop < 20 && (k === 0 || y < 10)) p.set(x, y + drop, c);
    }
  cb.add(`die${k}`, p);
}

export const MB = mb;
export const CB = cb;
export { GREY, GRASS };
