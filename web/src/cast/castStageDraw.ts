// Drawing the cast page's stage, in its own pixels: the backdrop (wall, spotlight, boards and
// curtains), a frame standing on the boards with a soft light rim and a shadow, Gwinn's costume
// pieces tumbling to a stop, and Snowbound's snow. castStage.ts says who is where.
import type { CastSprite } from './castSprite';

/** The stage in its own pixels; the canvas is scaled up with smoothing off. */
export const W = 160;
export const H = 70;
export const FLOOR = 58;

/** A cast member's frames, cut from sprites.json (castStageSprites.ts). */
export interface Sprite {
  sprite: CastSprite;
  walk: HTMLCanvasElement[];
  front: HTMLCanvasElement[];
  acts: Record<string, HTMLCanvasElement[]>;
}

/** A costume piece flying out behind Gwinn, then tumbling to a stop on the boards. */
export interface Prop {
  img: HTMLCanvasElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  landed: boolean;
}

/** Snowbound's flakes: a white pixel with a pale blue one below and to the right. */
interface Flake {
  x: number;
  y: number;
  v: number;
  big: boolean;
}

export const newFlakes = (): Flake[] => Array.from({ length: 70 }, (_, i) => ({ x: (i * 37) % W, y: (i * 53) % H, v: 9 + ((i * 7) % 6), big: i % 4 === 0 }));

export function backdrop(ctx: CanvasRenderingContext2D): void {
  // the back wall, a spotlight, the boards and the curtains
  ctx.fillStyle = '#1b1430';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2a1f48';
  for (let y = 0; y < FLOOR; y += 6) ctx.fillRect(0, y, W, 1);
  const g = ctx.createRadialGradient(W / 2, FLOOR, 4, W / 2, FLOOR, 38);
  g.addColorStop(0, 'rgba(255,240,170,0.55)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#6b3d1f';
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = '#8a5229';
  for (let y = FLOOR + 1; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = '#4a2a14';
  for (let x = 7; x < W; x += 23) ctx.fillRect(x, FLOOR + 1, 1, H - FLOOR);
  ctx.fillStyle = '#ffd400';
  ctx.fillRect(0, FLOOR, W, 1);
  for (const [x0, dir] of [
    [0, 1],
    [W - 1, -1],
  ] as const) {
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 4 === 0 ? '#5c0a10' : i % 4 === 2 ? '#c3242c' : '#9b1820';
      ctx.fillRect(x0 + dir * i, 0, 1, FLOOR + 6 - (i > 9 ? (i - 9) * 2 : 0));
    }
  }
  ctx.fillStyle = '#9b1820';
  ctx.fillRect(0, 0, W, 5);
  ctx.fillStyle = '#ffd400';
  for (let x = 2; x < W; x += 6) ctx.fillRect(x, 5, 2, 1);
}

/**
 * Draws frames standing on the boards: `put(img, x, lift, left, squeeze, tilt)` puts one with its
 * bottom at the floor (`lift` above it), turned round or squeezed, and returns its top.
 */
export function stagePut(ctx: CanvasRenderingContext2D) {
  /**
   * A frame with a soft light rim round it (the stage is dark, and so are some outlines: Carl's,
   * Joe's, the camel's), made once per frame.
   */
  const rims = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  function rimmed(img: HTMLCanvasElement): HTMLCanvasElement {
    let out = rims.get(img);
    if (!out) {
      out = document.createElement('canvas');
      out.width = img.width + 2;
      out.height = img.height + 2;
      const c = out.getContext('2d')!;
      for (const [dx, dy] of [
        [0, 1],
        [2, 1],
        [1, 0],
        [1, 2],
      ])
        c.drawImage(img, dx, dy);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = 'rgba(232,226,255,0.55)';
      c.fillRect(0, 0, out.width, out.height);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(img, 1, 1);
      rims.set(img, out);
    }
    return out;
  }

  return function put(img0: HTMLCanvasElement, px: number, lift = 0, left = false, squeeze = 1, tilt = 0): number {
    const img = rimmed(img0);
    px -= 1;
    lift -= 1;
    const top = FLOOR - img.height + 1 - lift;
    const w = Math.max(1, Math.round(img.width * squeeze));
    const ox = Math.round(px + (img.width - w) / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(ox + 2, FLOOR, Math.max(1, w - 4), 2);
    ctx.save();
    // rocking on its bottom (the Easter egg)
    if (tilt) {
      ctx.translate(ox + w / 2, FLOOR);
      ctx.rotate(tilt);
      ctx.translate(-(ox + w / 2), -FLOOR);
    }
    if (left) {
      ctx.translate(ox + w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, top, w, img.height);
    } else ctx.drawImage(img, ox, top, w, img.height);
    ctx.restore();
    return top + 1;
  };
}

/** A costume piece: flying out from (px, py), or already lying there (`landed`). */
export function newProp(img: HTMLCanvasElement, px: number, py: number, landed = false): Prop {
  return { img, x: px, y: py - (landed ? img.height / 2 : 0), vx: -10, vy: -62, angle: landed ? Math.PI / 2 : 0, spin: 9 + Math.random() * 5, landed };
}

/** The pieces in the air fall, bounce (`onBounce`, slower each time) and come to rest. */
export function stepProps(props: Prop[], dt: number, onBounce: () => void): void {
  for (const p of props) {
    if (p.landed) continue;
    p.vy += 230 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.angle += p.spin * dt;
    const rest = FLOOR - Math.min(p.img.width, p.img.height) / 2 + 1;
    if (p.y >= rest) {
      p.y = rest;
      if (p.vy > 50) {
        // a bounce, slower each time
        p.vy = -p.vy * 0.38;
        p.vx *= 0.5;
        p.spin *= 0.5;
        onBounce();
      } else {
        p.landed = true;
        // it lies flat, on whichever side it came down on
        p.angle = Math.round(p.angle / (Math.PI / 2)) * (Math.PI / 2);
      }
    }
  }
}

export function drawProps(ctx: CanvasRenderingContext2D, props: Prop[], alpha: number): void {
  ctx.globalAlpha = alpha;
  for (const p of props) {
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.rotate(p.angle);
    ctx.drawImage(p.img, -Math.round(p.img.width / 2), -Math.round(p.img.height / 2));
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** The snow at strength `snow` (0 to 1). */
export function drawSnow(ctx: CanvasRenderingContext2D, flakes: Flake[], snow: number): void {
  if (snow <= 0) return;
  ctx.globalAlpha = snow;
  for (const f of flakes) {
    const fx = Math.round(f.x);
    const fy = Math.round(f.y);
    ctx.fillStyle = '#a9b8d6';
    ctx.fillRect(fx + 1, fy + 1, 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(fx, fy, f.big ? 2 : 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** The flakes fall, and come round again at the top. */
export function stepFlakes(flakes: Flake[], dt: number): void {
  for (const f of flakes) {
    f.y += f.v * dt;
    if (f.y > H) [f.y, f.x] = [-2, (f.x + 61) % W];
  }
}

/** The frames of a cast member's sprite, cut into its walk, its front and its acts. */
export function cutSprite(sprite: CastSprite, frames: HTMLCanvasElement[]): Sprite {
  const n = sprite.nWalk ?? frames.length;
  const acts = Object.fromEntries(Object.entries(sprite.acts ?? {}).map(([k, [a, c]]) => [k, frames.slice(a, a + c)]));
  const end = Math.min(frames.length, ...Object.values(sprite.acts ?? {}).map(([a]) => a));
  return { sprite, walk: frames.slice(0, n), front: n < end ? frames.slice(n, end) : frames.length === 2 ? frames : [frames[0]], acts };
}
