// SPACE.BBL: the galaxy chart and the five sector charts the pod flies over. Planets are
// 2x2 block pictures (fly into the middle to land), shard gates bar the way to sectors
// and to the Core, and trading posts sell supplies by the credit.
import { Pixels, rng, dither } from '../kit/pixels';
import { CLEAR, Mask, fill, outline, pick, shade, sprite, tileNoise } from './art';
import { G, SOLID, SetBuilder, over, tex } from './blockset';
import { ITEM_BASE, MONEY, SEQ, SHARD_BASE, SHARD_COUNTER } from './common';
import { PICKUPS, drawModule, drawPickup, drawShard } from './items';
import { OUTLINE, S, SHARD_RAMPS, WHITE, shared } from './palette';
import { PICKUP_FX, R } from './surface';

const voidBg = (seed: number, stars: number) => {
  const sky = R('sky');
  const star = R('star');
  const r = rng(seed);
  const n = tileNoise(seed, 20, 2);
  const p = tex((x, y) => (dither(x, y, n(x, y) * 0.5) ? sky[1] : sky[0]));
  for (let i = 0; i < stars; i++) {
    const x = Math.floor(r() * 20);
    const y = Math.floor(r() * 20);
    p.set(x, y, star[Math.floor(r() * 3)]);
  }
  if (stars > 4) {
    const x = 3 + Math.floor(r() * 14);
    const y = 3 + Math.floor(r() * 14);
    p.set(x, y, star[3])
      .set(x - 1, y, star[1])
      .set(x + 1, y, star[1])
      .set(x, y - 1, star[1])
      .set(x, y + 1, star[1]);
  }
  return p;
};

function nebula(seed: number): Pixels {
  const n = tileNoise(seed, 20, 4);
  const n2 = tileNoise(seed + 3, 20, 8);
  const c = R('cloud');
  const f = R('far');
  const bg = voidBg(seed, 2);
  return tex((x, y) => {
    const v = n(x, y) * 0.7 + n2(x, y) * 0.3;
    if (v < 0.35) return bg.get(x, y);
    if (v < 0.45) return dither(x, y, (v - 0.35) * 10) ? f[1] : bg.get(x, y);
    if (v < 0.6) return f[2];
    if (v < 0.72) return dither(x, y, (v - 0.6) * 8) ? c[1] : f[3];
    return c[v > 0.8 ? 2 : 1];
  });
}

/** A 40x40 planet picture. */
function planet(kind: number, seed: number): Pixels {
  const p = new Pixels(40, 40, CLEAR);
  const roles = [
    ['top', 'plant', 'liquid'], // living world
    ['soil', 'rock', 'hazard'], // rocky
    ['liquid', 'cloud', 'crystal'], // ocean
    ['hideA', 'hideB', 'cloud'], // gas giant
    ['rock', 'deep', 'glow'], // dead moon
    ['crystal', 'cave', 'star'], // crystal
    ['hazard', 'liquid', 'deep'], // lava
    ['plant', 'bloom', 'top'], // jungle
    ['tech', 'glow', 'deep'], // machine world
  ][kind % 9];
  const [a, b, c] = roles.map((n) => R(n));
  const r = rng(seed);
  const n = tileNoise(seed, 40, 5);
  const body = new Mask(40, 40).ellipse(20, 20, 15, 15);
  const bandy = kind === 3;
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) {
      if (!body.get(x, y)) continue;
      const dx = (x - 20) / 15;
      const dy = (y - 20) / 15;
      const light = Math.max(0, Math.min(1, 0.55 - dx * 0.45 - dy * 0.35 + Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) * 0.35));
      let ramp = a;
      const v = bandy ? (Math.sin(y * 0.9 + n(x, y) * 3) + 1) / 2 : n(x, y);
      if (v > 0.62) ramp = b;
      if (v > 0.8 && !bandy) ramp = c;
      p.set(x, y, pick(ramp.slice(0, ramp.length - (ramp === c ? 0 : 1)), light * 0.95));
    }
  // atmosphere rim
  const rim = new Mask(40, 40).ellipse(20, 20, 16, 16).minus(body);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (rim.get(x, y) && x + y < 44) p.set(x, y, R('cloud')[1]);
  // rings for some
  if (kind === 3 || kind === 5) {
    for (let t = 0; t < 360; t += 1.5) {
      const rx = 20 + Math.cos((t * Math.PI) / 180) * 19;
      const ry = 20 + Math.sin((t * Math.PI) / 180) * 5;
      const front = Math.sin((t * Math.PI) / 180) > 0;
      if (front || !body.get(Math.round(rx), Math.round(ry))) p.set(rx, ry, c[Math.floor(t / 40) % 2 ? 2 : 3]);
    }
  }
  // a little moon
  if (r() < 0.4) shade(p, new Mask(40, 40).ellipse(34, 6, 2.5, 2.5), R('rock').slice(2));
  outline(p, OUTLINE);
  return p;
}

