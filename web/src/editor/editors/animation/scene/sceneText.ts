// Text in the animation maker: the PC's 8x8 font (gfx/cp437Glyphs.ts, the BIOS font PLAYGAME's
// text used, with every CP437 glyph) at a whole-number scale, with an outline, placed by its motion at each frame.
// Also the checks that keep it inside the 320x200 frame: what runs off which edge, and a fix
// that wraps, shrinks and moves a text until it fits.
import { FONT_CP437 } from '../../../../gfx/cp437Glyphs';
import { toCp437 } from '../../../../retro/text/cp437';
import { SCENE_H, SCENE_W, type TextItem } from './sceneModel';

const GLYPH = 8;

/** Typographic marks the PC font has plain forms of. */
const PLAIN: Record<string, string> = { '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u2013': '-', '\u2014': '-', '\u2026': '.' };

/** The font's glyph for a letter: ASCII as itself, a symbol or accent as its CP437 code, a typographic mark as its plain form, else "?". */
const glyphOf = (ch: string): number => {
  const plain = PLAIN[ch] ?? ch;
  const code = toCp437(plain);
  return code.length === 1 && (code !== plain || plain.charCodeAt(0) < 128) ? code.charCodeAt(0) : 63;
};

/** Lines of the text as typed. */
export const linesOf = (text: string): string[] => text.replace(/\r/g, '').split('\n');

/** Pixel size of one line's row: the glyphs plus a little room for the outline. */
const lineHeight = (scale: number) => (GLYPH + 2) * scale;

/** The text's box at rest, outline included: width and height in pixels. */
export function textSize(it: Pick<TextItem, 'text' | 'scale' | 'outline'>): { w: number; h: number } {
  const lines = linesOf(it.text);
  const pad = it.outline >= 0 ? 2 * it.scale : 0;
  const cols = Math.max(0, ...lines.map((l) => l.length));
  return { w: cols * GLYPH * it.scale + pad, h: lines.length * lineHeight(it.scale) - 2 * it.scale + pad };
}

/** Top-left of the box at rest. */
export function restBox(it: TextItem): { x: number; y: number; w: number; h: number } {
  const { w, h } = textSize(it);
  return { x: it.align === 'center' ? Math.round(it.x - w / 2) : it.x, y: it.y, w, h };
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Where the box's top-left is at frame `f` of the item, and how many letters show. */
export function textAt(it: TextItem, f: number): { x: number; y: number; letters: number } {
  const box = restBox(it);
  const len = it.end - it.start;
  const all = Number.MAX_SAFE_INTEGER;
  const t = easeOut(Math.min(1, f / Math.max(1, it.rate)));
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  switch (it.motion) {
    case 'type':
      return { x: box.x, y: box.y, letters: Math.floor(f / Math.max(1, it.rate)) + 1 };
    case 'slide-left':
      return { x: lerp(SCENE_W, box.x), y: box.y, letters: all };
    case 'slide-right':
      return { x: lerp(-box.w, box.x), y: box.y, letters: all };
    case 'slide-up':
      return { x: box.x, y: lerp(SCENE_H, box.y), letters: all };
    case 'slide-down':
      return { x: box.x, y: lerp(-box.h, box.y), letters: all };
    case 'scroll-up': {
      // from just below the bottom to just above the top over the item's frames
      const p = len <= 1 ? 1 : f / (len - 1);
      return { x: box.x, y: Math.round(SCENE_H + (-box.h - SCENE_H) * p), letters: all };
    }
    case 'scroll-left': {
      const p = len <= 1 ? 1 : f / (len - 1);
      return { x: Math.round(SCENE_W + (-box.w - SCENE_W) * p), y: box.y, letters: all };
    }
    default:
      return { x: box.x, y: box.y, letters: all };
  }
}

/** What runs off the frame at rest (the edges a scroll passes on purpose are not counted). */
export function textWarnings(it: TextItem): string[] {
  if (!it.text.trim()) return [];
  const b = restBox(it);
  const out: string[] = [];
  const horizontal = it.motion !== 'scroll-left';
  const vertical = it.motion !== 'scroll-up';
  if (horizontal && b.x < 0) out.push(`runs off the left edge by ${-b.x} px`);
  if (horizontal && b.x + b.w > SCENE_W) out.push(`runs off the right edge by ${b.x + b.w - SCENE_W} px`);
  if (vertical && b.y < 0) out.push(`runs off the top by ${-b.y} px`);
  if (vertical && b.y + b.h > SCENE_H) out.push(`runs off the bottom by ${b.y + b.h - SCENE_H} px`);
  if (horizontal && b.w > SCENE_W) out.push(`is wider than the screen (${b.w} px of ${SCENE_W})`);
  return out;
}

/** Words wrapped into lines of at most `cols` letters (a longer word is cut). */
export function wrapText(text: string, cols: number): string {
  const out: string[] = [];
  for (const para of linesOf(text)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > cols) {
        if (line) (out.push(line), (line = ''));
        out.push(w.slice(0, cols));
        w = w.slice(cols);
      }
      if (!w) continue;
      if (!line) line = w;
      else if (line.length + 1 + w.length <= cols) line += ` ${w}`;
      else (out.push(line), (line = w));
    }
    out.push(line);
  }
  return out.join('\n');
}

