// Shelf wear for the retail boxes: a year or two in a store and on a bedroom shelf leaves
// the corners scuffed down to the white card, a crease or two where the box was squeezed,
// faded ink where the sun hit it, and a few grubby fingerprints. All of it is subtle and
// seeded by the game and face, so a box looks the same each time it is drawn.
import { seeded } from './boxFacts';

export interface WearOptions {
  /** 0..1: how much the sun has faded this face (spines facing out fade most). */
  fade?: number;
  /** How many creases to put in. */
  creases?: number;
}

/** Rubbed-off ink: white card showing through in specks and short scrapes. */
function scuff(ctx: CanvasRenderingContext2D, rnd: () => number, cx: number, cy: number, radius: number): void {
  for (let i = 0; i < radius * 3; i++) {
    const a = rnd() * Math.PI * 2;
    // most of the wear is right at the corner
    const r = radius * Math.pow(rnd(), 2.2);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    ctx.globalAlpha = 0.25 + rnd() * 0.5 * (1 - r / radius);
    ctx.fillStyle = rnd() < 0.8 ? '#efe9dc' : '#c9c1b0';
    const s = 1 + rnd() * 2.5;
    ctx.fillRect(x, y, s, s * (0.5 + rnd()));
  }
  ctx.globalAlpha = 1;
}

/** Edge wear: short pale scrapes along the folds. */
function edges(ctx: CanvasRenderingContext2D, rnd: () => number, w: number, h: number): void {
  ctx.fillStyle = '#efe9dc';
  const along = (n: number, at: (t: number) => [number, number, number, number]) => {
    for (let i = 0; i < n; i++) {
      const [x, y, ew, eh] = at(rnd());
      ctx.globalAlpha = 0.15 + rnd() * 0.35;
      ctx.fillRect(x, y, ew, eh);
    }
  };
  const n = Math.round((w + h) / 40);
  along(n, (t) => [t * w, 0, 3 + rnd() * 14, 1 + rnd() * 1.5]);
  along(n, (t) => [t * w, h - 2, 3 + rnd() * 14, 1 + rnd() * 1.5]);
  along(n, (t) => [0, t * h, 1 + rnd() * 1.5, 3 + rnd() * 14]);
  along(n, (t) => [w - 2, t * h, 1 + rnd() * 1.5, 3 + rnd() * 14]);
  ctx.globalAlpha = 1;
}

/** A crease: a crack of pale card with a shadow beside it, running in from an edge. */
function crease(ctx: CanvasRenderingContext2D, rnd: () => number, w: number, h: number): void {
  // from a point on an edge near a corner, angling in
  const edge = Math.floor(rnd() * 4);
  const t = rnd() < 0.5 ? rnd() * 0.25 : 1 - rnd() * 0.25;
  const len = Math.min(w, h) * (0.12 + rnd() * 0.22);
  const [x0, y0, inward] = [
    [t * w, 0, Math.PI / 2],
    [t * w, h, -Math.PI / 2],
    [0, t * h, 0],
    [w, t * h, Math.PI],
  ][edge];
  const ang = inward + (rnd() - 0.5) * 1.4;
  const pts: [number, number][] = [[x0, y0]];
  let [x, y] = [x0, y0];
  for (let i = 0; i < 6; i++) {
    const a = ang + (rnd() - 0.5) * 0.25;
    x += (Math.cos(a) * len) / 6;
    y += (Math.sin(a) * len) / 6;
    pts.push([x, y]);
  }
  const line = (dx: number, dy: number, style: string, alpha: number, width: number) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + dx, py + dy) : ctx.moveTo(px + dx, py + dy)));
    ctx.strokeStyle = style;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  line(1.2, 1.2, '#000', 0.28, 1.5);
  line(0, 0, '#fff', 0.35, 1);
  ctx.globalAlpha = 1;
}

/** Faded ink and a little grime; then the scuffs and creases. */
export function wear(ctx: CanvasRenderingContext2D, w: number, h: number, seed: string, opts: WearOptions = {}): void {
  const rnd = seeded(seed);
  ctx.save();
  // sun fade: washes the colors toward the card, more toward the top
  const fade = opts.fade ?? 0.08;
  const g = ctx.createLinearGradient(0, 0, w * 0.2, h);
  g.addColorStop(0, `rgba(236, 226, 205, ${fade * 1.5})`);
  g.addColorStop(1, `rgba(236, 226, 205, ${fade * 0.5})`);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  // fingerprints and shelf dust
  for (let i = 0; i < 3; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 20 + rnd() * 50;
    const s = ctx.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, 'rgba(60, 45, 25, 0.07)');
    s.addColorStop(1, 'rgba(60, 45, 25, 0)');
    ctx.fillStyle = s;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  edges(ctx, rnd, w, h);
  const corner = Math.min(w, h) * 0.09 + 6;
  scuff(ctx, rnd, 0, 0, corner * (0.6 + rnd() * 0.6));
  scuff(ctx, rnd, w, 0, corner * (0.6 + rnd() * 0.6));
  scuff(ctx, rnd, 0, h, corner * (0.6 + rnd() * 0.8));
  scuff(ctx, rnd, w, h, corner * (0.6 + rnd() * 0.8));
  for (let i = 0; i < (opts.creases ?? 1); i++) crease(ctx, rnd, w, h);
  ctx.restore();
}