function sun(): Pixels {
  const p = new Pixels(40, 40, CLEAR);
  const fl = shared.get('flame')!;
  const g = shared.get('gold')!;
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) {
      const d = Math.hypot(x - 19.5, y - 19.5);
      if (d < 12) p.set(x, y, d < 6 ? WHITE : d < 9 ? g[4] : g[3]);
      else if (d < 16) p.set(x, y, dither(x, y, (16 - d) / 4) ? fl[4] : fl[3]);
      else if (d < 20 && (x * 7 + y * 3) % 5 === 0) p.set(x, y, fl[2]);
    }
  return p;
}

function blackHole(): Pixels {
  const p = new Pixels(60, 60, CLEAR);
  const disk = R('cave');
  const pl = R('plant');
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 60; x++) {
      const dx = x - 29.5;
      const dy = (y - 29.5) * 2.4;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      if (Math.hypot(x - 29.5, y - 29.5) < 8) p.set(x, y, 0);
      else if (d < 29 && d > 9) {
        const swirl = (Math.sin(a * 3 + d * 0.35) + 1) / 2;
        p.set(x, y, pick([...disk.slice(2), ...pl.slice(4)], swirl * 0.6 + (1 - d / 29) * 0.4));
      } else if (Math.hypot(x - 29.5, y - 29.5) < 9.5) p.set(x, y, pl[6]);
    }
  return p;
}

function portal(frame: number): Pixels {
  const p = new Pixels(40, 40, CLEAR);
  const g = R('glow');
  const t = shared.get('metal')!;
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 40; x++) {
      const d = Math.hypot(x - 19.5, y - 19.5);
      const a = Math.atan2(y - 19.5, x - 19.5);
      if (d > 17 && d < 19.5) p.set(x, y, t[(Math.floor((a + Math.PI) * 4) + frame) % 2 ? 4 : 2]);
      else if (d <= 17) {
        const s = (Math.sin(a * 4 + d * 0.5 - frame * 1.6) + 1) / 2;
        p.set(x, y, d < 4 ? WHITE : pick(g, s * 0.8 + (1 - d / 17) * 0.3));
      }
    }
  outline(p, OUTLINE);
  return p;
}

function hull(kind: number): Pixels {
  const t = R('tech');
  const g = R('glow');
  const n = tileNoise(400 + kind, 20, 2);
  return tex((x, y) => {
    const edge = x === 0 || y === 0 || x === 19 || y === 19;
    if (edge) return t[1];
    if (kind === 1 && y % 5 === 2 && x > 2 && x < 17) return x % 4 === 0 ? g[4] : t[0];
    if (kind === 2 && Math.hypot(x - 10, y - 10) < 4) return Math.hypot(x - 9, y - 9) < 2 ? WHITE : g[2];
    if (kind === 3 && (x === 10 || y === 10)) return t[0];
    if ((x === 3 || x === 16) && (y === 3 || y === 16)) return t[6];
    return pick(t.slice(2, 6), n(x, y));
  });
}

function vendor(kind: 'pay' | 'goods' | 'sold', icon: Pixels, cost: number): Pixels {
  const t = R('tech');
  const p = tex((x, y) => {
    if (x === 0 || y === 0 || x === 19 || y === 19) return t[0];
    if (x === 1 || y === 1) return t[5];
    return t[kind === 'sold' ? 1 : 2];
  });
  if (kind === 'goods') p.blit(icon, 0, 0, CLEAR);
  else if (kind === 'pay') {
    // the price as pips: one gold pip per 10 credits (up to 10)
    p.blit(
      icon.crop(4, 2, 12, 12).map((_x, _y, c) => (c === CLEAR ? CLEAR : c & 1 ? t[4] : t[3])),
      4,
      2,
      CLEAR,
    );
    const pips = Math.min(10, Math.round(cost / 10));
    for (let i = 0; i < pips; i++)
      p.set(3 + (i % 5) * 3, 15 + Math.floor(i / 5) * 2, S('gold', 4)).set(4 + (i % 5) * 3, 15 + Math.floor(i / 5) * 2, S('gold', 2));
  } else {
    p.line(5, 10, 15, 10, t[3]);
  }
  return p;
}

