// Fresh pixel lettering for a game badge's title: the 8 x 8 BIOS font (the engine's own, so no
// new credit) drawn large and bold, a metallic fill blended top to bottom on each line, an
// extruded edge and a 1 px dark outline. Plain pixels, so tests run it without a canvas.

import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';

/** A title set in fresh lettering: each line has its own scale, so the first can be the biggest. */
export interface Lettering {
  lines: string[];
  /** Pixels per font pixel for each line (3 to 6). */
  scales: number[];
  /** The fill's colors from the top of each line to its bottom, blended between: '#rrggbb' each. A dark one in the middle makes chrome. */
  fill: string[];
  /** The extruded edge running down and right of the letters, as if they stood out of the ribbon: '#rrggbb'. */
  extrude: string;
  /** The middle of the block down the badge. */
  centerY: number;
}

/** A packed 0xAABBGGRR pixel image, as `Rgba` in gameBadge. */
interface Img {
  width: number;
  height: number;
  data: Uint32Array;
}

const GAP = 3;

function mix(a: number, b: number, t: number): number {
  const ch = (c: number, s: number) => (c >> s) & 255;
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (255 << 24) | (m(16) << 16) | (m(8) << 8) | m(0);
}

/** `stops` blended at `t` (0 at the first, 1 at the last). */
function along(stops: number[], t: number): number {
  const p = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  return stops.length === 1 ? stops[0] : mix(stops[i], stops[i + 1], p - i);
}

/** The lettering as a picture, centered in a block `width` wide: extruded edge, outline, then the fill. */
export function letteringImage(l: Lettering, outline: number, packed: (hex: string) => number): Img {
  const heights = l.lines.map((_, i) => 8 * l.scales[i] + 1);
  const widths = l.lines.map((s, i) => s.length * 8 * l.scales[i] + 1);
  const inner = Math.max(...widths);
  const innerH = heights.reduce((a, b) => a + b, 0) + GAP * (l.lines.length - 1);
  const depth = Math.max(2, Math.floor(Math.min(...l.scales) / 2) + 1);
  const pad = depth + 3;
  const img: Img = { width: inner + 2 * pad, height: innerH + 2 * pad, data: new Uint32Array((inner + 2 * pad) * (innerH + 2 * pad)) };
  const solid = new Uint8Array(img.width * img.height);
  // which line each row belongs to, and where in it
  const rowT = new Float32Array(img.height).fill(-1);
  let top = pad;
  l.lines.forEach((line, li) => {
    const k = l.scales[li];
    const left = pad + Math.floor((inner - widths[li]) / 2);
    for (let y = 0; y < heights[li]; y++) rowT[top + y] = y / (heights[li] - 1);
    for (let i = 0; i < line.length; i++)
      for (let row = 0; row < 8; row++) {
        const bits = FONT8X8[line.charCodeAt(i) * 8 + row];
        for (let col = 0; col < 8; col++)
          if (bits & (1 << col))
            // each font pixel a little over its cell, so strokes come out bold
            for (let y = 0; y <= k; y++) for (let x = 0; x <= k; x++) solid[(top + row * k + y) * img.width + left + (i * 8 + col) * k + x] = 1;
      }
    top += heights[li] + GAP;
  });
  // the letters pushed out down and right: the extruded edge
  const body = solid.slice();
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (solid[y * img.width + x])
        for (let o = 1; o <= depth; o++) {
          const i = (y + o) * img.width + x + o;
          if (x + o < img.width && y + o < img.height) body[i] ||= 2;
        }
  const near = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < img.width && ny < img.height && body[ny * img.width + nx]) return true;
      }
    return false;
  };
  const stops = l.fill.map(packed);
  const side = packed(l.extrude);
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const i = y * img.width + x;
      if (solid[i]) img.data[i] = along(stops, rowT[y]);
      else if (body[i]) img.data[i] = mix(side, 0xff000000, ((x + y) & 1) * 0.12);
      else if (near(x, y)) img.data[i] = outline;
    }
  return img;
}
