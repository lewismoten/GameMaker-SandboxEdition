// A game's mug picture as a badge, worked out on plain pixels (no canvas, so tests can run it):
// a round medallion cut from the title screen in a ring of the box's colors, the title's own
// lettering lifted off the screen onto a ribbon across it, a SANDBOX SOFTWARE scroll over the
// bottom, and the hero standing large in front, breaking out of the ring. Outside the badge
// the picture is see-through, so the mug's white shows.
import { paletteToRGBA, type Palette } from '../../formats/palette';
import { FONT8X8 } from '../../gfx/font8x8';

/** Packed 0xAABBGGRR pixels, as ImageData's buffer reads them; 0 is see-through. */
export interface Rgba {
  width: number;
  height: number;
  data: Uint32Array;
}

export interface Indexed {
  width: number;
  height: number;
  pixels: Uint8Array;
  palette: Palette;
}

/** A rectangle by its corners, x1 and y1 left out. */
type Box = [x0: number, y0: number, x1: number, y1: number];

/** What a game's badge takes from its title screen. */
export interface BadgeLook {
  /** Where the title's lettering is on the screen (a little room round it, none of it touching the edges). */
  title: Box;
  /** The middle of the medallion across the screen (it is the screen's full height); the screen's middle if left out. */
  centerX?: number;
  /** Which side the hero stands on; right if left out. */
  side?: 'left' | 'right';
  /** Bits of the screen to paint out in the color round them, such as small print the medallion would cut through. */
  hide?: Box[];
}

interface BoxColors {
  background?: string;
  accent?: string;
  ink?: string;
}

/** The picture's size, and the medallion's middle and radii in it. */
export const BADGE_W = 344;
export const BADGE_H = 240;
/** The screen shows through this radius; the rings take it out to RING. */
const PIC_R = 100;
export const RING = 109;
export const BADGE_CX = BADGE_W / 2;
export const BADGE_CY = 6 + RING;
/** The hero is drawn this tall at most, and its feet stand this far below the ring. */
const HERO_H = 124;
const HERO_W = 104;
const FEET = 8;
/** How far a ribbon's tails reach past its band. */
const TAIL = 14;

const OUTLINE = rgb('#120f1a');
const WHITE = rgb('#ffffff');