function gate(shard: number | -1): Pixels {
  const t = shared.get('metal')!;
  const ramp = shard >= 0 ? shared.get(SHARD_RAMPS[shard])! : R('glow');
  const p = tex((x, y) => {
    if (x < 3 || x > 16) return t[(y % 4 === 0 ? 1 : 3) + (x < 3 ? 0 : 1)];
    if (shard < 0) return (x + y) % 7 === 0 ? R('glow')[0] : R('sky')[0];
    return (x * 3 + y * 5) % 4 === 0 ? ramp[ramp.length - 1] : ramp[1 + ((x + y) % 2)];
  });
  if (shard >= 0) {
    const icon = drawShard(shard).crop(3, 0, 14, 20);
    const small = new Pixels(14, 20, CLEAR);
    small.blit(icon, 0, 0, CLEAR);
    fill(p, new Mask().ellipse(10, 10, 5, 7), OUTLINE);
    p.blit(drawShard(shard).crop(5, 1, 10, 18), 5, 1, CLEAR);
  }
  return p;
}

function asteroid(seed: number, bgSeed: number): Pixels {
  const p = sprite();
  const r = rng(seed);
  const m = new Mask();
  for (let i = 0; i < 5; i++) m.ellipse(10 + (r() - 0.5) * 7, 10 + (r() - 0.5) * 7, 4 + r() * 4, 4 + r() * 4);
  shade(p, m, R('rock'), { dither: true, seed });
  for (let i = 0; i < 4; i++) {
    const cx = 5 + r() * 10;
    const cy = 5 + r() * 10;
    if (m.get(Math.round(cx), Math.round(cy))) fill(p, new Mask().ellipse(cx, cy, 1.4, 1.2), R('rock')[1]);
  }
  outline(p, OUTLINE);
  return over(voidBg(bgSeed, 2), p);
}

function glyph(n: number): Pixels {
  // a sector number on a nav buoy
  const p = voidBg(600 + n, 1);
  const g = R('glow');
  shade(p, new Mask().ellipse(10, 10, 9, 9), [OUTLINE, R('tech')[1], R('tech')[2]]);
  const digits: Record<number, string[]> = {
    1: ['.#.', '##.', '.#.', '.#.', '###'],
    2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'],
    4: ['#.#', '#.#', '###', '..#', '..#'],
    5: ['###', '#..', '##.', '..#', '##.'],
    0: ['.#.', '#.#', '###', '#.#', '.#.'], // the Core: a star sign
  };
  digits[n].forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && p.rect(6 + x * 3, 3 + y * 3, 2, 2, g[4]).set(6 + x * 3, 3 + y * 3, WHITE)));
  return p;
}

function signal(frame: number): Pixels {
  const p = voidBg(700, 1);
  const g = shared.get('gold')!;
  for (let k = 0; k < 3; k++) {
    const rr = 3 + k * 3 + frame * 1.5;
    for (let a = 0; a < 40; a++) {
      const x = 10 + Math.cos((a / 40) * Math.PI * 2) * rr;
      const y = 10 + Math.sin((a / 40) * Math.PI * 2) * rr;
      if (a % 3 !== 0) p.set(x, y, g[4 - k]);
    }
  }
  p.set(10, 10, WHITE);
  return p;
}

function debris(seed: number): Pixels {
  const p = sprite();
  const r = rng(seed);
  const t = R('tech');
  for (let i = 0; i < 3; i++) {
    const x = 3 + r() * 12;
    const y = 3 + r() * 12;
    const m = new Mask().poly([
      [x, y],
      [x + 4 + r() * 3, y + r() * 2],
      [x + 3, y + 4 + r() * 2],
    ]);
    shade(p, m, t.slice(1));
  }
  outline(p, OUTLINE);
  return over(voidBg(seed + 50, 3), p);
}

