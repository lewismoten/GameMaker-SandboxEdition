// SURFACE.BBL: the block set of every walkable planet. Drawn entirely in role colors, so
// each planet's palette turns it into grassland, dunes, glaciers, basalt and lava...
// Air near the ground is the uniform "horizon" color so decorations can sit anywhere on
// it; the sky above fades through eight bands to starry space.
import { Pixels, rng, dither } from '../kit/pixels';
import { CLEAR, Mask, fbm, fill, outline, pick, shade, sprite, tileNoise } from './art';
import { G, SOLID, TOP, SetBuilder, over, tex } from './blockset';
import { ITEM_BASE, MONEY, SEQ, SHARD_BASE, SHARD_COUNTER } from './common';
import { PICKUPS, drawModule, drawPickup, drawShard, type PickupId } from './items';
import { OUTLINE, WHITE, roleIndex } from './palette';
import { ROLES } from './roles';

export const RI = roleIndex(ROLES);
export const R = (name: string) => {
  const r = RI.get(name);
  if (!r) throw new Error(`no role ${name}`);
  return r;
};

/** Pickup effects, shared by every planet set. */
export const PICKUP_FX: Record<PickupId, { effect?: number; eamt?: number; scorePts?: number; chHitPt?: number }> = {
  credit: { effect: MONEY, eamt: 5, scorePts: 10 },
  gem: { scorePts: 250 },
  heart: { chHitPt: 25 },
  oneup: { effect: 1, eamt: 1, scorePts: 100 },
  plasma: { effect: SEQ.plasma, eamt: 10 },
  nova: { effect: SEQ.nova, eamt: 2 },
  shield: { effect: SEQ.shield, eamt: 2 },
  mines: { effect: SEQ.mine, eamt: 4 },
  medkit: { effect: SEQ.medkit, eamt: 1 },
  flak: { effect: SEQ.flak, eamt: 8 },
};

// ------------------------------------------------------------------ backgrounds

export const horizon = (seed = 1) => {
  const sky = R('sky');
  return tex((x, y) => (dither(x, y, 0.15 + ((seed * 7) % 3) * 0.02) ? sky[sky.length - 1] : sky[sky.length - 2]));
};

export const caveWall = (seed: number) => {
  const c = R('cave');
  const n = fbm(seed);
  return tex((x, y) => {
    const v = n(x, y);
    const crack = Math.abs(tileNoise(seed + 9, 20, 3)(x, y) - 0.5) < 0.03;
    return crack ? c[0] : pick(c.slice(0, 4), v);
  });
};

/** Sky band k (0 = top, starry .. 7 = just above the horizon color). */
function skyBand(k: number, stars: number): Pixels {
  const sky = R('sky');
  const star = R('star');
  const r = rng(100 + k * 7 + stars * 31);
  const p = tex((x, y) => {
    const t = (k * 20 + y) / 160; // 0..1 over eight bands
    const f = t * (sky.length - 1.01);
    const i = Math.floor(f);
    return dither(x, y, f - i) ? sky[Math.min(sky.length - 1, i + 1)] : sky[i];
  });
  for (let s = 0; s < stars; s++) {
    const x = Math.floor(r() * 20);
    const y = Math.floor(r() * 20);
    p.set(x, y, star[Math.floor(r() * 3) + (s === 0 ? 1 : 0)]);
    if (s === 0 && stars > 3)
      p.set(x + 1, y, star[1])
        .set(x - 1, y, star[1])
        .set(x, y + 1, star[1])
        .set(x, y - 1, star[1])
        .set(x, y, star[3]);
  }
  return p;
}

// ------------------------------------------------------------------ terrain

function soilTex(seed: number, role = 'soil', pebbles = 3): Pixels {
  const c = R(role);
  const n = fbm(seed);
  const r = rng(seed);
  const p = tex((x, y) => pick(c.slice(1, 6), n(x, y) * 0.9 + 0.05));
  for (let i = 0; i < pebbles; i++) {
    const x = Math.floor(r() * 18) + 1;
    const y = Math.floor(r() * 18) + 1;
    p.set(x, y, c[6] ?? c[5])
      .set(x + 1, y, c[4])
      .set(x, y + 1, c[1])
      .set(x + 1, y + 1, c[0]);
  }
  return p;
}