/** '#rrggbb' as a packed pixel. */
function rgb(hex: string, k = 1): number {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (0xff << 24) | (f(n & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n >> 16);
}

/** The medallion's middle across the screen, kept so the circle stays inside it. */
export function cropCenterX(screenW: number, centerX?: number): number {
  const r = Math.min(PIC_R, Math.floor(screenW / 2));
  return Math.max(r, Math.min(screenW - r, Math.round(centerX ?? screenW / 2)));
}

/**
 * The title's lettering inside `box`: every pixel except the background, which is whatever
 * reaches the box's edge through colors found on that edge (and the holes inside letters
 * drawn in those colors), less specks such as stars and snowflakes. Returns the lettering's
 * own bounds and a mask over them, or undefined if the box holds none.
 */
export function titleMask(
  img: Pick<Indexed, 'width' | 'height' | 'pixels'>,
  box: Box,
): { x: number; y: number; w: number; h: number; mask: Uint8Array } | undefined {
  const x0 = Math.max(0, box[0]);
  const y0 = Math.max(0, box[1]);
  const x1 = Math.min(img.width, box[2]);
  const y1 = Math.min(img.height, box[3]);
  const bw = x1 - x0;
  const bh = y1 - y0;
  if (bw < 3 || bh < 3) return undefined;
  const at = (x: number, y: number) => img.pixels[(y0 + y) * img.width + x0 + x];
  const edge = new Set<number>();
  for (let x = 0; x < bw; x++) edge.add(at(x, 0)).add(at(x, bh - 1));
  for (let y = 0; y < bh; y++) edge.add(at(0, y)).add(at(bw - 1, y));
  // 0 unseen, 1 background, 2 lettering
  const kind = new Uint8Array(bw * bh);
  const regions = (inRegion: (i: number) => boolean, each: (cells: number[], touchesEdge: boolean) => void) => {
    const seen = new Uint8Array(bw * bh);
    for (let start = 0; start < bw * bh; start++) {
      if (seen[start] || !inRegion(start)) continue;
      const cells = [start];
      seen[start] = 1;
      let touches = false;
      for (let k = 0; k < cells.length; k++) {
        const i = cells[k];
        const x = i % bw;
        const y = (i - x) / bw;
        if (x === 0 || y === 0 || x === bw - 1 || y === bh - 1) touches = true;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;
          const j = ny * bw + nx;
          if (!seen[j] && inRegion(j)) {
            seen[j] = 1;
            cells.push(j);
          }
        }
      }
      each(cells, touches);
    }
  };
  const isEdgeColor = (i: number) => edge.has(at(i % bw, Math.floor(i / bw)));
  regions(isEdgeColor, (cells, touches) => {
    if (touches) for (const i of cells) kind[i] = 1;
  });
  // what's left is lettering, less specks
  regions(
    (i) => kind[i] !== 1,
    (cells) => {
      const v = cells.length >= 6 ? 2 : 1;
      for (const i of cells) kind[i] = v;
    },
  );
  let [lx0, ly0, lx1, ly1] = [bw, bh, -1, -1];
  for (let i = 0; i < bw * bh; i++)
    if (kind[i] === 2) {
      const x = i % bw;
      const y = (i - x) / bw;
      [lx0, ly0, lx1, ly1] = [Math.min(lx0, x), Math.min(ly0, y), Math.max(lx1, x), Math.max(ly1, y)];
    }
  if (lx1 < 0) return undefined;
  const w = lx1 - lx0 + 1;
  const h = ly1 - ly0 + 1;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = kind[(ly0 + y) * bw + lx0 + x] === 2 ? 1 : 0;
  return { x: x0 + lx0, y: y0 + ly0, w, h, mask };
}

/** The part of a sprite that isn't see-through, or undefined if it's empty. */
export function trimSprite(src: Rgba): Rgba | undefined {
  let [x0, y0, x1, y1] = [src.width, src.height, -1, -1];
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++)
      if (src.data[y * src.width + x]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  if (x1 < 0) return undefined;
  const out = blank(x1 - x0 + 1, y1 - y0 + 1);
  stamp(out, src, -x0, -y0);
  return out;
}

/** A blank picture. */
function blank(width: number, height: number): Rgba {
  return { width, height, data: new Uint32Array(width * height) };
}

/** Draws `src` at (dx, dy), `k` times its size, skipping its see-through pixels; `flip` turns it round. */
function stamp(dst: Rgba, src: Rgba, dx: number, dy: number, k = 1, flip = false): void {
  for (let y = 0; y < src.height * k; y++)
    for (let x = 0; x < src.width * k; x++) {
      const sx = Math.floor(x / k);
      const v = src.data[Math.floor(y / k) * src.width + (flip ? src.width - 1 - sx : sx)];
      const tx = dx + x;
      const ty = dy + y;
      if (v && tx >= 0 && ty >= 0 && tx < dst.width && ty < dst.height) dst.data[ty * dst.width + tx] = v;
    }
}

/** `src` with an outline round its solid pixels: `rings` colors, innermost first, a pixel each (square corners). */
function outlined(src: Rgba, rings: number[]): Rgba {
  const n = rings.length;
  let cur = blank(src.width + 2 * n, src.height + 2 * n);
  stamp(cur, src, n, n);
  for (const color of rings) {
    const next = blank(cur.width, cur.height);
    next.data.set(cur.data);
    for (let y = 0; y < cur.height; y++)
      for (let x = 0; x < cur.width; x++) {
        if (cur.data[y * cur.width + x]) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++)
          for (let dx = -1; dx <= 1 && !near; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            near = nx >= 0 && ny >= 0 && nx < cur.width && ny < cur.height && cur.data[ny * cur.width + nx] !== 0;
          }
        if (near) next.data[y * cur.width + x] = color;
      }
    cur = next;
  }
  return cur;
}

