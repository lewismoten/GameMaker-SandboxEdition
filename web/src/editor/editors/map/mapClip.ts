// Picking the part of a 100x100 map to save as a picture: the part that isn't just the
// background fill around the level, or one screen as the game shows it (PLAYGAME draws a
// 16x10 block window centered on where the character starts).
import { MLEN, MWID } from '../../../formats/map';

export interface BlockRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The game's view in blocks (SCRNBLEN x SCRNBWID: 320x200 pixels of 20x20 blocks). */
const SCREEN_BLOCKS = { w: 16, h: 10 };

export const WHOLE_MAP: BlockRect = { x: 0, y: 0, w: MLEN, h: MWID };

/** Keeps a rectangle on the map, at least 1x1, moving it in rather than shrinking it where it can. */
export function clampRect(r: BlockRect): BlockRect {
  const w = Math.max(1, Math.min(MLEN, Math.round(r.w)));
  const h = Math.max(1, Math.min(MWID, Math.round(r.h)));
  return { x: Math.max(0, Math.min(MLEN - w, Math.round(r.x))), y: Math.max(0, Math.min(MWID - h, Math.round(r.y))), w, h };
}

/**
 * The part of the map worth showing: everything except the background fill that surrounds
 * the level (the block most common along the map's edges, and every cell of it joined to the
 * edge), which the character never gets to see. Placed monsters count as content. A margin
 * of fill is kept round the content; the whole map when nothing stands out.
 */
export function contentBounds(blocks: Uint8Array, monsters: { x: number; y: number }[] = [], margin = 1): BlockRect {
  const counts = new Map<number, number>();
  const edge: number[] = [];
  for (let x = 0; x < MLEN; x++) edge.push(x, (MWID - 1) * MLEN + x);
  for (let y = 1; y < MWID - 1; y++) edge.push(y * MLEN, y * MLEN + MLEN - 1);
  for (const i of edge) counts.set(blocks[i], (counts.get(blocks[i]) ?? 0) + 1);
  const fill = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  // flood the fill in from the edges
  const outside = new Uint8Array(MLEN * MWID);
  const stack = edge.filter((i) => blocks[i] === fill);
  for (const i of stack) outside[i] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % MLEN;
    const y = (i / MLEN) | 0;
    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= MLEN || ny >= MWID) continue;
      const j = ny * MLEN + nx;
      if (!outside[j] && blocks[j] === fill) {
        outside[j] = 1;
        stack.push(j);
      }
    }
  }
  let x0 = MLEN;
  let y0 = MWID;
  let x1 = -1;
  let y1 = -1;
  const take = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) if (!outside[y * MLEN + x]) take(x, y);
  for (const m of monsters) if (m.x >= 0 && m.y >= 0 && m.x < MLEN && m.y < MWID) take(m.x, m.y);
  if (x1 < 0) return { ...WHOLE_MAP };
  x0 = Math.max(0, x0 - margin);
  y0 = Math.max(0, y0 - margin);
  x1 = Math.min(MLEN - 1, x1 + margin);
  y1 = Math.min(MWID - 1, y1 + margin);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** The screen the game shows when the character starts at `at` (kept on the map). */
export function gameView(at: { x: number; y: number }, screens = { w: 1, h: 1 }): BlockRect {
  const w = SCREEN_BLOCKS.w * screens.w;
  const h = SCREEN_BLOCKS.h * screens.h;
  return clampRect({ x: at.x - Math.floor(w / 2), y: at.y - Math.floor(h / 2), w, h });
}

export type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** Drags a frame's edge, corner or middle by (dx, dy) blocks; a fixed-size frame only moves. */
export function dragRect(r: BlockRect, handle: Handle, dx: number, dy: number, fixedSize = false): BlockRect {
  if (handle === 'move' || fixedSize) return clampRect({ ...r, x: r.x + dx, y: r.y + dy });
  let { x, y } = r;
  let x1 = r.x + r.w;
  let y1 = r.y + r.h;
  if (handle.includes('w')) x = Math.min(x1 - 1, Math.max(0, x + dx));
  if (handle.includes('e')) x1 = Math.max(x + 1, Math.min(MLEN, x1 + dx));
  if (handle.includes('n')) y = Math.min(y1 - 1, Math.max(0, y + dy));
  if (handle.includes('s')) y1 = Math.max(y + 1, Math.min(MWID, y1 + dy));
  return { x, y, w: x1 - x, h: y1 - y };
}