/** The text changed as little as possible to fit inside the frame: wrapped, then smaller, then moved in. */
export function fitText(it: TextItem, margin = 4): TextItem {
  const next = { ...it };
  const room = SCENE_W - 2 * margin;
  for (;;) {
    const pad = next.outline >= 0 ? 2 * next.scale : 0;
    const cols = Math.max(1, Math.floor((room - pad) / (GLYPH * next.scale)));
    const longestWord = Math.max(0, ...next.text.split(/\s+/).map((w) => w.length));
    if (longestWord > cols && next.scale > 1) {
      next.scale--;
      continue;
    }
    if (textSize(next).w > room) next.text = wrapText(next.text, cols);
    if (textSize(next).h > SCENE_H - 2 * margin && next.scale > 1 && next.motion !== 'scroll-up') {
      next.scale--;
      next.text = it.text;
      continue;
    }
    break;
  }
  const { w, h } = textSize(next);
  const left = next.align === 'center' ? next.x - w / 2 : next.x;
  const shiftX = left < margin ? margin - left : left + w > SCENE_W - margin ? SCENE_W - margin - (left + w) : 0;
  if (next.motion !== 'scroll-left') next.x = Math.round(next.x + shiftX);
  if (next.motion !== 'scroll-up') next.y = Math.max(margin, Math.min(next.y, SCENE_H - margin - h));
  return next;
}

/**
 * Draws the text with its top-left at (x, y) into indexed pixels (`w` wide), clipped to the
 * picture: the outline first, all round each lit font pixel, then the letters.
 */
export function drawText(px: Uint8Array, w: number, h: number, it: TextItem, x: number, y: number, letters = Number.MAX_SAFE_INTEGER): void {
  const s = it.scale;
  const { w: bw } = textSize(it);
  const pad = it.outline >= 0 ? s : 0;
  const lines = linesOf(it.text);
  const dots: [number, number][] = [];
  let shown = 0;
  lines.forEach((line, row) => {
    const lineW = line.length * GLYPH * s;
    const lx = x + pad + (it.align === 'center' ? Math.floor((bw - 2 * pad - lineW) / 2) : 0);
    const ly = y + pad + row * lineHeight(s);
    for (let i = 0; i < line.length; i++) {
      if (shown++ >= letters) return;
      const glyph = glyphOf(line[i]) * 8;
      for (let gy = 0; gy < GLYPH; gy++) {
        const bits = FONT_CP437[glyph + gy];
        for (let gx = 0; gx < GLYPH; gx++) if (bits & (1 << gx)) dots.push([lx + (i * GLYPH + gx) * s, ly + gy * s]);
      }
    }
  });
  const put = (px0: number, py0: number, size: number, c: number) => {
    const x0 = Math.max(0, px0);
    const y0 = Math.max(0, py0);
    const x1 = Math.min(w, px0 + size);
    const y1 = Math.min(h, py0 + size);
    if (x1 > x0) for (let yy = y0; yy < y1; yy++) px.fill(c, yy * w + x0, yy * w + x1);
  };
  if (it.outline >= 0) for (const [dx, dy] of dots) put(dx - s, dy - s, 3 * s, it.outline);
  for (const [dx, dy] of dots) put(dx, dy, s, it.color);
}