function rockTex(seed: number, role = 'rock'): Pixels {
  const c = R(role);
  const n = tileNoise(seed, 20, 3);
  const n2 = tileNoise(seed + 5, 20, 8);
  return tex((x, y) => {
    // blocky stones with dark mortar lines
    const v = n(x, y);
    const edge = Math.abs(v - 0.5) < 0.035 || Math.abs(v - 0.25) < 0.03 || Math.abs(v - 0.75) < 0.03;
    if (edge) return c[0];
    const lit = n(x - 1, y - 1) > v ? 1 : 0;
    return pick(c.slice(1, c.length - 1), v * 0.6 + n2(x, y) * 0.3 + lit * 0.12);
  });
}

/** Ground with a grassy (snowy, sandy...) crust; the air above shows the horizon. */
function topTex(seed: number, kind: 'mid' | 'left' | 'right' | 'cave'): Pixels {
  const top = R('top');
  const plant = R('plant');
  const r = rng(seed);
  const base = soilTex(seed + 3);
  const bg = kind === 'cave' ? caveWall(seed) : horizon(seed);
  const heights = Array.from({ length: 20 }, (_, x) => 4 + Math.round(Math.sin(x * 1.3 + seed) * 1.2 + r() * 1.5));
  return tex((x, y) => {
    let h = heights[x];
    if (kind === 'left') h += Math.max(0, 6 - x) ** 1.4 * 0.9;
    if (kind === 'right') h += Math.max(0, x - 13) ** 1.4 * 0.9;
    if (y < h - 3) return bg.get(x, y);
    if (y < h) return (x + y + seed) % 3 === 0 ? plant[5] : y === h - 3 ? top[5] : top[4];
    if (y < h + 3) return y === h ? top[3] : top[2];
    if (y === h + 3) return dither(x, y, 0.5) ? top[1] : base.get(x, y);
    if ((kind === 'left' && x === 0) || (kind === 'right' && x === 19)) return R('soil')[0];
    return base.get(x, y);
  });
}

// ------------------------------------------------------------------ decorations (sprites)

function tree(part: 'tl' | 'tr' | 'bl' | 'br' | 'trunk' | 'root'): Pixels {
  // a 2x3 block tree drawn on a 40x60 canvas and cut up
  const c = new Pixels(40, 60, CLEAR);
  const plant = R('plant');
  const stem = R('stem');
  const bloom = R('bloom');
  const trunk = new Mask(40, 60).rect(17, 28, 6, 32).poly([
    [14, 60],
    [26, 60],
    [23, 52],
    [17, 52],
  ]);
  shade(c, trunk, stem.slice(0, 5));
  const crown = new Mask(40, 60);
  const r = rng(77);
  for (let i = 0; i < 14; i++) crown.ellipse(20 + (r() - 0.5) * 22, 18 + (r() - 0.5) * 18, 7 + r() * 4, 6 + r() * 3);
  shade(c, crown, plant.slice(0, 7), { dither: true, seed: 4 });
  for (let i = 0; i < 7; i++) {
    const x = 6 + r() * 28;
    const y = 6 + r() * 24;
    if (crown.get(Math.round(x), Math.round(y))) c.set(x, y, bloom[3]).set(x + 1, y, bloom[4]);
  }
  outline(c, OUTLINE);
  const at = { tl: [0, 0], tr: [20, 0], bl: [0, 20], br: [20, 20], trunk: [10, 40], root: [10, 40] }[part];
  if (part === 'trunk') return c.crop(10, 20 + 10, 20, 20);
  return c.crop(at[0], at[1], 20, 20);
}

function bush(seed: number, flowers: boolean): Pixels {
  const p = sprite();
  const r = rng(seed);
  const m = new Mask();
  for (let i = 0; i < 6; i++) m.ellipse(4 + r() * 12, 13 + r() * 4, 3 + r() * 2.5, 3 + r() * 2);
  m.rect(0, 19, 20, 1, false);
  shade(p, m, R('plant').slice(1, 7), { dither: true, seed });
  if (flowers)
    for (let i = 0; i < 5; i++) {
      const x = 3 + r() * 14;
      const y = 10 + r() * 6;
      if (m.get(Math.round(x), Math.round(y))) p.set(x, y, R('bloom')[4]).set(x, y + 1, R('bloom')[2]);
    }
  return outline(p, OUTLINE);
}

function grassTuft(seed: number): Pixels {
  const p = sprite();
  const r = rng(seed);
  const plant = R('plant');
  for (let i = 0; i < 9; i++) {
    const x = 2 + r() * 16;
    const h = 5 + r() * 9;
    const lean = (r() - 0.5) * 5;
    p.line(x, 19, x + lean, 19 - h, plant[2 + Math.floor(r() * 5)]);
  }
  return p;
}

