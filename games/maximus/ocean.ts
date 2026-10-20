// OCEAN.BBL: the sea worlds. Water has no gravity (the diving bell drifts and coasts),
// the air above has gravity (leap out and splash back). Currents push, bubble columns
// lift, anemones sting, and the uplink is a buoy bobbing on the surface.
import { Pixels, rng, dither } from '../kit/pixels';
import { CLEAR, Mask, fill, outline, pick, shade, sprite, tileNoise, fbm } from './art';
import { G, SOLID, TOP, SetBuilder, over, tex } from './blockset';
import { ITEM_BASE, MONEY, SHARD_BASE, SHARD_COUNTER } from './common';
import { PICKUPS, drawModule, drawPickup, drawShard } from './items';
import { OUTLINE, WHITE } from './palette';
import { PICKUP_FX, R } from './surface';

/** Water at depth band k (0 = just below the surface .. 7 = abyss). */
const water = (k: number, seed = 1) => {
  const sky = R('sky'); // ocean themes color "sky" as the water column, light..dark reversed
  const r = rng(seed * 13 + k);
  const p = tex((x, y) => {
    const t = 1 - (k * 20 + y) / 160;
    const f = t * 10.99;
    const i = Math.floor(f);
    return dither(x, y, f - i) ? sky[Math.min(11, i + 1)] : sky[i];
  });
  // motes drifting in the water
  for (let i = 0; i < 3; i++) p.set(r() * 20, r() * 20, sky[Math.min(11, 11 - k + 2)]);
  return p;
};
const deepWater = (seed: number) => water(7, seed);
const airBg = () => {
  const c = R('cloud');
  return tex((x, y) => (dither(x, y, y / 40) ? c[2] : c[3]));
};

function sandTex(seed: number, top: boolean, bg?: Pixels): Pixels {
  const t = R('top');
  const n = fbm(seed);
  const r = rng(seed);
  const p = tex((x, y) => {
    const ripple = Math.sin(x * 0.7 + y * 0.3 + seed) > 0.85;
    return ripple ? t[4] : pick(t.slice(1, 5), n(x, y));
  });
  if (top && bg) {
    const h = Array.from({ length: 20 }, (_, x) => 3 + Math.round(Math.sin(x * 0.5 + seed) * 1.2));
    p.map((x, y, c) => (y < h[x] ? bg.get(x, y) : y === h[x] ? t[5] : c));
  }
  for (let i = 0; i < 2; i++) {
    const x = 2 + r() * 15;
    const y = 8 + r() * 10;
    p.set(x, y, R('bloom')[3]).set(x + 1, y, R('bloom')[1]);
  }
  return p;
}

function reefRock(seed: number, role = 'rock'): Pixels {
  const c = R(role);
  const n = tileNoise(seed, 20, 3);
  const n2 = tileNoise(seed + 9, 20, 6);
  return tex((x, y) => {
    const v = n(x, y) * 0.7 + n2(x, y) * 0.3;
    if (Math.abs(v - 0.5) < 0.04) return c[0];
    const pit = n2(x, y) > 0.78;
    return pit ? c[1] : pick(c.slice(2, c.length), v);
  });
}

function coral(seed: number, kind: number): Pixels {
  const p = sprite();
  const r = rng(seed);
  const ramp = R(kind % 2 ? 'bloom' : 'plant');
  if (kind < 2) {
    // branching coral
    const branch = (x: number, y: number, a: number, len: number, d: number) => {
      if (d > 4 || len < 2) return;
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      p.line(x, y, x2, y2, ramp[2 + (d % 3)]);
      p.line(x + 1, y, x2 + 1, y2, ramp[1 + (d % 3)]);
      branch(x2, y2, a - 0.5 - r() * 0.3, len * 0.7, d + 1);
      branch(x2, y2, a + 0.5 + r() * 0.3, len * 0.7, d + 1);
    };
    branch(10, 20, -Math.PI / 2, 7, 0);
    for (let i = 0; i < 4; i++) p.set(4 + r() * 12, 3 + r() * 8, ramp[ramp.length - 1]);
  } else if (kind === 2) {
    // brain coral
    shade(p, new Mask().ellipse(10, 15, 8, 5.5), ramp);
    for (let x = 3; x < 18; x += 3) p.line(x, 11, x + 1, 19, ramp[1]);
  } else {
    // fan coral
    for (let a = -1.3; a <= 1.3; a += 0.18) p.line(10, 19, 10 + Math.sin(a) * 9, 19 - Math.cos(a) * 12, ramp[2 + (Math.round(Math.abs(a) * 2) % 3)]);
  }
  return outline(p, OUTLINE);
}

