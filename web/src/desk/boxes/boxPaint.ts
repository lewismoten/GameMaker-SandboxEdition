// Drawing helpers for the retail box faces: the box's size, canvases, word-wrapped and
// shrink-to-fit text, the fonts, the background and title lettering in the box's colors, the
// publisher band, tilted screenshots in frames, badges and a barcode.
import type { CatalogEntry } from '../../project/files';
import { type BoxExtras } from './boxFacts';
import { bbsNameWidth, paintBbsName } from '../../retro/bbs/bbsName';
import { drawSandboxMark } from '../../manual/printables/sandboxMark';

export type Box = NonNullable<NonNullable<CatalogEntry['original']>['box']> & BoxExtras;

/** Box proportions (inches, like a 1995 shelf box): width, height, depth. */
export const W = 7.5;
export const H = 9.25;
export const D = 2;
export const PPI = 80; // canvas pixels per inch
export function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * PPI);
  c.height = Math.round(h * PPI);
  return [c, c.getContext('2d')!];
}

// THE -= S A N D B O X =- BBS stays one word in box text and is drawn in its colors.
const BBS_NAME = /(THE\s+)?-=\s*S\s*A\s*N\s*D\s*B\s*O\s*X\s*=-(\s+BBS)?/gi;
const NAME_MARK = '\u0001'; // stands for the name while wrapping; F = with THE and BBS
const marked = (text: string) => text.replace(BBS_NAME, (_m, the, bbs) => `${NAME_MARK}${the || bbs ? 'F' : 'S'}`);
const fontPx = (ctx: CanvasRenderingContext2D) => Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 14);

/** Width of text that may hold the marked name. */
function measure(ctx: CanvasRenderingContext2D, text: string): number {
  if (!text.includes(NAME_MARK)) return ctx.measureText(text).width;
  let w = 0;
  for (const [i, part] of text.split(NAME_MARK).entries()) {
    if (i === 0) w += ctx.measureText(part).width;
    else w += bbsNameWidth(ctx, fontPx(ctx), part[0] === 'F') + ctx.measureText(part.slice(1)).width;
  }
  return w;
}

/** Draws a line that may hold the marked name, honoring the text alignment. */
function drawLine(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, outline = false): void {
  if (!line.includes(NAME_MARK)) {
    if (outline) ctx.strokeText(line, x, y);
    return ctx.fillText(line, x, y);
  }
  const align = ctx.textAlign;
  const total = measure(ctx, line);
  let at = align === 'center' ? x - total / 2 : align === 'right' || align === 'end' ? x - total : x;
  ctx.textAlign = 'left';
  for (const [i, part] of line.split(NAME_MARK).entries()) {
    let rest = part;
    if (i > 0) {
      const full = part[0] === 'F';
      const fill = ctx.fillStyle;
      at += paintBbsName(ctx, at + fontPx(ctx) * 0.35, y, fontPx(ctx), { full }) ;
      ctx.fillStyle = fill;
      rest = part.slice(1);
    }
    ctx.fillText(rest, at, y);
    at += ctx.measureText(rest).width;
  }
  ctx.textAlign = align;
}

/**
 * Word-wraps text to a width; returns the y after the last line. With `outline`, each line
 * is stroked first in the context's strokeStyle, so it reads over a busy background.
 */
export function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, outline = false): number {
  for (const para of marked(text).split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (measure(ctx, test) > width && line) {
        drawLine(ctx, line, x, y, outline);
        y += lineHeight;
        line = word;
      } else line = test;
    }
    if (line) {
      drawLine(ctx, line, x, y, outline);
      y += lineHeight;
    }
    y += lineHeight * 0.4;
  }
  return y;
}

/** The narrowest width (down to half) that wraps text into no more lines than `width` does: even lines, no stray last word. */
export function balancedWidth(ctx: CanvasRenderingContext2D, text: string, width: number): number {
  const lines = wrapLines(ctx, text, width);
  let lo = width / 2;
  let hi = width;
  while (hi - lo > 4) {
    const mid = (lo + hi) / 2;
    if (wrapLines(ctx, text, mid) > lines) lo = mid;
    else hi = mid;
  }
  return hi;
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
  const name = (entry.company ?? 'SANDBOX SOFTWARE').toUpperCase().split('').join(' ');
  // Sandbox Software's own boxes carry its mark before the name
  const mark = !entry.company || entry.company === 'Sandbox Software' ? hgt - 6 : 0;
  const gap = mark ? hgt * 0.3 : 0;
  const x = left ? 28 : (w - ctx.measureText(name).width - mark - gap) / 2;
  if (mark) drawSandboxMark(ctx, x, y + 3, mark);
  ctx.textAlign = 'left';
  ctx.fillText(name, x + mark + gap, y + hgt * 0.68);
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

/** A UPC-A barcode filling the white label: 95 modules, guard bars, a real check digit. */
export function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: string): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  // 0 (number system) · 51136 (Sandbox Software) · 5 digits from the game · check digit
  const n = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
  const d = `051136${String(n).padStart(5, '0')}`.split('').map(Number);
  const odd = d.reduce((t, v, i) => t + (i % 2 ? 0 : v), 0);
  const even = d.reduce((t, v, i) => t + (i % 2 ? v : 0), 0);
  d.push((10 - ((odd * 3 + even) % 10)) % 10);
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const R = L.map((c) => [...c].map((b) => (b === '0' ? '1' : '0')).join(''));
  const bits = `101${d.slice(0, 6).map((v) => L[v]).join('')}01010${d.slice(6).map((v) => R[v]).join('')}101`;
  // guard bars (and the first and last digit's) run down past the others
  const guard = (i: number) => i < 10 || (i >= 45 && i < 50) || i >= 85;
  const quiet = 9;
  const mod = w / (95 + quiet * 2);
  const left = x + quiet * mod;
  const top = y + 5;
  const barH = h - 20;
  ctx.fillStyle = '#000';
  for (let i = 0; i < 95; i++) if (bits[i] === '1') ctx.fillRect(left + i * mod, top, mod + 0.15, barH + (guard(i) ? 7 : 0));
  ctx.font = SANS(Math.max(8, mod * 7.5), 400);
  ctx.textAlign = 'center';
  const base = y + h - 3;
  ctx.fillText(String(d[0]), x + (quiet * mod) / 2, base);
  ctx.fillText(d.slice(1, 6).join(''), left + 28 * mod, base);
  ctx.fillText(d.slice(6, 11).join(''), left + 67 * mod, base);
  ctx.fillText(String(d[11]), x + w - (quiet * mod) / 2, base);
  ctx.textAlign = 'left';
}

/** How many lines text wraps to (the same breaks wrap() makes), counting paragraph gaps as 0.4 line. */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): number {
  let n = 0;
  for (const para of marked(text).split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (measure(ctx, test) > width && line) (n++, (line = word));
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