function boulder(seed: number): Pixels {
  const p = sprite();
  const m = new Mask().ellipse(10, 14, 8, 6).ellipse(7, 12, 4, 4);
  m.rect(0, 20, 20, 1, false);
  shade(p, m, R('rock').slice(0, 7), { dither: true, seed });
  return outline(p, OUTLINE);
}

function crystals(seed: number, role = 'crystal'): Pixels {
  const p = sprite();
  const r = rng(seed);
  for (let i = 0; i < 4; i++) {
    const x = 3 + i * 4 + r() * 2;
    const h = 7 + r() * 9;
    const w = 2 + r() * 1.5;
    const m = new Mask().poly([
      [x - w, 20],
      [x + w, 20],
      [x + w * 0.6, 20 - h],
      [x, 20 - h - 3],
      [x - w * 0.6, 20 - h],
    ]);
    shade(p, m, R(role), { light: [-1, 0] });
  }
  return outline(p, OUTLINE);
}

function mushroom(seed: number, glow: boolean): Pixels {
  const p = sprite();
  const r = rng(seed);
  const cap = R(glow ? 'glow' : 'bloom');
  for (let i = 0; i < 2; i++) {
    const x = 6 + i * 8 + r() * 2;
    const h = 6 + r() * 6;
    shade(p, new Mask().rect(Math.round(x - 1), Math.round(20 - h), 3, Math.round(h)), R('stem').slice(2));
    shade(p, new Mask().ellipse(x + 0.5, 20 - h, 4 + r() * 2, 2.5 + r()), cap);
  }
  return outline(p, OUTLINE);
}

function pillar(part: 'top' | 'mid' | 'base'): Pixels {
  const p = sprite();
  const ruin = R('ruin');
  const m = new Mask().rect(5, 0, 10, 20);
  if (part === 'top') m.rect(2, 0, 16, 5).rect(5, 0, 10, 20);
  if (part === 'base') m.rect(3, 15, 14, 5);
  if (part === 'top') m.rect(0, 0, 20, 1, false);
  shade(p, m, ruin.slice(1, 7), { light: [-1, 0] });
  for (let y = part === 'top' ? 6 : 0; y < 20; y += 5) p.line(7, y, 7, y + 3, ruin[1]).line(12, y + 2, 12, y + 4, ruin[1]);
  if (part === 'top') p.rect(2, 4, 16, 1, ruin[0]);
  return outline(p, OUTLINE);
}

function beacon(frame: number): Pixels {
  // the uplink pad: a tall antenna with a pulsing light (the way back to orbit)
  const p = sprite();
  const tech = R('tech');
  const glow = R('glow');
  shade(p, new Mask().rect(9, 4, 2, 13), tech.slice(2));
  shade(p, new Mask().rect(4, 16, 12, 4), tech.slice(1, 6));
  p.rect(5, 17, 10, 1, glow[frame ? 4 : 2]);
  const l = new Mask().ellipse(10, 4, 2.5 + frame, 2.5 + frame);
  fill(p, l, glow[frame ? 4 : 3]);
  p.set(10, 3, WHITE);
  if (frame) for (let a = 0; a < 6; a++) p.set(10 + Math.round(Math.cos(a) * 6), 4 + Math.round(Math.sin(a) * 6), glow[2]);
  return outline(p, OUTLINE);
}

function arrows(dir: 'up' | 'right' | 'left' | 'down', frame: number, bg: Pixels): Pixels {
  // a translucent stream: chevrons drifting along the current
  const g = R('glow');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  for (let k = 0; k < 3; k++) {
    const o = (k * 7 + frame * 3) % 20;
    for (let i = -3; i <= 3; i++) {
      const [x, y] =
        dir === 'up'
          ? [10 + i, o + Math.abs(i)]
          : dir === 'down'
            ? [10 + i, 19 - o - Math.abs(i)]
            : dir === 'right'
              ? [19 - o - Math.abs(i), 10 + i]
              : [o + Math.abs(i), 10 + i];
      p.set(x, y, g[2 + (k % 3)]);
    }
  }
  for (let i = 0; i < 20; i += 4) {
    const y = (i + frame * 5) % 20;
    if (dir === 'up' || dir === 'down') p.set(3, y, g[1]).set(16, (y + 9) % 20, g[1]);
    else p.set(y, 3, g[1]).set((y + 9) % 20, 16, g[1]);
  }
  return p;
}