function kelp(part: 'top' | 'mid', frame: number): Pixels {
  const p = sprite();
  const pl = R('plant');
  for (let s = 0; s < 2; s++) {
    let x = 7 + s * 6;
    for (let y = 19; y >= (part === 'top' ? 4 + s * 3 : 0); y--) {
      x += Math.sin(y * 0.4 + frame + s) * 0.35;
      p.set(x, y, pl[3 + s]).set(x + 1, y, pl[2]);
      if (y % 5 === s * 2) p.line(x + 1, y, x + 4, y - 2, pl[4]).line(x, y, x - 3, y - 2, pl[3]);
    }
    if (part === 'top') fill(p, new Mask().ellipse(7 + s * 6, 4 + s * 3, 1.5, 2), pl[5]);
  }
  return p;
}

function anemone(frame: number): Pixels {
  const p = sprite();
  const h = R('hazard');
  shade(p, new Mask().ellipse(10, 17, 6, 3), R('bloom'));
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + i * 0.3;
    p.line(10, 16, 10 + Math.sin(a + frame * 0.15) * 9, 16 - Math.cos(a) * (8 + (i % 3)), h[2 + (i % 3)]);
  }
  return outline(p, OUTLINE);
}

function bubbles(frame: number, bg: Pixels, strong: boolean): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const c = R('cloud');
  const r = rng(5);
  for (let i = 0; i < (strong ? 10 : 5); i++) {
    const x = 4 + r() * 12;
    const y = (r() * 20 - frame * 6 + 40) % 20;
    const rr = 1 + r() * 1.4;
    for (let a = 0; a < 8; a++) p.set(x + Math.cos(a) * rr, y + Math.sin(a) * rr, c[3]);
    p.set(x - 0.5, y - 0.5, WHITE);
  }
  return p;
}

function current(dir: 'r' | 'l' | 'd', frame: number, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const g = R('glow');
  for (let k = 0; k < 4; k++) {
    const o = (k * 5 + frame * 4) % 20;
    for (let i = 0; i < 5; i++) {
      if (dir === 'd') p.set(3 + k * 4 + (i % 2), (o + i) % 20, g[1 + (i >> 1)]);
      else p.set(dir === 'r' ? (o + i) % 20 : (20 - o - i + 40) % 20, 3 + k * 4 + (i % 2), g[1 + (i >> 1)]);
    }
  }
  return p;
}

function buoy(frame: number): Pixels {
  // the uplink buoy half out of the water
  const p = surfaceWave(frame);
  const t = R('tech');
  const g = R('glow');
  shade(p, new Mask().ellipse(10, 12, 5, 4).rect(8, 3, 4, 9), [...t.slice(1, 4), R('hazard')[3], R('hazard')[4]]);
  fill(p, new Mask().ellipse(10, 3, 2 + frame, 2 + frame), g[3 + frame]);
  p.set(10, 2, WHITE);
  return outline(p, OUTLINE);
}

function surfaceWave(frame: number): Pixels {
  const air = airBg();
  const w = water(0, 9);
  const l = R('liquid');
  return tex((x, y) => {
    const h = 9 + Math.round(Math.sin((x + frame * 4) * 0.45) * 1.6);
    if (y < h) return air.get(x, y);
    if (y === h) return WHITE;
    if (y === h + 1) return l[5];
    return w.get(x, y);
  });
}