/** A filled rectangle, clipped to the picture. */
function rect(dst: Rgba, x: number, y: number, w: number, h: number, color: number): void {
  for (let yy = Math.max(0, y); yy < Math.min(dst.height, y + h); yy++)
    for (let xx = Math.max(0, x); xx < Math.min(dst.width, x + w); xx++) dst.data[yy * dst.width + xx] = color;
}

/** Text in the 8 x 8 BIOS font. */
function text(dst: Rgba, s: string, x: number, y: number, color: number): void {
  for (let i = 0; i < s.length; i++)
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[s.charCodeAt(i) * 8 + row];
      for (let col = 0; col < 8; col++) if (bits & (1 << col)) rect(dst, x + i * 8 + col, y + row, 1, 1, color);
    }
}

/**
 * A ribbon from x0 to x1 (exclusive) and y0 to y1: its band in `fill` edged in `edge`, the whole
 * outlined, and a folded tail tucked behind each end, lower down, its end cut in a notch.
 */
function ribbon(dst: Rgba, x0: number, x1: number, y0: number, y1: number, fill: number, edge: number, shade: number): void {
  const h = y1 - y0;
  const drop = Math.min(8, Math.round(h / 3));
  // the tails, behind
  for (const side of [-1, 1]) {
    const inner = side < 0 ? x0 + 6 : x1 - 6;
    const outer = inner + side * (TAIL + 6);
    const [a, b] = side < 0 ? [outer, inner] : [inner, outer];
    const ty0 = y0 + drop;
    const ty1 = y1 + drop;
    for (let y = ty0 - 1; y <= ty1; y++) {
      // a V cut into the tail's end, deepest at its middle
      const cut = Math.max(0, Math.round(h / 2 - Math.abs(y - (ty0 + (h - 1) / 2))));
      const border = y === ty0 - 1 || y === ty1;
      for (let x = a; x < b; x++) {
        const fromEnd = side < 0 ? x - a : b - 1 - x;
        if (fromEnd < cut) continue;
        const color = border || fromEnd === cut ? OUTLINE : shade;
        if (x >= 0 && y >= 0 && x < dst.width && y < dst.height) dst.data[y * dst.width + x] = color;
      }
    }
  }
  // the band
  rect(dst, x0 - 1, y0 - 1, x1 - x0 + 2, h + 2, OUTLINE);
  rect(dst, x0, y0, x1 - x0, h, edge);
  rect(dst, x0, y0 + 2, x1 - x0, h - 4, fill);
}

