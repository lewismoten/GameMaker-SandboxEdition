// Fresh pixel lettering for a game badge's title: the 8 x 8 BIOS font (the engine's own, so no
// new credit) drawn large and bold, a light fill fading top to bottom, a 1 px dark outline and
// a drop shadow. Plain pixels, so tests run it without a canvas.

import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';

/** A title set in fresh lettering: each line has its own scale, so the first can be the biggest. */
export interface Lettering {
  lines: string[];
  /** Pixels per font pixel for each line (3 to 6). */
  scales: number[];
  /** The fill, at the top of the first line and at the bottom of the last: '#rrggbb' each. */
  fill: [top: string, bottom: string];
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

/** The lettering as a picture, centered in a block `width` wide: shadow, outline, then the fill. */
export function letteringImage(l: Lettering, outline: number, packed: (hex: string) => number): Img {
  const heights = l.lines.map((_, i) => 8 * l.scales[i] + 1);
  const widths = l.lines.map((s, i) => s.length * 8 * l.scales[i] + 1);
  const inner = Math.max(...widths);
  const innerH = heights.reduce((a, b) => a + b, 0) + GAP * (l.lines.length - 1);
  const pad = 4;
  const img: Img = { width: inner + 2 * pad, height: innerH + 2 * pad, data: new Uint32Array((inner + 2 * pad) * (innerH + 2 * pad)) };
  const solid = new Uint8Array(img.width * img.height);
  let top = pad;
  l.lines.forEach((line, li) => {
    const k = l.scales[li];
    const left = pad + Math.floor((inner - widths[li]) / 2);
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
  const near = (x: number, y: number, r: number) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < img.width && ny < img.height && solid[ny * img.width + nx]) return true;
      }
    return false;
  };
  const [top0, bot0] = [packed(l.fill[0]), packed(l.fill[1])];
  const shadow = mix(outline, 0xff000000, 0.4);
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const i = y * img.width + x;
      if (solid[i]) img.data[i] = mix(top0, bot0, Math.max(0, Math.min(1, (y - pad) / innerH)));
      else if (near(x, y, 1)) img.data[i] = outline;
      else if (near(x - 2, y - 2, 1)) img.data[i] = shadow;
    }
  return img;
}