function wreck(part: number): Pixels {
  const t = R('ruin');
  const rust = R('stem');
  const n = tileNoise(300 + part, 20, 4);
  const bg = water(5, 30 + part);
  return tex((x, y) => {
    if (part === 3 && (x - 10) ** 2 + (y - 10) ** 2 < 16) return bg.get(x, y); // porthole hole
    if (part === 4 && y < 10 - Math.abs(x - 10) * 0.6) return bg.get(x, y); // bow
    const plank = y % 5 === 0;
    if (plank) return t[0];
    const rv = n(x, y);
    return rv > 0.7 ? rust[2 + (x & 1)] : t[2 + Math.floor(rv * 3)];
  });
}

function shrine(empty: boolean): Pixels {
  const ruin = R('ruin');
  const p = deepWater(31);
  const arch = new Mask().rect(1, 2, 18, 18).minus(new Mask().ellipse(10, 11, 6.5, 8).rect(4, 11, 12, 8));
  shade(p, arch, ruin.slice(1));
  shade(p, new Mask().rect(4, 17, 12, 3), ruin.slice(2));
  if (empty) p.set(10, 12, R('glow')[1]);
  return outline(p, OUTLINE);
}

function clam(open: boolean): Pixels {
  const p = sprite();
  const c = R('hideD');
  shade(p, new Mask().ellipse(10, 15, 8, 4), c);
  if (open) {
    shade(p, new Mask().ellipse(10, 9, 8, 4).rect(0, 11, 20, 9, false), c);
    fill(p, new Mask().ellipse(10, 12.5, 2.5, 2.5), WHITE);
  } else for (let x = 3; x < 18; x += 3) p.line(x, 12, x + 1, 18, c[1]);
  return outline(p, OUTLINE);
}

