// The pictures of STATION.BBL: wall panels and windows onto space, deck plates, grates and
// girders, pipes, consoles, laser grids, arrows, conveyors, the training deck's info panels,
// airlocks, the reactor, crates and shrines.
import { Pixels, dither, rng } from '../../../kit/pixels';
import { Mask, fill, outline, pick, shade, tileNoise } from '../art/draw';
import { tex } from './blockset';
import { drawPickup, drawShard } from './items';
import { OUTLINE, S, WHITE } from '../art/palette';
import { R } from './common';

export const panel = (seed: number, kind = 0) => {
  const t = R('cave'); // station themes color "cave" as the back wall
  const n = tileNoise(seed, 20, 2);
  return tex((x, y) => {
    if (x === 0 || y === 0) return t[0];
    if (x === 19 || y === 19) return t[3];
    if (kind === 1 && y > 6 && y < 13) return (x + y) % 2 ? t[1] : t[2];
    if (kind === 2 && (x === 10 || y === 10)) return t[0];
    if (kind === 3 && (x - 10) ** 2 + (y - 10) ** 2 < 10) return R('glow')[1];
    return dither(x, y, n(x, y) * 0.5) ? t[2] : t[1];
  });
};

export function windowView(seed: number): Pixels {
  const r = rng(seed);
  const sky = R('sky');
  const t = R('tech');
  const p = tex((x, y) => {
    if (x < 2 || y < 2 || x > 17 || y > 17) return x === 0 || y === 0 ? t[1] : t[3];
    return sky[y > 12 ? 1 : 0];
  });
  for (let i = 0; i < 6; i++) p.set(3 + r() * 14, 3 + r() * 14, R('star')[Math.floor(r() * 4)]);
  if (seed % 3 === 0) shade(p, new Mask().ellipse(14, 13, 4, 4).rect(0, 18, 20, 2, false), R('hideB'));
  return p;
}

export function deck(seed: number, kind: 'plate' | 'grate' | 'girder'): Pixels {
  const t = R('tech');
  const n = tileNoise(seed, 20, 3);
  return tex((x, y) => {
    if (kind === 'girder') {
      if (y < 3 || y > 16) return y === 0 ? t[6] : t[4];
      const d = (x + y) % 14;
      const e = (x - y + 28) % 14;
      return d < 2 || e < 2 ? t[3] : R('cave')[1];
    }
    if (y === 0) return t[6];
    if (y === 1) return t[5];
    if (kind === 'grate') return x % 4 === 0 || y % 4 === 0 ? t[2] : R('cave')[0];
    if ((x === 3 || x === 16) && (y === 4 || y === 15)) return t[6];
    return pick(t.slice(2, 5), n(x, y));
  });
}

export function wall(seed: number, kind: number): Pixels {
  const t = R('soil'); // station themes: "soil" is the hull plating
  const n = tileNoise(seed, 20, 2);
  return tex((x, y) => {
    if (x === 0 || y === 0) return t[5];
    if (x === 19 || y === 19) return t[0];
    if (kind === 1 && y % 6 === 3) return t[1];
    if (kind === 2 && x > 5 && x < 14 && y > 5 && y < 14) return (x + y) % 2 ? R('hazard')[2] : OUTLINE;
    return pick(t.slice(2, 5), n(x, y));
  });
}

export function pipe(vertical: boolean, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const m = vertical ? new Mask().rect(7, 0, 6, 20) : new Mask().rect(0, 7, 20, 6);
  shade(p, m, R('stem'), { light: vertical ? [-1, 0] : [0, -1] });
  if (vertical) p.rect(6, 8, 8, 2, R('stem')[0]);
  else p.rect(8, 6, 2, 8, R('stem')[0]);
  return p;
}

export function console_(seed: number, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const r = rng(seed);
  shade(p, new Mask().rect(2, 6, 16, 14), R('tech').slice(1, 6), { light: [-1, -1] });
  p.rect(4, 8, 12, 5, OUTLINE);
  for (let i = 0; i < 8; i++) p.set(5 + r() * 10, 9 + r() * 3, R('glow')[2 + Math.floor(r() * 3)]);
  for (let x = 4; x < 16; x += 3) p.set(x, 16, [S('heart', 3), S('cash', 3), S('gold', 3)][x % 3]);
  return outline(p, OUTLINE);
}

export function laser(on: boolean, vertical: boolean, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const h = R('hazard');
  if (on)
    for (let i = 0; i < 20; i++) {
      const w = i % 3 === 0 ? 2 : 1;
      if (vertical) p.rect(9, i, w + 1, 1, h[3]).set(10, i, WHITE);
      else p.rect(i, 9, 1, w + 1, h[3]).set(i, 10, WHITE);
    }
  else
    for (let i = 0; i < 20; i += 4) {
      if (vertical) p.set(10, i, h[0]);
      else p.set(i, 10, h[0]);
    }
  return p;
}

export function arrowsOn(dir: 'up' | 'r' | 'l', frame: number, bg: Pixels, ramp = 'glow'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const g = R(ramp);
  for (let k = 0; k < 2; k++) {
    const o = (k * 10 + frame * 5) % 20;
    for (let i = -4; i <= 4; i++) {
      const [x, y] = dir === 'up' ? [10 + i, o + Math.abs(i)] : dir === 'r' ? [19 - o - Math.abs(i), 10 + i] : [o + Math.abs(i), 10 + i];
      p.set(x, y, g[3]);
    }
  }
  return p;
}