function comet(): Pixels {
  const p = voidBg(800, 1);
  const c = R('cloud');
  for (let i = 0; i < 18; i++) p.line(2 + i * 0.5, 2 + i * 0.6, 2, 2 + i * 0.2, c[Math.min(3, Math.floor(i / 5))]);
  shade(p, new Mask().ellipse(14, 14, 3, 3), [c[2], c[3], WHITE]);
  return p;
}

export interface Ware {
  id: string;
  cost: number;
  effect: number;
  eamt: number;
  chHitPt?: number;
  icon: Pixels;
}

export const WARES: Ware[] = [
  { id: 'oneup', cost: 100, effect: 1, eamt: 1, icon: drawPickup('oneup') },
  { id: 'heal', cost: 20, effect: 0, eamt: 0, chHitPt: 50, icon: drawPickup('heart') },
  { id: 'plasma', cost: 30, effect: SEQ.plasma, eamt: 15, icon: drawPickup('plasma') },
  { id: 'nova', cost: 40, effect: SEQ.nova, eamt: 3, icon: drawPickup('nova') },
  { id: 'shield', cost: 30, effect: SEQ.shield, eamt: 3, icon: drawPickup('shield') },
  { id: 'medkit', cost: 50, effect: SEQ.medkit, eamt: 2, icon: drawPickup('medkit') },
];

