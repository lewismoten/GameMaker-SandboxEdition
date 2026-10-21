// Drawing helpers for the retail box faces: the box's size, canvases, word-wrapped and
// shrink-to-fit text, the fonts, the background and title lettering in the box's colors, the
// publisher band, tilted screenshots in frames, badges and a barcode.
import type { CatalogEntry } from '../../project/files';
import { type BoxExtras } from './boxFacts';

export type Box = NonNullable<NonNullable<CatalogEntry['original']>['box']> & BoxExtras;

/** Box proportions (inches, like a 1995 shelf box): width, height, depth. */
export const W = 7.5;
export const H = 9.25;
export const D = 2;
const PPI = 80; // canvas pixels per inch
export function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * PPI);
  c.height = Math.round(h * PPI);
  return [c, c.getContext('2d')!];
}

/** Word-wraps text to a width; returns the y after the last line. */
export function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number): number {
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else line = test;
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    y += lineHeight * 0.4;
  }
  return y;
}

/** The biggest font size (up to max) at which text fits the width. */
export function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number): number {
  let px = max;
  for (; px > 8; px -= 2) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= width) break;
  }
  return px;
}

export const TITLE_FONT = (px: number) => `italic 900 ${px}px 'Arial Black', Impact, sans-serif`;
export const BODY_FONT = (px: number) => `${px}px Georgia, 'Times New Roman', serif`;
export const SANS = (px: number, weight = 700) => `${weight} ${px}px Arial, Helvetica, sans-serif`;

export function background(ctx: CanvasRenderingContext2D, box: Box, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, box.background);
  g.addColorStop(1, shade(box.background, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // a little print grain
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < (w * h) / 60; i++) {
    ctx.fillStyle = i % 2 ? '#fff' : '#000';
    ctx.fillRect((i * 7919) % w, (i * 104729) % h, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Lightens (amount > 0) or darkens a #rrggbb color. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

export function titleText(ctx: CanvasRenderingContext2D, box: Box, title: string, cx: number, y: number, width: number, max: number): void {
  const px = fit(ctx, title, TITLE_FONT, width, max);
  ctx.font = TITLE_FONT(px);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = px * 0.16;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = shade(box.accent, -0.45);
  ctx.strokeText(title, cx + px * 0.06, y + px * 0.06);
  ctx.fillText(title, cx + px * 0.06, y + px * 0.06);
  ctx.strokeText(title, cx, y);
  const g = ctx.createLinearGradient(0, y - px, 0, y);
  g.addColorStop(0, shade(box.accent, 0.5));
  g.addColorStop(1, box.accent);
  ctx.fillStyle = g;
  ctx.fillText(title, cx, y);
  ctx.textAlign = 'left';
}

export function publisherBand(ctx: CanvasRenderingContext2D, entry: CatalogEntry, w: number, y: number, hgt: number, left = false): void {
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, y, w, hgt);
  ctx.fillStyle = '#f5d000';
  ctx.font = SANS(hgt * 0.5, 900);
  ctx.textAlign = left ? 'left' : 'center';
  ctx.fillText((entry.company ?? 'SANDBOX SOFTWARE').toUpperCase().split('').join(' '), left ? 28 : w / 2, y + hgt * 0.68);
  ctx.textAlign = 'left';
}

export function framedShot(ctx: CanvasRenderingContext2D, shot: HTMLCanvasElement | undefined, x: number, y: number, w: number, tilt = 0): number {
  const h = shot ? (w * shot.height) / shot.width : w * 0.625;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
  ctx.shadowColor = 'transparent';
  if (shot) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(shot, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  return h;
}

export function badge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string, hgt = 28): number {
  ctx.font = SANS(hgt * 0.6, 900);
  ctx.textAlign = 'left';
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, hgt);
  ctx.fillStyle = fg;
  ctx.fillText(text, x + 10, y + hgt * 0.71);
  return w;
}

export function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: string): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000';
  let n = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  for (let bx = x + 8; bx < x + w - 8;) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const bw = 1 + (n % 3);
    if ((n >> 8) % 2) ctx.fillRect(bx, y + 6, bw, h - 22);
    bx += bw + 1;
  }
  ctx.font = SANS(11, 400);
  ctx.textAlign = 'left';
  ctx.fillText(`0 ${String(Math.abs(n) % 100000).padStart(5, '0')} ${String(Math.abs(n >> 5) % 100000).padStart(5, '0')} 5`, x + 10, y + h - 4);
}

/** How many lines text wraps to (the same breaks wrap() makes), counting paragraph gaps as 0.4 line. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): number {
  let n = 0;
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width && line) (n++, (line = word));
      else line = test;
    }
    if (line) n++;
    n += 0.4;
  }
  return n;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** The game's levels (adventure scenes in its .gam), for the hours of play and the claims. */
