// The title's lettering picked out of a title screen by its palette colors, for titles drawn over a
// picture that can't be told from what's behind them: only the colors named count, so the ribbon
// behind them stays a solid fill and none of the picture shows between or inside the letters.

/** A box by its corners, x1 and y1 left out. */
type Box = [x0: number, y0: number, x1: number, y1: number];

/** Where the lettering is and a mask over it (1 lettering, 0 not), in the shape titleMask() gives. */
export interface InkMask {
  x: number;
  y: number;
  w: number;
  h: number;
  mask: Uint8Array;
}

/** The pixels in `box` whose palette index is in `ink`, less specks smaller than `minCells`; undefined if none are left. */
export function inkMask(img: { width: number; height: number; pixels: Uint8Array }, box: Box, ink: number[], minCells = 4): InkMask | undefined {
  const x0 = Math.max(0, box[0]);
  const y0 = Math.max(0, box[1]);
  const bw = Math.min(img.width, box[2]) - x0;
  const bh = Math.min(img.height, box[3]) - y0;
  if (bw < 1 || bh < 1) return undefined;
  const set = new Set(ink);
  const on = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) on[y * bw + x] = set.has(img.pixels[(y0 + y) * img.width + x0 + x]) ? 1 : 0;
  // drop specks: groups of touching (8-way) pixels smaller than minCells
  const seen = new Uint8Array(bw * bh);
  for (let s = 0; s < on.length; s++) {
    if (!on[s] || seen[s]) continue;
    const cells = [s];
    seen[s] = 1;
    for (let k = 0; k < cells.length; k++) {
      const x = cells[k] % bw;
      const y = (cells[k] - x) / bw;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const j = ny * bw + nx;
          if (nx >= 0 && ny >= 0 && nx < bw && ny < bh && on[j] && !seen[j]) [(seen[j] = 1), cells.push(j)];
        }
    }
    if (cells.length < minCells) for (const i of cells) on[i] = 0;
  }
  let [lx0, ly0, lx1, ly1] = [bw, bh, -1, -1];
  for (let i = 0; i < on.length; i++)
    if (on[i]) {
      const x = i % bw;
      const y = (i - x) / bw;
      [lx0, ly0, lx1, ly1] = [Math.min(lx0, x), Math.min(ly0, y), Math.max(lx1, x), Math.max(ly1, y)];
    }
  if (lx1 < 0) return undefined;
  const w = lx1 - lx0 + 1;
  const h = ly1 - ly0 + 1;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = on[(ly0 + y) * bw + lx0 + x];
  return { x: x0 + lx0, y: y0 + ly0, w, h, mask };
}
