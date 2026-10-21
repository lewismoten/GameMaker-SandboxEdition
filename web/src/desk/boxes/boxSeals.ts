// The little printed extras that crowd a mid-90s game box: a starburst shouting the hours
// of play, a magazine award in a laurel wreath, the "1 PLAYER" icon, the disk count, the
// (made-up) Home Software Rating Council's age seal, a store's price sticker and the platform
// badge (MS-DOS, IBM PC & compatibles, 3½" disks) a shopper looks for first.
import { ratingMark } from './boxFacts';

const SANS = (px: number, weight = 700) => `${weight} ${px}px Arial, Helvetica, sans-serif`;
const CONDENSED = (px: number) => `900 ${px}px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`;

/** The biggest size (up to max) at which a line fits. */
function fitPx(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number): number {
  let px = max;
  for (; px > 6; px--) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= width) break;
  }
  return px;
}

/** A yellow starburst with red lettering, tipped a little. */
export function starburst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, lines: string[], tilt = -0.18): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.beginPath();
  const points = 18;
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.78 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#ffe14a';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d81e1e';
  ctx.stroke();
  ctx.fillStyle = '#c4121a';
  ctx.textAlign = 'center';
  // a big first line, smaller ones under it
  const sizes = lines.length > 1 ? [0.42, ...lines.slice(1).map(() => 0.27)] : [0.4];
  const total = sizes.reduce((a, b) => a + b * 1.05, 0);
  let y = -total / 2;
  lines.forEach((line, i) => {
    y += sizes[i];
    ctx.font = CONDENSED(fitPx(ctx, line, CONDENSED, r * (i ? 1.22 : 1.3), r * sizes[i]));
    ctx.fillText(line, 0, y * r);
    y += sizes[i] * 0.05;
  });
  ctx.restore();
}

/** One leaf of a laurel, as an ellipse along the wreath. */
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A gold award seal ringed by laurels: the award's name and the magazine that gave it. */
export function laurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, title: string, from: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  const disc = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  disc.addColorStop(0, '#fff3b0');
  disc.addColorStop(0.6, '#e2b23a');
  disc.addColorStop(1, '#9a6b10');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#7a5208';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
  ctx.stroke();
  // two branches of leaves up the sides
  ctx.fillStyle = '#5c3d05';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 2 + side * (0.35 + i * 0.3);
      const x = Math.cos(a) * r * 0.82;
      const y = Math.sin(a) * r * 0.82;
      leaf(ctx, x, y, a + Math.PI / 2 + side * 0.45, r * 0.15);
    }
  }
  ctx.fillStyle = '#3a2604';
  ctx.textAlign = 'center';
  const words = title.toUpperCase().split(/\s+/);
  // break the award's name into up to three lines
  const lines: string[] = [];
  const per = Math.ceil(words.length / Math.min(3, Math.max(1, Math.ceil(title.length / 11))));
  for (let i = 0; i < words.length; i += per) lines.push(words.slice(i, i + per).join(' '));
  const lh = r * 0.24;
  lines.forEach((line, i) => {
    ctx.font = CONDENSED(fitPx(ctx, line, CONDENSED, r * 1.15, r * 0.24));
    ctx.fillText(line, 0, -r * 0.18 - ((lines.length - 1) * lh) / 2 + i * lh + lh * 0.3);
  });
  ctx.font = SANS(
    fitPx(ctx, from.toUpperCase(), (px) => SANS(px, 700), r * 1.1, r * 0.15),
    700,
  );
  ctx.fillText(from.toUpperCase(), 0, r * 0.48);
  ctx.font = SANS(r * 0.13, 700);
  ctx.fillText('★ 1995 ★', 0, r * 0.66);
  ctx.restore();
}

/** The "1 PLAYER" icon: a little figure with a joystick, in a box. Returns its width. */
export function onePlayer(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, ink = '#fff', bg = '#0b0b0b'): number {
  ctx.save();
  ctx.font = CONDENSED(h * 0.52);
  const w = (27 * h) / 28 + ctx.measureText('1 PLAYER').width + h * 0.35;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  // the player: head, body, a joystick in hand
  ctx.fillStyle = ink;
  const s = h / 28;
  ctx.beginPath();
  ctx.arc(x + 12 * s, y + 8 * s, 3.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 8 * s, y + 12.5 * s, 8 * s, 10 * s);
  ctx.fillRect(x + 17 * s, y + 18 * s, 6 * s, 4 * s);
  ctx.fillRect(x + 19.2 * s, y + 13 * s, 1.6 * s, 5 * s);
  ctx.textAlign = 'left';
  ctx.font = CONDENSED(h * 0.52);
  ctx.fillText('1 PLAYER', x + 27 * s, y + h * 0.65);
  ctx.restore();
  return w;
}

/** Floppy icons for how many disks are in the box. Returns its width. */
export function diskIcons(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, n: number, ink: string): number {
  ctx.save();
  const s = h * 0.8;
  const shown = Math.min(n, 4);
  for (let i = 0; i < shown; i++) {
    const dx = x + i * s * 0.35;
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.fillRect(dx, y, s, s);
    ctx.strokeRect(dx, y, s, s);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(dx + s * 0.25, y, s * 0.5, s * 0.32);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(dx + s * 0.15, y + s * 0.5, s * 0.7, s * 0.5);
  }
  const iconW = s + (shown - 1) * s * 0.35;
  ctx.fillStyle = ink;
  ctx.font = CONDENSED(h * 0.5);
  ctx.textAlign = 'left';
  const label = n === 1 ? '1 DISK' : `${n} DISKS`;
  ctx.fillText(label, x + iconW + 6, y + h * 0.6);
  const w = iconW + 10 + ctx.measureText(label).width;
  ctx.restore();
  return w;
}