export function conveyor(dir: 'r' | 'l', frame: number): Pixels {
  const t = R('tech');
  return tex((x, y) => {
    if (y < 10) return panel(7).get(x, y);
    if (y === 10 || y === 19) return t[1];
    const s = dir === 'r' ? x - frame * 4 : x + frame * 4;
    return ((s % 8) + 8) % 8 < 4 ? (y === 11 ? t[6] : t[3]) : y === 11 ? t[4] : t[2];
  });
}

/** Info panels for the training deck: a key cap and a pictogram. */
export function infoPanel(kind: string): Pixels {
  const p = panel(50 + kind.length, 0);
  const t = R('tech');
  shade(p, new Mask().rect(1, 1, 18, 18), [t[0], t[1], t[1], t[2]]);
  const key = (x: number, y: number, w: number, glyph: string[]) => {
    p.rect(x, y, w, 7, t[5])
      .rect(x, y + 6, w, 1, t[2])
      .rect(x, y, w, 1, WHITE);
    glyph.forEach((row, gy) => [...row].forEach((ch, gx) => ch === '#' && p.set(x + 1 + gx, y + 1 + gy, OUTLINE)));
  };
  const g = R('glow')[4];
  switch (kind) {
    case 'walk':
      key(
        2,
        11,
        7,
        ['..#..', '.##..', '#####', '.##..', '..#..'].map((r) => r.slice(0, 5)),
      );
      key(11, 11, 7, ['..#..', '..##.', '#####', '..##.', '..#..']);
      p.line(4, 6, 15, 6, g).line(13, 4, 15, 6, g).line(13, 8, 15, 6, g);
      break;
    case 'hop':
      key(6, 12, 7, ['..#..', '.###.', '#####', '..#..', '..#..']);
      p.line(10, 9, 10, 2, g).line(8, 4, 10, 2, g).line(12, 4, 10, 2, g);
      break;
    case 'fire':
      key(2, 12, 16, ['..............', '.############.', '..............']);
      p.line(4, 6, 16, 6, S('laser', 3)).line(14, 4, 16, 6, S('laser', 3)).line(14, 8, 16, 6, S('laser', 3));
      break;
    case 'pick':
      key(6, 11, 7, ['###..', '#..#.', '###..', '#....', '#....']);
      p.blit(
        drawPickup('gem')
          .crop(4, 3, 12, 14)
          .map((_x, _y, c) => c),
        4,
        -3,
        255,
      );
      break;
    case 'help':
      key(4, 11, 12, ['#####.#....', '#.....#....', '####..#....', '#.....#....', '#.....#....']);
      p.set(10, 4, g).set(9, 3, g).set(11, 3, g).set(11, 5, g).set(10, 7, g);
      break;
    case 'shard':
      p.blit(drawShard(0).crop(4, 0, 12, 20), 4, 0, 255);
      break;
    case 'credit':
      p.blit(drawPickup('credit').crop(3, 2, 14, 16), 3, 2, 255);
      break;
    case 'down':
      key(6, 12, 7, ['..#..', '..#..', '#####', '.###.', '..#..']);
      fill(p, new Mask().ellipse(10, 6, 4, 4), S('suit', 3));
      break;
  }
  return p;
}

export function airlock(frame: number): Pixels {
  const t = R('tech');
  const g = R('glow');
  return tex((x, y) => {
    if (x < 2 || x > 17) return t[(y % 4 === 0 ? 1 : 4) as number];
    if (y < 2) return t[5];
    const stripe = (x + y + frame * 3) % 8 < 4;
    if (y > 16) return stripe ? R('hazard')[3] : OUTLINE;
    if (Math.abs(x - 10) < 1) return t[0];
    return frame && (x === 5 || x === 14) && y < 6 ? g[4] : stripe ? t[3] : t[2];
  });
}

export function reactor(part: number): Pixels {
  const g = R('glow');
  const t = R('tech');
  return tex((x, y) => {
    const cx = part % 2 ? -0.5 : 19.5;
    const cy = part < 2 ? 19.5 : -0.5;
    const d = Math.hypot(x - cx, y - cy);
    if (d < 7) return d < 4 ? WHITE : g[4];
    if (d < 12) return g[2 + (Math.floor(d) % 2)];
    if (d < 15) return t[2 + (Math.floor(Math.atan2(y - cy, x - cx) * 6) & 1) * 2];
    return panel(60 + part).get(x, y);
  });
}

export function crate(seed: number): Pixels {
  const c = R('stem');
  return tex((x, y) => {
    if (x === 0 || y === 0 || x === 19 || y === 19) return c[0];
    if (x === y || x === 19 - y) return c[1];
    if (x < 3 || y < 3 || x > 16 || y > 16) return c[3];
    return c[2 + ((x * 3 + y + seed) % 7 === 0 ? 1 : 0)];
  });
}

export function shrine(empty: boolean): Pixels {
  const p = panel(70, 3);
  const arch = new Mask().rect(1, 2, 18, 18).minus(new Mask().ellipse(10, 11, 6.5, 8).rect(4, 11, 12, 8));
  shade(p, arch, R('ruin').slice(1));
  shade(p, new Mask().rect(4, 17, 12, 3), R('tech').slice(2));
  if (empty) p.set(10, 12, R('glow')[1]);
  return outline(p, OUTLINE);
}