function spikes(bg: Pixels, down = false): Pixels {
  const h = R('hazard');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const m = new Mask();
  for (let i = 0; i < 4; i++)
    m.poly(
      down
        ? [
            [i * 5, 0],
            [i * 5 + 5, 0],
            [i * 5 + 2.5, 14],
          ]
        : [
            [i * 5, 20],
            [i * 5 + 5, 20],
            [i * 5 + 2.5, 6],
          ],
    );
  shade(p, m, h, { light: [-1, 0] });
  if (!down) p.rect(0, 18, 20, 2, R('rock')[1]);
  else p.rect(0, 0, 20, 2, R('rock')[1]);
  return p;
}

function liquidTex(frame: number, surface: boolean): Pixels {
  const l = R('liquid');
  const n = tileNoise(40 + frame, 20, 4);
  const bg = horizon();
  return tex((x, y) => {
    const wave = surface ? 5 + Math.round(Math.sin((x + frame * 5) * 0.63) * 1.5) : -10;
    if (y < wave) return bg.get(x, y);
    if (y === wave) return l[6];
    if (y === wave + 1) return l[5];
    const v = n(x, y + frame * 3);
    return pick(l.slice(1, 5), v * 0.8 + (surface ? 0.2 * (1 - y / 20) : 0));
  });
}

function forceField(on: boolean, frame = 0): Pixels {
  const g = R('glow');
  const t = R('tech');
  const bg = caveWall(3);
  return tex((x, y) => {
    if (x < 3 || x > 16) return x < 2 || x > 17 ? bg.get(x, y) : t[(y + (x < 3 ? 0 : 2)) % 4 === 0 ? 1 : 3];
    if (!on) return (y + frame) % 6 === 0 && x % 4 === 0 ? g[0] : bg.get(x, y);
    return (x + y * 3 + frame * 2) % 5 === 0 ? WHITE : (x * 7 + y) % 3 ? g[3] : g[4];
  });
}

function timedPlatform(on: boolean): Pixels {
  const t = R('tech');
  const g = R('glow');
  const bg = horizon();
  return tex((x, y) => {
    if (y > 7) return bg.get(x, y);
    if (!on) return y === 3 && x % 3 === 0 ? g[1] : bg.get(x, y);
    if (y === 0) return t[6];
    if (y === 7) return t[0];
    if (y === 3) return x % 5 === 2 ? g[4] : g[2];
    return t[2 + ((x + y) % 3)];
  });
}

function door(open: boolean): Pixels {
  const t = R('tech');
  const a = R('accent');
  const bg = caveWall(9);
  return tex((x, y) => {
    if (x < 2 || x > 17) return t[1];
    if (open) return x === 2 || x === 17 ? t[0] : bg.get(x, y);
    if (y > 7 && y < 12 && x > 6 && x < 13) return x === 9 || x === 10 ? t[0] : a[4]; // the credit slot
    return (y % 5 === 0 ? t[1] : t[3 + ((x >> 2) & 1)]) as number;
  });
}

function nest(kind: number): Pixels {
  // monster nests: burrows, hives, eggs, vents
  const bg = caveWall(20 + kind);
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const hide = R(['hideA', 'hideB', 'hideC', 'hideD'][kind]);
  if (kind === 0) {
    shade(p, new Mask().ellipse(10, 14, 9, 6), R('soil'));
    fill(p, new Mask().ellipse(10, 14, 5, 3), OUTLINE);
    p.set(8, 13, R('eye')[3]).set(12, 13, R('eye')[3]);
  } else if (kind === 1) {
    shade(p, new Mask().ellipse(10, 10, 8, 9), hide);
    for (let y = 4; y < 18; y += 3) p.line(4, y, 16, y, hide[0]);
    fill(p, new Mask().ellipse(10, 15, 2, 2), OUTLINE);
  } else if (kind === 2) {
    for (const [x, y] of [
      [6, 14],
      [14, 14],
      [10, 9],
    ])
      shade(p, new Mask().ellipse(x, y, 4, 5), hide);
  } else {
    shade(p, new Mask().rect(3, 6, 14, 14), R('tech'));
    for (let y = 8; y < 18; y += 3) p.line(5, y, 15, y, OUTLINE);
    p.set(10, 4, R('glow')[4]);
  }
  return outline(p, OUTLINE);
}

function shrine(empty: boolean): Pixels {
  const ruin = R('ruin');
  const bg = caveWall(31);
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const arch = new Mask().rect(1, 2, 18, 18).minus(new Mask().ellipse(10, 11, 6.5, 8).rect(4, 11, 12, 8));
  shade(p, arch, ruin.slice(1));
  shade(p, new Mask().rect(4, 17, 12, 3), ruin.slice(2));
  if (empty) p.set(10, 12, R('glow')[1]);
  return outline(p, OUTLINE);
}

