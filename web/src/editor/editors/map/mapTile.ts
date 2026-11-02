// Draws one block into the map picture. At 100% and above the pixels are copied crisp; below
// that the block is first shrunk in halves (a mipmap) so the zoomed-out map is smoothed rather than
// a shimmering nearest-neighbor pick, and each tile is placed on whole pixels so none leaves a seam.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

const mips = new WeakMap<HTMLCanvasElement, Map<number, HTMLCanvasElement>>();

/** `img` shrunk to dim x dim by repeated halving (each step averages 2x2 pixels). */
function shrunk(img: HTMLCanvasElement, dim: number): HTMLCanvasElement {
  let byDim = mips.get(img);
  if (!byDim) mips.set(img, (byDim = new Map()));
  const known = byDim.get(dim);
  if (known) return known;
  let from: HTMLCanvasElement = img;
  let size = img.width;
  while (size > dim) {
    size = Math.max(dim, Math.ceil(size / 2));
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(from, 0, 0, size, size);
    from = c;
  }
  byDim.set(dim, from);
  return from;
}

/** Block (x, y) of the map, `s` picture pixels wide (BLEN at the picture's 100%). */
export function drawTile(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, s: number): void {
  if (s >= BLEN) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x * s, y * s, s, s);
    return;
  }
  const left = Math.round(x * s),
    top = Math.round(y * s);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(shrunk(img, Math.max(1, Math.round(s))), left, top, Math.round((x + 1) * s) - left, Math.round((y + 1) * s) - top);
}
