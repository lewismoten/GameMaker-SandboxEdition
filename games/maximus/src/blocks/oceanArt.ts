// The pictures of OCEAN.BBL: water by depth band (it darkens through the first three bands,
// then stays one shade so anything drawn on deep water fits at any depth), the air above,
// sand, reef rock, coral, kelp, anemones, bubble columns, currents, the uplink buoy, surface
// waves, wrecks, shrines and clams.
import { Pixels, dither, rng } from '../../../kit/pixels';
import { Mask, fbm, fill, outline, pick, shade, sprite, tileNoise } from '../art/draw';
import { tex } from './blockset';
import { OUTLINE, WHITE } from '../art/palette';
import { R } from './common';

/**
 * Water at depth band k (0 = just below the surface .. 7 = abyss). The light fades through
 * the first three bands; from band 3 down the water is one even shade, so anything drawn on
 * a deep-water background (kelp, pickups, wrecks) sits seamlessly at any depth below it.
 */
export const water = (k: number, seed = 1) => {
  const sky = R('sky'); // ocean themes color "sky" as the water column, light..dark reversed
  const r = rng(seed * 13 + k);
  const n = sky.length - 1;
  const deep = Math.round(n * 0.42);
  const p = tex((x, y) => {
    if (k >= 3) return dither(x, y, 0.25) ? sky[deep + 1] : sky[deep];
    const t = (k * 20 + y) / 60; // 0 at the surface .. 1 at the top of band 3
    const f = n - t * (n - deep);
    const i = Math.floor(f);
    return dither(x, y, f - i) ? sky[Math.min(n, i + 1)] : sky[i];
  });
  // motes drifting in the water
  for (let i = 0; i < 3; i++) p.set(r() * 20, r() * 20, sky[k >= 3 ? deep + 3 : Math.min(n, n - k * 2 + 1)]);
  return p;
};
export const deepWater = (seed: number) => water(7, seed);
export const airBg = () => {
  const c = R('cloud');
  return tex((x, y) => (dither(x, y, y / 40) ? c[2] : c[3]));
};

export function sandTex(seed: number, top: boolean, bg?: Pixels): Pixels {
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

export function reefRock(seed: number, role = 'rock'): Pixels {
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

export function coral(seed: number, kind: number): Pixels {
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

export function kelp(part: 'top' | 'mid', frame: number): Pixels {
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

export function anemone(frame: number): Pixels {
  const p = sprite();
  const h = R('hazard');
  shade(p, new Mask().ellipse(10, 17, 6, 3), R('bloom'));
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + i * 0.3;
    p.line(10, 16, 10 + Math.sin(a + frame * 0.15) * 9, 16 - Math.cos(a) * (8 + (i % 3)), h[2 + (i % 3)]);
  }
  return outline(p, OUTLINE);
}

export function bubbles(frame: number, bg: Pixels, strong: boolean): Pixels {
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

export function current(dir: 'r' | 'l' | 'd', frame: number, bg: Pixels): Pixels {
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

export function buoy(frame: number): Pixels {
  // the uplink buoy half out of the water
  const p = surfaceWave(frame);
  const t = R('tech');
  const g = R('glow');
  shade(p, new Mask().ellipse(10, 12, 5, 4).rect(8, 3, 4, 9), [...t.slice(1, 4), R('hazard')[3], R('hazard')[4]]);
  fill(p, new Mask().ellipse(10, 3, 2 + frame, 2 + frame), g[3 + frame]);
  p.set(10, 2, WHITE);
  return outline(p, OUTLINE);
}

export function surfaceWave(frame: number): Pixels {
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

export function wreck(part: number): Pixels {
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

export function shrine(empty: boolean): Pixels {
  const ruin = R('ruin');
  const p = deepWater(31);
  const arch = new Mask().rect(1, 2, 18, 18).minus(new Mask().ellipse(10, 11, 6.5, 8).rect(4, 11, 12, 8));
  shade(p, arch, ruin.slice(1));
  shade(p, new Mask().rect(4, 17, 12, 3), ruin.slice(2));
  if (empty) p.set(10, 12, R('glow')[1]);
  return outline(p, OUTLINE);
}

export function clam(open: boolean): Pixels {
  const p = sprite();
  const c = R('hideD');
  shade(p, new Mask().ellipse(10, 15, 8, 4), c);
  if (open) {
    shade(p, new Mask().ellipse(10, 9, 8, 4).rect(0, 11, 20, 9, false), c);
    fill(p, new Mask().ellipse(10, 12.5, 2.5, 2.5), WHITE);
  } else for (let x = 3; x < 18; x += 3) p.line(x, 12, x + 1, 18, c[1]);
  return outline(p, OUTLINE);
}