function badgeSize(ctx: CanvasRenderingContext2D, w: number, disks?: number) {
  const dosPx = fitPx(ctx, 'MS-DOS', (px) => `italic 900 ${px}px 'Arial Black', Impact, sans-serif`, w - 14, 40);
  const pcPx = fitPx(ctx, 'IBM PC & COMPATIBLES', CONDENSED, w - 12, 15);
  const strip = disks ? Math.round(pcPx * 1.7) : 0;
  return { dosPx, pcPx, strip, h: Math.round(dosPx * 1.05 + pcPx * 1.5 + 10) + strip };
}

/** How tall platformBadge draws at width w. */
export const platformBadgeHeight = (ctx: CanvasRenderingContext2D, w: number, disks?: number): number => badgeSize(ctx, w, disks).h;

/**
 * The platform badge, as on the spine and bottom of a 1995 box: "MS-DOS" big on black,
 * "IBM PC & COMPATIBLES" under it and, with a disk count, a 3½" disk strip. Returns its height.
 */
export function platformBadge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, disks?: number): number {
  ctx.save();
  const { dosPx, pcPx, strip, h } = badgeSize(ctx, w, disks);
  ctx.fillStyle = '#0b0b0b';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 3);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `italic 900 ${dosPx}px 'Arial Black', Impact, sans-serif`;
  ctx.fillText('MS-DOS', x + w / 2, y + 6 + dosPx * 0.86);
  ctx.fillStyle = '#f5d000';
  ctx.font = CONDENSED(pcPx);
  ctx.fillText('IBM PC & COMPATIBLES', x + w / 2, y + 8 + dosPx * 1.05 + pcPx * 0.85);
  if (disks) {
    const sy = y + h - strip - 3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 3, sy, w - 6, strip);
    // a little 3½" disk, then the count
    const d = strip * 0.7;
    ctx.font = CONDENSED(pcPx);
    const label = `${disks} × 3½" DISK${disks === 1 ? '' : 'S'}`;
    const lw = ctx.measureText(label).width;
    const dx = x + (w - d - 6 - lw) / 2;
    const dy = sy + (strip - d) / 2;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dx, dy, d, d);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(dx + d * 0.25, dy, d * 0.5, d * 0.32);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(dx + d * 0.15, dy + d * 0.5, d * 0.7, d * 0.5);
    ctx.fillStyle = '#0b0b0b';
    ctx.textAlign = 'left';
    ctx.fillText(label, dx + d + 6, sy + strip * 0.72);
  }
  ctx.restore();
  return h;
}

/** The made-up Home Software Rating Council's age seal: a shield with the age in it. */
export function ratingSeal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, rating: string | undefined): number {
  const { mark, label } = ratingMark(rating);
  const h = w * 1.3;
  ctx.save();
  const shield = () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h * 0.62);
    ctx.quadraticCurveTo(x + w, y + h * 0.88, x + w / 2, y + h);
    ctx.quadraticCurveTo(x, y + h * 0.88, x, y + h * 0.62);
    ctx.closePath();
  };
  shield();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#111';
  ctx.stroke();
  ctx.fillStyle = '#1d3f8f';
  ctx.fillRect(x + 1.5, y + 1.5, w - 3, h * 0.18);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = CONDENSED(fitPx(ctx, 'HSRC', CONDENSED, w - 8, h * 0.15));
  ctx.fillText('HSRC', x + w / 2, y + h * 0.145);
  ctx.fillStyle = '#111';
  ctx.font = CONDENSED(fitPx(ctx, mark, CONDENSED, w - 10, h * 0.4));
  ctx.fillText(mark, x + w / 2, y + h * 0.56);
  ctx.font = CONDENSED(fitPx(ctx, label, CONDENSED, w * 0.8, h * 0.1));
  ctx.fillText(label, x + w / 2, y + h * 0.72);
  ctx.font = SANS(
    fitPx(ctx, 'RATED', (px) => SANS(px, 700), w * 0.5, h * 0.08),
    700,
  );
  ctx.fillText('RATED', x + w / 2, y + h * 0.84);
  ctx.restore();
  return h;
}

/** The small print that goes with the seal on the back. */
export const RATING_NOTE = 'HSRC: Home Software Rating Council. For information on ratings call 1-800-555-0142.';

/** A store's price sticker, a little crooked, its corner starting to peel. */
export function priceSticker(ctx: CanvasRenderingContext2D, x: number, y: number, store: string, price: string, tilt = 0.06): void {
  const w = 118;
  const h = 58;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#fbf6e4';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w - 14, 0);
  ctx.lineTo(w, 14);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // the peeled corner, folded over
  ctx.fillStyle = '#d9d0b4';
  ctx.beginPath();
  ctx.moveTo(w - 14, 0);
  ctx.lineTo(w - 14, 14);
  ctx.lineTo(w, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8541c';
  ctx.fillRect(0, 0, w - 14, 16);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.font = CONDENSED(fitPx(ctx, store.toUpperCase(), CONDENSED, w - 22, 12));
  ctx.fillText(store.toUpperCase(), 5, 12);
  ctx.fillStyle = '#222';
  ctx.font = `700 30px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(price, w / 2, h - 12);
  ctx.restore();
}