function sign(dir: 'right' | 'left' | 'up'): Pixels {
  const p = sprite();
  shade(p, new Mask().rect(9, 8, 2, 12), R('stem').slice(1));
  shade(p, new Mask().rect(3, 3, 14, 7), R('ruin').slice(2));
  const a = R('accent')[4];
  if (dir === 'up') p.line(10, 4, 10, 8, a).line(8, 6, 10, 4, a).line(12, 6, 10, 4, a);
  else {
    const s = dir === 'right' ? 1 : -1;
    p.line(5, 6, 15, 6, a)
      .line(10 + 3 * s, 4, 10 + 5 * s, 6, a)
      .line(10 + 3 * s, 8, 10 + 5 * s, 6, a);
  }
  return outline(p, OUTLINE);
}

function waterfall(frame: number): Pixels {
  const l = R('liquid');
  const bg = caveWall(41);
  return tex((x, y) => {
    if (x < 5 || x > 14) return bg.get(x, y);
    const v = (y + frame * 7 + (x % 3) * 5) % 9;
    return v < 2 ? l[6] : v < 5 ? l[4] : l[3];
  });
}

function stalactite(up: boolean, seed: number): Pixels {
  const p = sprite();
  const r = rng(seed);
  const m = new Mask();
  for (let i = 0; i < 3; i++) {
    const x = 3 + i * 6 + r() * 3;
    const h = 8 + r() * 10;
    const w = 2 + r() * 1.5;
    m.poly(
      up
        ? [
            [x - w, 20],
            [x + w, 20],
            [x, 20 - h],
          ]
        : [
            [x - w, 0],
            [x + w, 0],
            [x, h],
          ],
    );
  }
  shade(p, m, R('rock').slice(1, 7), { light: [-1, 0] });
  return outline(p, OUTLINE);
}

function bones(seed: number): Pixels {
  const p = rockTex(seed);
  const b = R('ruin');
  const r = rng(seed);
  const x = 4 + r() * 8;
  const y = 6 + r() * 6;
  p.line(x, y, x + 8, y + 3, b[6]).line(x, y + 1, x + 8, y + 4, b[4]);
  shade(p, new Mask().ellipse(x, y, 2, 2).ellipse(x + 8, y + 3.5, 2, 2), b.slice(3));
  shade(p, new Mask().ellipse(x + 3, y + 8, 3.5, 2.5), b.slice(2));
  p.set(x + 2, y + 8, OUTLINE).set(x + 4, y + 8, OUTLINE);
  return p;
}

function cloud(part: 'l' | 'm' | 'r' | 'puff'): Pixels {
  const p = horizon(2);
  const cl = R('cloud');
  const m = new Mask();
  if (part === 'puff') m.ellipse(10, 11, 7, 4).ellipse(7, 9, 4, 3).ellipse(13, 9, 3, 3);
  else {
    const xs = part === 'l' ? [14, 22] : part === 'r' ? [-2, 6] : [-4, 10, 24];
    for (const x of xs) m.ellipse(x, 10, 9, 6);
    m.ellipse(part === 'l' ? 26 : part === 'r' ? -6 : 10, 6, 7, 5);
  }
  shade(p, m, cl, { light: [-1, -1] });
  return p;
}

function farHills(part: 'peak' | 'l' | 'r' | 'fill'): Pixels {
  const far = R('far');
  const bg = horizon(3);
  return tex((x, y) => {
    const h = part === 'peak' ? 4 + Math.abs(x - 10) * 1.3 : part === 'l' ? 20 - x * 0.9 : part === 'r' ? 2 + x * 0.9 : 0;
    if (part !== 'fill' && y < h) return bg.get(x, y);
    const v = (x * 3 + y * 5) % 7;
    return y - h < 2 ? far[3] : v === 0 ? far[2] : far[1];
  });
}

// ------------------------------------------------------------------ the set

/** Pickups that also come on open air (the rest only in caves and ruins). */
export const OPEN_AIR_PICKUPS: PickupId[] = ['credit', 'gem', 'heart', 'oneup'];