/** The badge: the title screen, the hero's sprite (if it has one) and the box's colors. */
export function composeBadge(screen: Indexed, hero: Rgba | undefined, colors: BoxColors, look: BadgeLook): Rgba {
  const out = blank(BADGE_W, BADGE_H);
  const lut = paletteToRGBA(screen.palette);
  const bg = colors.background ?? '#000000';
  const accent = rgb(colors.accent ?? '#ffd23f');
  const fill = rgb(bg);
  const shade = rgb(bg, 0.6);
  const ink = rgb(colors.ink ?? '#ffffff');
  const pixels = paintOut(screen, look.hide ?? []);
  const sx = cropCenterX(screen.width, look.centerX);
  const sy = Math.round(screen.height / 2);
  // the medallion: the screen inside, then a thin ring of the box's background, its ink, the accent and an outline
  const rings: [r: number, color: number][] = [
    [PIC_R + 2, fill],
    [PIC_R + 3, ink],
    [RING - 1, accent],
    [RING, OUTLINE],
  ];
  for (let y = 0; y < BADGE_H; y++)
    for (let x = 0; x < BADGE_W; x++) {
      const dx = x - BADGE_CX + 0.5;
      const dy = y - BADGE_CY + 0.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > RING) continue;
      let v: number;
      if (d <= PIC_R) {
        const ix = sx + Math.floor(dx);
        const iy = sy + Math.floor(dy);
        v = ix >= 0 && iy >= 0 && ix < screen.width && iy < screen.height ? lut[pixels[iy * screen.width + ix]] : fill;
      } else v = rings.find(([r]) => d <= r)?.[1] ?? OUTLINE;
      out.data[y * BADGE_W + x] = v;
    }
  const left = look.side === 'left';
  // the bottom scroll, over the screen's own copyright line, a little away from the hero
  const maker = 'SANDBOX SOFTWARE';
  const sw = maker.length * 8 + 16;
  const sTop = BADGE_CY + RING - 26;
  const sMid = BADGE_CX + (left ? 12 : -12);
  ribbon(out, sMid - sw / 2, sMid + sw / 2, sTop, sTop + 16, fill, accent, shade);
  text(out, maker, sMid - maker.length * 4, sTop + 4, ink);
  // the title's lettering, across the middle on a ribbon, as high as the screen has it
  const t = titleMask({ ...screen, pixels }, look.title);
  if (t) {
    const letters = blank(t.w, t.h);
    for (let y = 0; y < t.h; y++)
      for (let x = 0; x < t.w; x++) if (t.mask[y * t.w + x]) letters.data[y * t.w + x] = lut[pixels[(t.y + y) * screen.width + t.x + x]];
    const lined = outlined(letters, [OUTLINE]);
    const width = Math.min(BADGE_W - 2 * TAIL - 4, Math.max(lined.width + 10, 2 * RING + 16));
    const lx = Math.round(BADGE_CX - lined.width / 2);
    const ly = BADGE_CY - (sy - t.y) - 1;
    ribbon(out, Math.round(BADGE_CX - width / 2), Math.round(BADGE_CX + width / 2), Math.max(1, ly - 3), ly + lined.height + 3, fill, accent, shade);
    stamp(out, lined, lx, ly);
  }
  // the hero, as big as fits and facing in, outlined dark then white, feet below the ring
  if (hero) {
    const k = Math.max(1, Math.min(Math.floor(HERO_H / hero.height), Math.floor(HERO_W / hero.width)));
    const big = blank(hero.width * k, hero.height * k);
    stamp(big, hero, 0, 0, k, !left);
    const fig = outlined(big, [OUTLINE, OUTLINE, WHITE, WHITE]);
    const fx = left ? 0 : BADGE_W - fig.width;
    stamp(out, fig, fx, BADGE_CY + RING + FEET + 4 - fig.height);
  }
  return out;
}

/** The screen's pixels with each of `boxes` filled with the color most found round its edge. */
function paintOut(screen: Pick<Indexed, 'width' | 'height' | 'pixels'>, boxes: Box[]): Uint8Array {
  const px = screen.pixels.slice();
  for (const [bx0, by0, bx1, by1] of boxes) {
    const [x0, y0] = [Math.max(0, bx0), Math.max(0, by0)];
    const [x1, y1] = [Math.min(screen.width, bx1), Math.min(screen.height, by1)];
    const count = new Map<number, number>();
    const tally = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= screen.width || y >= screen.height) return;
      const v = screen.pixels[y * screen.width + x];
      count.set(v, (count.get(v) ?? 0) + 1);
    };
    for (let x = x0 - 1; x <= x1; x++) [tally(x, y0 - 1), tally(x, y1)];
    for (let y = y0; y < y1; y++) [tally(x0 - 1, y), tally(x1, y)];
    const color = [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    for (let y = y0; y < y1; y++) px.fill(color, y * screen.width + x0, y * screen.width + x1);
  }
  return px;
}