export function oceanSet(): SetBuilder {
  const s = new SetBuilder('OCEAN', G.none);
  // air above the sea (gravity), the waves, the water column
  s.add('air', airBg(), { grav: G.down });
  s.add(
    'air:cloud',
    over(
      airBg(),
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 10, 8, 4).ellipse(7, 8, 4, 3).ellipse(13, 8, 4, 3), [R('cloud')[2], R('cloud')[3], WHITE]);
        return p;
      })(),
    ),
    { grav: G.down },
  );
  s.add('ceiling', airBg(), { solid: SOLID });
  s.add('surf:0', surfaceWave(0), { next: 'surf:1', ntime: 5 });
  s.add('surf:1', surfaceWave(1), { next: 'surf:0', ntime: 5 });
  for (let k = 0; k < 8; k++) s.add(`water:${k}`, water(k, k + 3));
  s.add(
    'water:dark',
    deepWater(40).map((x, y, c) => ((x * 7 + y * 3) % 11 === 0 ? R('sky')[1] : c)),
  );
  // the sea floor
  for (let k = 0; k < 3; k++) s.add(`sand:top${k}`, sandTex(10 + k, true, water(6, 11 + k)), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`sand:${k}`, sandTex(20 + k, false), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`reef:${k}`, reefRock(30 + k), { solid: SOLID });
  for (let k = 0; k < 2; k++) s.add(`abyss:${k}`, reefRock(40 + k, 'deep'), { solid: SOLID });
  s.add(
    'bedrock',
    tex((x, y) => R('deep')[(x * 7 + y * 3) % 5 === 0 ? 1 : 0]),
    { solid: SOLID },
  );
  s.add(
    'reef:ledge',
    tex((x, y) => (y < 7 ? (y === 0 ? R('rock')[6] : R('rock')[2 + ((x + y) % 3)]) : water(4, 50).get(x, y))),
    { solid: TOP },
  );
  s.add(
    'crystal:wall',
    over(
      reefRock(44, 'deep'),
      (() => {
        const p = sprite();
        for (let i = 0; i < 3; i++)
          shade(
            p,
            new Mask().poly([
              [4 + i * 6, 18],
              [8 + i * 6, 18],
              [6 + i * 6, 4 + i * 3],
            ]),
            R('crystal'),
          );
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  // decorations in the water
  const D = (name: string, sp: Pixels, depth = 5, props = {}) => s.add(name, over(water(depth, 60 + s.count), sp), props);
  for (let k = 0; k < 4; k++) D(`coral:${k}`, coral(70 + k, k));
  D('coral:deep', coral(74, 1), 7);
  D('kelp:top', kelp('top', 0));
  D('kelp:mid', kelp('mid', 0));
  D('kelp:top2', kelp('top', 1), 6);
  D('kelp:mid2', kelp('mid', 1), 6);
  D(
    'shell',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 16, 5, 3.5), R('bloom'));
      for (let a = 0; a < 5; a++) p.line(10, 19, 6 + a * 2, 13, R('bloom')[1]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'rocks',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(6, 16, 5, 4).ellipse(14, 17, 4, 3), R('rock'));
      return outline(p, OUTLINE);
    })(),
  );
  D('clam', clam(false), 6);
  D(
    'pillar',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 0, 10, 20), R('ruin').slice(1), { light: [-1, 0] });
      for (let y = 2; y < 20; y += 6) p.line(7, y, 7, y + 3, R('ruin')[1]);
      return outline(p, OUTLINE);
    })(),
    6,
  );
  D(
    'pillar:top',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 4, 10, 16).rect(2, 2, 16, 4), R('ruin').slice(1), { light: [-1, 0] });
      return outline(p, OUTLINE);
    })(),
    6,
  );
  D(
    'statue',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 6, 4, 4.5).rect(6, 10, 8, 9).ellipse(10, 11, 6, 2.5), R('ruin').slice(2));
      p.set(8, 6, R('glow')[4]).set(12, 6, R('glow')[4]);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  D(
    'bones',
    (() => {
      const p = sprite();
      const b = R('ruin');
      p.line(2, 16, 18, 14, b[6]).line(2, 17, 18, 15, b[4]);
      for (let x = 4; x < 17; x += 3) p.line(x, 15, x + 1, 9, b[5]);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  // wrecks (solid hull, open portholes and bow)
  for (let k = 0; k < 5; k++) s.add(`wreck:${k}`, wreck(k), { solid: k >= 3 ? 0 : SOLID });
  // hazards and currents
  s.add('anemone', over(water(6, 80), anemone(0)), { chHitPt: -2, next: 'anemone2', ntime: 7 });
  s.add('anemone2', over(water(6, 80), anemone(1)), { chHitPt: -2, next: 'anemone', ntime: 7 });
  s.add(
    'urchins',
    over(
      water(6, 81),
      (() => {
        const p = sprite();
        for (const cx of [5, 14])
          for (let a = 0; a < 10; a++) p.line(cx, 16, cx + Math.cos(a * 0.63) * 5, 16 + Math.sin(a * 0.63) * 4, R('hazard')[2 + (a % 3)]);
        return p;
      })(),
    ),
    { solid: SOLID, chHitPt: -3 },
  );
  s.add(
    'vent',
    over(
      reefRock(45),
      (() => {
        const p = sprite();
        fill(p, new Mask().ellipse(10, 4, 4, 2.5), OUTLINE);
        p.set(9, 3, R('hazard')[4]).set(11, 4, R('hazard')[3]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  s.add(
    'hotwater',
    bubbles(0, water(7, 82), true).map((x, y, c) => ((x + y) % 5 === 0 ? R('hazard')[2] : c)),
    { chHitPt: -1, grav: G.up, next: 'hotwater2', ntime: 2 },
  );
  s.add(
    'hotwater2',
    bubbles(1, water(7, 82), true).map((x, y, c) => ((x * 2 + y) % 5 === 0 ? R('hazard')[2] : c)),
    { chHitPt: -1, grav: G.up, next: 'hotwater', ntime: 2 },
  );
  s.add('bubbles', bubbles(0, water(5, 83), false), { grav: G.up, next: 'bubbles2', ntime: 2 });
  s.add('bubbles2', bubbles(1, water(5, 83), false), { grav: G.up, next: 'bubbles', ntime: 2 });
  for (const d of ['r', 'l', 'd'] as const) {
    const grav = d === 'r' ? G.right : d === 'l' ? G.left : G.down;
    s.add(`current:${d}`, current(d, 0, water(4, 84)), { grav, next: `current:${d}2`, ntime: 2 });
    s.add(`current:${d}2`, current(d, 1, water(4, 84)), { grav, next: `current:${d}`, ntime: 2 });
  }
  // touch-to-change
  s.add(
    'glass',
    over(deepWater(85), coral(86, 2)).map((x, y, c) => ((x * y) % 7 === 3 ? R('crystal')[4] : c)),
    { solid: SOLID, scorePts: 50, touch: 'glass:broken' },
  );
  s.add(
    'glass:broken',
    over(
      deepWater(87),
      (() => {
        const p = sprite();
        for (let i = 0; i < 6; i++) p.set(3 + i * 3, 17 + (i % 2), R('crystal')[3]);
        return p;
      })(),
    ),
  );
  s.add('fake', reefRock(31));
  s.add(
    'door',
    tex((x, y) => {
      const t = R('tech');
      if (x < 2 || x > 17) return t[1];
      if (y > 7 && y < 12 && x > 6 && x < 13) return x === 9 || x === 10 ? t[0] : R('accent')[4];
      return y % 5 === 0 ? t[1] : t[3 + ((x >> 2) & 1)];
    }),
    { solid: SOLID, effect: MONEY, eamt: -10, touch: 'door:open' },
  );
  s.add('door:open', deepWater(88));
  s.add(
    'field:on',
    tex((x, y) => ((x + y * 3) % 5 === 0 ? WHITE : (x * 7 + y) % 3 ? R('glow')[3] : R('glow')[4])),
    { solid: SOLID, chHitPt: -3, next: 'field:off', ntime: 24 },
  );
  s.add(
    'field:off',
    deepWater(89).map((x, y, c) => (y % 6 === 0 && x % 4 === 0 ? R('glow')[0] : c)),
    { next: 'field:on', ntime: 30 },
  );
  for (let k = 0; k < 4; k++)
    s.add(
      `nest:${k}`,
      over(
        reefRock(90 + k),
        k === 0
          ? clam(true)
          : k === 1
            ? coral(95, 2)
            : k === 2
              ? (() => {
                  const p = sprite();
                  for (const [x, y] of [
                    [6, 14],
                    [14, 14],
                    [10, 9],
                  ])
                    shade(p, new Mask().ellipse(x, y, 3.5, 3.5), R('hideD'));
                  return outline(p, OUTLINE);
                })()
              : (() => {
                  const p = sprite();
                  fill(p, new Mask().ellipse(10, 10, 5, 5), OUTLINE);
                  p.set(10, 10, R('eye')[3]);
                  return p;
                })(),
      ),
      { solid: SOLID },
    );
  // the uplink buoy (on the surface) and the dock where Max splashes down
  s.add('uplink', buoy(0), { next: 'uplink2', ntime: 8 });
  s.add('uplink2', buoy(1), { next: 'uplink', ntime: 8 });
  s.add(
    'raft',
    tex((x, y) => (y < 12 ? airBg().get(x, y) : y < 16 ? R('stem')[2 + ((x >> 2) & 1)] : surfaceWave(0).get(x, y))),
    { solid: TOP },
  );
  s.add('island', sandTex(97, true, airBg()), { solid: SOLID });
  s.add(
    'palm',
    over(
      airBg(),
      (() => {
        const p = sprite();
        p.line(10, 19, 11, 6, R('stem')[2]).line(11, 19, 12, 6, R('stem')[3]);
        for (let a = 0; a < 5; a++) p.line(11, 6, 11 + Math.cos(-0.2 - a * 0.68) * 9, 6 + Math.sin(-0.2 - a * 0.68) * 5 + 4, R('plant')[3 + (a % 2)]);
        return outline(p, OUTLINE);
      })(),
    ),
    { grav: G.down },
  );
  // pickups in water
  for (const id of PICKUPS) s.add(`p:${id}`, over(water(5, 99), drawPickup(id)), { ...PICKUP_FX[id], touch: 'water:5' });
  s.add('pearl', over(water(6, 100), clam(true)), { scorePts: 500, touch: 'clam' });
  s.add('shrine', shrine(true));
  for (let i = 0; i < 10; i++)
    s.add(`shard:${i}`, over(shrine(false), drawShard(i)), { effect: SHARD_COUNTER + i, eamt: 1, scorePts: 5000, touch: 'shrine' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(shrine(false), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'shrine' }, ITEM_BASE + i);
  return s;
}

export { CLEAR };