export function surfaceSet(): SetBuilder {
  const s = new SetBuilder('SURFACE', G.down);
  const hz = horizon();
  // air
  s.add('air', hz);
  for (let k = 0; k < 8; k++) s.add(`sky:${k}`, skyBand(k, k < 3 ? 6 - k * 2 : 0));
  s.add('ceiling', skyBand(0, 2), { solid: SOLID }); // the solid top of the sky (map rows wrap)
  for (const part of ['l', 'm', 'r', 'puff'] as const) s.add(`cloud:${part}`, cloud(part));
  for (const part of ['peak', 'l', 'r', 'fill'] as const) s.add(`far:${part}`, farHills(part));
  for (let k = 0; k < 3; k++) s.add(`cave:${k}`, caveWall(50 + k));
  s.add(
    'cave:roots',
    over(
      caveWall(55),
      (() => {
        const p = sprite();
        const r = rng(9);
        for (let i = 0; i < 4; i++) {
          let x = 3 + i * 4 + r() * 2;
          for (let y = 0; y < 12 + r() * 6; y++) {
            x += (r() - 0.5) * 1.2;
            p.set(x, y, R('stem')[1 + (y & 1)]);
          }
        }
        return p;
      })(),
    ),
  );
  s.add('cave:glint', over(caveWall(56), crystals(3).crop(0, 6, 20, 14), 0, 0));
  // solid ground
  for (let k = 0; k < 3; k++) s.add(`top:${k}`, topTex(60 + k, 'mid'), { solid: SOLID });
  s.add('top:left', topTex(64, 'left'), { solid: SOLID });
  s.add('top:right', topTex(65, 'right'), { solid: SOLID });
  s.add('top:cave', topTex(66, 'cave'), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`soil:${k}`, soilTex(70 + k), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`rock:${k}`, rockTex(80 + k), { solid: SOLID });
  for (let k = 0; k < 2; k++) s.add(`deep:${k}`, rockTex(90 + k, 'deep'), { solid: SOLID });
  s.add(
    'bedrock',
    tex((x, y) => R('deep')[(x * 7 + y * 3) % 5 === 0 ? 2 : (x + y) % 4 === 0 ? 1 : 0]),
    { solid: SOLID },
  );
  s.add('ore:0', over(rockTex(83), crystals(5).crop(0, 4, 20, 16), 0, 4), { solid: SOLID });
  s.add('ore:1', bones(84), { solid: SOLID });
  // cave ceiling and floor
  s.add('ceil:0', over(rockTex(86), stalactite(false, 1).crop(0, 0, 20, 20)), { solid: SOLID });
  s.add('stal:down', over(caveWall(57), stalactite(false, 2)));
  s.add('stal:up', over(caveWall(58), stalactite(true, 3)));
  // platforms (stand on top, jump through from below)
  const ledge = (kind: 'l' | 'm' | 'r', bgPic: Pixels) =>
    tex((x, y) => {
      const t = R('top');
      const rk = R('rock');
      const inset = kind === 'l' ? Math.max(0, 3 - x) : kind === 'r' ? Math.max(0, x - 16) : 0;
      if (y > 8 - inset || y < 0) return bgPic.get(x, y);
      if (y === 0) return t[5];
      if (y === 1) return t[3];
      return rk[((x * 5 + y * 3) % 4) + 1];
    });
  s.add('ledge:l', ledge('l', hz), { solid: TOP });
  s.add('ledge:m', ledge('m', hz), { solid: TOP });
  s.add('ledge:r', ledge('r', hz), { solid: TOP });
  s.add('ledge:cave', ledge('m', caveWall(59)), { solid: TOP });
  s.add(
    'island:under',
    tex((x, y) => {
      const rk = R('rock');
      const w = 10 - y * 0.45;
      return Math.abs(x - 9.5) < w ? rk[1 + ((x * 3 + y) % 4)] : hz.get(x, y);
    }),
    { solid: SOLID },
  );
  s.add(
    'bridge',
    tex((x, y) => {
      const st = R('stem');
      if (y < 6 || y > 10) return y > 10 && y < 14 && x % 10 === 2 ? st[0] : hz.get(x, y);
      return y === 6 ? st[4] : x % 5 === 0 ? st[0] : st[2 + (y & 1)];
    }),
    { solid: TOP },
  );
  // decorations on the horizon
  const D = (name: string, sp: Pixels, bg = hz) => s.add(name, over(bg, sp));
  D('bush:0', bush(1, false));
  D('bush:1', bush(2, true));
  D('grass:0', grassTuft(3));
  D('grass:1', grassTuft(4));
  D('boulder', boulder(5));
  D('crystals', crystals(6));
  D(
    'sapling',
    (() => {
      const p = sprite();
      p.line(10, 19, 10, 9, R('stem')[2]);
      shade(p, new Mask().ellipse(10, 8, 5, 4).ellipse(7, 10, 3, 2.5).ellipse(13, 10, 3, 2.5), R('plant').slice(1, 7));
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'cactus',
    (() => {
      const p = sprite();
      const m = new Mask().rect(8, 4, 4, 16).ellipse(10, 4, 2, 2).rect(3, 9, 2, 6).rect(3, 13, 6, 2).rect(15, 6, 2, 6).rect(11, 10, 6, 2);
      shade(p, m, R('plant').slice(1, 7), { light: [-1, 0] });
      for (let y = 6; y < 19; y += 3) p.set(9, y, R('bloom')[4]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'flowers',
    (() => {
      const p = sprite();
      const r = rng(33);
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 3 + r() * 2;
        const hh = 5 + r() * 6;
        p.line(x, 19, x, 19 - hh, R('plant')[3]);
        fill(p, new Mask().ellipse(x, 19 - hh, 1.6, 1.6), R('bloom')[2 + (i % 3)]);
        p.set(x, 19 - hh, R('accent')[4]);
      }
      return p;
    })(),
  );
  D(
    'stump',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 11, 10, 9).ellipse(10, 11, 5, 2), R('stem'));
      fill(p, new Mask().ellipse(10, 11, 3.5, 1.2), R('stem')[4]);
      p.line(3, 19, 6, 16, R('stem')[1]).line(17, 19, 14, 16, R('stem')[1]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'skulls',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(7, 15, 4, 3.5).ellipse(14, 16, 3.5, 3), R('ruin').slice(2));
      p.set(6, 14, OUTLINE).set(8, 14, OUTLINE).set(13, 15, OUTLINE).set(15, 15, OUTLINE);
      p.line(2, 19, 18, 18, R('ruin')[5]);
      return outline(p, OUTLINE);
    })(),
  );
  D('mushroom', mushroom(7, false));
  D(
    'totem',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(6, 2, 8, 18), R('ruin').slice(1), { light: [-1, 0] });
      for (const y of [5, 11, 17]) {
        p.set(8, y, R('glow')[4]).set(11, y, R('glow')[4]);
        p.line(8, y + 2, 11, y + 2, OUTLINE);
      }
      return outline(p, OUTLINE);
    })(),
  );
  D('mushroom:cave', mushroom(8, true), caveWall(60));
  D('crystals:cave', crystals(9), caveWall(61));
  for (const part of ['tl', 'tr', 'bl', 'br', 'trunk'] as const) D(`tree:${part}`, tree(part));
  D('pillar:top', pillar('top'));
  D('pillar:mid', pillar('mid'));
  D('pillar:base', pillar('base'));
  s.add(
    'ruin:wall',
    over(
      rockTex(87, 'ruin'),
      (() => {
        const p = sprite();
        p.rect(6, 6, 8, 8, R('glow')[1]).rect(8, 8, 4, 4, R('glow')[3]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  s.add('ruin:block', rockTex(88, 'ruin'), { solid: SOLID });
  D('sign:right', sign('right'));
  D('sign:left', sign('left'));
  D('sign:up', sign('up'));
  // hazards
  s.add('spikes', spikes(hz), { solid: SOLID, chHitPt: -3 });
  s.add('spikes:cave', spikes(caveWall(64)), { solid: SOLID, chHitPt: -3 });
  s.add('spikes:down', spikes(caveWall(65), true), { solid: SOLID, chHitPt: -3 });
  s.add(
    'thorns',
    over(
      hz,
      bush(10, false).map((_x, _y, c) => (c !== CLEAR && c !== OUTLINE && (_x + _y) % 3 === 0 ? R('hazard')[3] : c)),
    ),
    { chHitPt: -1 },
  );
  // liquid (hurts: acid, lava, brine...)
  s.add('liquid:top', liquidTex(0, true), { chHitPt: -2, next: 'liquid:top2', ntime: 5 });
  s.add('liquid:top2', liquidTex(1, true), { chHitPt: -2, next: 'liquid:top', ntime: 5 });
  s.add('liquid', liquidTex(0, false), { chHitPt: -2, next: 'liquid2', ntime: 6 });
  s.add('liquid2', liquidTex(1, false), { chHitPt: -2, next: 'liquid', ntime: 6 });
  s.add('fall:0', waterfall(0), { next: 'fall:1', ntime: 2 });
  s.add('fall:1', waterfall(1), { next: 'fall:2', ntime: 2 });
  s.add('fall:2', waterfall(2), { next: 'fall:0', ntime: 2 });
  // currents: lifts, winds
  s.add('lift', arrows('up', 0, hz), { grav: G.up, next: 'lift2', ntime: 2 });
  s.add('lift2', arrows('up', 1, hz), { grav: G.up, next: 'lift', ntime: 2 });
  s.add('lift:cave', arrows('up', 0, caveWall(66)), { grav: G.up, next: 'lift:cave2', ntime: 2 });
  s.add('lift:cave2', arrows('up', 1, caveWall(66)), { grav: G.up, next: 'lift:cave', ntime: 2 });
  s.add('wind:r', arrows('right', 0, hz), { grav: G.right | G.down, next: 'wind:r2', ntime: 2 });
  s.add('wind:r2', arrows('right', 1, hz), { grav: G.right | G.down, next: 'wind:r', ntime: 2 });
  s.add('wind:l', arrows('left', 0, hz), { grav: G.left | G.down, next: 'wind:l2', ntime: 2 });
  s.add('wind:l2', arrows('left', 1, hz), { grav: G.left | G.down, next: 'wind:l', ntime: 2 });
  s.add(
    'float',
    arrows('down', 0, caveWall(67)).map((x, y, c) => ((x + y) % 7 ? c : R('glow')[0])),
    { grav: G.none },
  ); // zero-g pocket
  // timed things (every copy switches together: Game-Maker animates block types)
  s.add('field:on', forceField(true, 0), { solid: SOLID, chHitPt: -3, next: 'field:on2', ntime: 12 });
  s.add('field:on2', forceField(true, 1), { solid: SOLID, chHitPt: -3, next: 'field:off', ntime: 12 });
  s.add('field:off', forceField(false), { next: 'field:on', ntime: 30 });
  s.add('plat:on', timedPlatform(true), { solid: TOP, next: 'plat:off', ntime: 45 });
  s.add('plat:off', timedPlatform(false), { next: 'plat:on', ntime: 35 });
  // touch-to-change blocks
  s.add(
    'glass',
    over(caveWall(68), crystals(11).crop(0, 0, 20, 20)).map((x, y, c) => ((x * y) % 5 === 1 ? R('crystal')[5] : c)),
    { solid: SOLID, scorePts: 50, touch: 'glass:broken' },
  );
  s.add('glass:broken', over(caveWall(69), stalactite(true, 12).crop(0, 10, 20, 10), 0, 10));
  s.add('fake', rockTex(81), {}); // looks like rock, isn't: secret passages
  s.add('door', door(false), { solid: SOLID, effect: MONEY, eamt: -10, touch: 'door:open' });
  s.add('door:open', door(true));
  for (let k = 0; k < 4; k++) s.add(`nest:${k}`, nest(k), { solid: SOLID }); // birthMon set per planet by the map code
  s.add(
    'heal',
    over(
      caveWall(70),
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 15, 8, 4), R('glow'));
        for (let i = 0; i < 5; i++) p.set(4 + i * 3, 6 + (i % 2) * 3, WHITE);
        return p;
      })(),
    ),
    { chHitPt: 1 },
  );
  // landing beacon (the uplink to orbit) and where Max lands
  s.add('uplink', over(hz, beacon(0)), { next: 'uplink2', ntime: 8 });
  s.add('uplink2', over(hz, beacon(1)), { next: 'uplink', ntime: 8 });
  s.add(
    'pad',
    tex((x, y) => {
      // a landing plate flush with the ground: lit stripe on top, soil below
      const t = R('tech');
      if (y === 0) return t[6];
      if (y < 5) return y === 2 && x % 4 === 1 ? R('glow')[4] : t[3 + (y & 1)];
      if (y === 5) return t[1];
      return soilTex(74).get(x, y);
    }),
    { solid: SOLID },
  );
  // pickups: one on open air, one in caves
  const cw = caveWall(72);
  for (const id of PICKUPS) {
    if (OPEN_AIR_PICKUPS.includes(id)) s.add(`p:${id}`, over(hz, drawPickup(id)), { ...PICKUP_FX[id], touch: 'air' });
    s.add(`pc:${id}`, over(cw, drawPickup(id)), { ...PICKUP_FX[id], touch: 'cave:0' });
  }
  s.add('shrine', shrine(true));
  // shared slots: star-shards (counters 20..29) and the ten courier modules
  for (let i = 0; i < 10; i++)
    s.add(`shard:${i}`, over(shrine(false), drawShard(i)), { effect: SHARD_COUNTER + i, eamt: 1, scorePts: 5000, touch: 'shrine' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(shrine(false), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'shrine' }, ITEM_BASE + i);
  return s;
}

export { ITEM_BASE };