export function spaceSet(): SetBuilder {
  const s = new SetBuilder('SPACE', G.none);
  for (let k = 0; k < 6; k++) s.add(`void:${k}`, voidBg(k + 1, [0, 1, 2, 3, 5, 7][k]));
  for (let k = 0; k < 6; k++) s.add(`neb:${k}`, nebula(20 + k));
  // nine planet designs, 2x2 each
  for (let k = 0; k < 9; k++) {
    const pic = planet(k, 100 + k * 7);
    const bg = voidBg(30 + k, 2);
    for (const [part, dx, dy] of [
      ['tl', 0, 0],
      ['tr', 20, 0],
      ['bl', 0, 20],
      ['br', 20, 20],
    ] as const)
      s.add(`planet${k}:${part}`, over(bg, pic.crop(dx, dy, 20, 20)));
  }
  const sunPic = sun();
  for (const [part, dx, dy] of [
    ['tl', 0, 0],
    ['tr', 20, 0],
    ['bl', 0, 20],
    ['br', 20, 20],
  ] as const)
    s.add(`sun:${part}`, over(voidBg(40, 0), sunPic.crop(dx, dy, 20, 20)), { chHitPt: -4, solid: SOLID });
  const bh = blackHole();
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) s.add(`core:${bx}${by}`, over(voidBg(41, 1), bh.crop(bx * 20, by * 20, 20, 20)));
  for (const f of [0, 1]) {
    const pic = portal(f);
    for (const [part, dx, dy] of [
      ['tl', 0, 0],
      ['tr', 20, 0],
      ['bl', 0, 20],
      ['br', 20, 20],
    ] as const)
      s.add(`warp${f}:${part}`, over(voidBg(42, 0), pic.crop(dx, dy, 20, 20)), { next: `warp${1 - f}:${part}`, ntime: 3 });
  }
  for (let k = 0; k < 5; k++) s.add(`rock:${k}`, asteroid(500 + k, 60 + k), { solid: SOLID });
  s.add(
    'rock:big',
    over(
      voidBg(66, 0),
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(0, 0, 20, 20), R('rock').slice(0, 5), { dither: true, seed: 4 });
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  for (let k = 0; k < 4; k++) s.add(`hull:${k}`, hull(k), { solid: SOLID });
  s.add(
    'dock',
    tex((x, y) => (y < 4 || y > 15 ? R('tech')[2] : (x + y) % 6 === 0 ? R('glow')[3] : R('sky')[1])),
  );
  for (const w of WARES) {
    // nudge the pad to pay; the goods appear and are taken at once: one of each per visit
    s.add(`buy:${w.id}`, vendor('pay', w.icon, w.cost), { solid: SOLID, effect: MONEY, eamt: -w.cost, touch: `goods:${w.id}` });
    s.add(`goods:${w.id}`, vendor('goods', w.icon, w.cost), {
      solid: SOLID,
      effect: w.effect || 0,
      eamt: w.eamt,
      chHitPt: w.chHitPt ?? 0,
      touch: `sold:${w.id}`,
    });
    // (no restock: Game-Maker animates block *types* on one clock, so a timed restock would turn every sold pad back at once and charge every tick)
    s.add(`sold:${w.id}`, vendor('sold', w.icon, w.cost), { solid: SOLID });
  }
  for (let k = 0; k <= 5; k++) s.add(`glyph:${k}`, glyph(k));
  s.add('signal:0', signal(0), { next: 'signal:1', ntime: 6 });
  s.add('signal:1', signal(1), { next: 'signal:0', ntime: 6 });
  for (let k = 0; k < 3; k++) s.add(`debris:${k}`, debris(900 + k));
  s.add('comet', comet());
  const buoy = (f: number) => {
    const p = voidBg(820, 1);
    shade(p, new Mask().rect(8, 6, 4, 10).ellipse(10, 6, 3, 2), shared.get('metal')!.slice(1, 6));
    p.line(10, 6, 10, 1, shared.get('metal')![4]);
    fill(p, new Mask().ellipse(10, 1.5, 1.5 + f, 1.5 + f), f ? S('heart', 3) : S('heart', 1));
    p.rect(6, 15, 8, 2, shared.get('metal')![2]);
    return p;
  };
  s.add('buoy:0', buoy(0), { next: 'buoy:1', ntime: 9 });
  s.add('buoy:1', buoy(1), { next: 'buoy:0', ntime: 9 });
  s.add(
    'satellite',
    over(
      voidBg(821, 2),
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(8, 7, 4, 6), shared.get('metal')!.slice(2));
        for (const x of [1, 13]) {
          p.rect(x, 8, 6, 4, R('glow')[1]);
          for (let i = 0; i < 6; i += 2) p.rect(x + i, 8, 1, 4, OUTLINE);
        }
        p.line(10, 7, 12, 3, shared.get('metal')![4]);
        return outline(p, OUTLINE);
      })(),
    ),
  );
  s.add(
    'wreck',
    over(
      voidBg(822, 1),
      (() => {
        const p = sprite();
        shade(
          p,
          new Mask().poly([
            [2, 12],
            [12, 6],
            [18, 9],
            [9, 16],
          ]),
          R('tech').slice(1),
        );
        p.line(12, 6, 15, 2, R('tech')[4]);
        for (let i = 0; i < 4; i++) p.set(6 + i * 3, 11, R('glow')[i % 2 ? 1 : 3]);
        return outline(p, OUTLINE);
      })(),
    ),
  );
  s.add('barrier:open', gate(-1));
  // drifting currents (gravity in space: solar wind pushes the pod)
  s.add(
    'wind:r',
    tex((x, y) => ((x + y * 3) % 9 === 0 ? R('glow')[1] : voidBg(70, 0).get(x, y))),
    { grav: G.right },
  );
  s.add(
    'wind:l',
    tex((x, y) => ((x * 2 + y) % 9 === 0 ? R('glow')[1] : voidBg(71, 0).get(x, y))),
    { grav: G.left },
  );
  s.add(
    'wind:u',
    tex((x, y) => ((x + y * 2) % 9 === 0 ? R('glow')[1] : voidBg(72, 0).get(x, y))),
    { grav: G.up },
  );
  s.add(
    'wind:d',
    tex((x, y) => ((x * 3 + y) % 9 === 0 ? R('glow')[1] : voidBg(73, 0).get(x, y))),
    { grav: G.down },
  );
  s.add(
    'mine',
    over(
      voidBg(74, 1),
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 10, 5, 5), shared.get('metal')!.slice(0, 5));
        for (let a = 0; a < 8; a++) p.line(10, 10, 10 + Math.cos(a * 0.785) * 8, 10 + Math.sin(a * 0.785) * 8, shared.get('flame')![2]);
        fill(p, new Mask().ellipse(10, 10, 2, 2), shared.get('heart')![3]);
        return outline(p, OUTLINE);
      })(),
    ),
    { chHitPt: -15, touch: 'void:0' },
  );
  // pickups as floating crates
  for (const id of PICKUPS) s.add(`p:${id}`, over(voidBg(80, 1), drawPickup(id)), { ...PICKUP_FX[id], touch: 'void:0' });
  // shared slots: the ten shard gates and the ten modules
  for (let i = 0; i < 10; i++) s.add(`gate:${i}`, gate(i), { solid: SOLID, effect: SHARD_COUNTER + i, eamt: 0, touch: 'barrier:open' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(voidBg(90, 0), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'void:0' }, ITEM_BASE + i);
  return s;
}
