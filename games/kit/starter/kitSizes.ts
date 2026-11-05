// One way to draw Kit at every distance, from the same palette ramps: near (the 20x40 pair of blocks), far (half
// size, 10x20, as games/near-far does) and very far (4x8, a speck that still reads as beanie, face, hoodie and pants).
// Each is a majority vote of the near picture's pixels, so a helper's palette recolors every size the same way.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

const T = 255;
export type Size = 'near' | 'far' | 'veryFar';
/** Width and height of Kit's picture at each size. */
export const SIZES: Record<Size, [number, number]> = { near: [20, 40], far: [10, 20], veryFar: [4, 8] };

/**
 * `src` shrunk to `w` x `h`: each new pixel takes the most common color under it, ignoring `ink` (the outline) when
 * `dropInk` is set; a cell that is mostly clear stays clear.
 */
export function scaleDown(src: Pixels, w: number, h: number, ink = -1, dropInk = false): Pixels {
  const out = new Pixels(w, h, T);
  const sx = src.w / w;
  const sy = src.h / h;
  for (let oy = 0; oy < h; oy++)
    for (let ox = 0; ox < w; ox++) {
      const x0 = Math.floor(ox * sx);
      const x1 = Math.max(x0 + 1, Math.ceil((ox + 1) * sx));
      const y0 = Math.floor(oy * sy);
      const y1 = Math.max(y0 + 1, Math.ceil((oy + 1) * sy));
      const votes = new Map<number, number>();
      let total = 0;
      let clear = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const c = src.get(x, y);
          total++;
          if (c === T) clear++;
          else if (!(dropInk && c === ink)) votes.set(c, (votes.get(c) ?? 0) + 1);
        }
      let best = T;
      let n = 0;
      for (const [c, k] of votes) if (k > n) [best, n] = [c, k];
      if (n > 0 && (n >= total * 0.3 || (!dropInk && n > clear))) out.set(ox, oy, best);
    }
  return out;
}

/** Kit's 20x40 pose at a size, standing on the bottom row of a 20x40 canvas (far and very far centered, top empty). */
export function atSize(near: Pixels, size: Size, ink: number): Pixels {
  if (size === 'near') return near;
  const [w, h] = SIZES[size];
  const small = scaleDown(near, w, h, ink, size === 'veryFar');
  return new Pixels(20, 40, T).blit(small, Math.floor((20 - w) / 2), 40 - h, T);
}
