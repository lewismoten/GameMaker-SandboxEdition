// Star-whale formations: a pod of gentle star whales placed one per map cell so that,
// seen from the chart, they spell a word or draw a picture. Every whale of a species walks
// the same path from the same start on the same clock (PLAYGAME moves every monster each
// tick, on screen or not), and two monsters of equal power never fight, so the whole pod
// swims as one and the picture keeps its shape.
import type { Block } from '../../../../web/src/formats/blocks';
import { Grid, W, H, wx, wy } from './mapkit';

/** A tiny 5-row font: each letter a list of rows, X marks a whale. */
const GLYPHS: Record<string, string[]> = {
  L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  W: ['X...X', 'X...X', 'X.X.X', 'X.X.X', '.X.X.'],
  I: ['X', 'X', 'X', 'X', 'X'],
  S: ['XXX', 'X..', 'XXX', '..X', 'XXX'],
};

/** The cells of a word, left to right, one blank column between letters. */
export function wordCells(word: string): { cells: { x: number; y: number }[]; w: number; h: number } {
  const cells: { x: number; y: number }[] = [];
  let x0 = 0;
  for (const ch of word) {
    const g = GLYPHS[ch];
    g.forEach((row, y) => [...row].forEach((c, x) => c === 'X' && cells.push({ x: x0 + x, y })));
    x0 += g[0].length + 1;
  }
  return { cells, w: x0 - 1, h: 5 };
}

/** Thirteen stars in a ring, like the first flag's circle of thirteen colonies. */
export function ringCells(n = 13, rx = 5, ry = 4): { cells: { x: number; y: number }[]; w: number; h: number } {
  const cells: { x: number; y: number }[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    const c = { x: rx + Math.round(Math.cos(a) * rx), y: ry + Math.round(Math.sin(a) * ry) };
    if (!cells.some((p) => p.x === c.x && p.y === c.y)) cells.push(c);
  }
  return { cells, w: rx * 2 + 1, h: ry * 2 + 1 };
}

/**
 * Places a formation in the clear space nearest `near`: the box it swims through (its
 * own size plus the path's reach) must be empty starfield with no monsters.
 * Returns where it went, or undefined when there is no room.
 */
export function placeFormation(
  g: Grid,
  bbl: Block[],
  mon: number,
  shape: { cells: { x: number; y: number }[]; w: number; h: number },
  near: { x: number; y: number },
  reach: { x: number; y: number },
): { x: number; y: number; w: number; h: number } | undefined {
  const clear = (x: number, y: number) => {
    if (g.isLocked(x, y)) return false;
    const b = bbl[g.get(x, y)];
    return (b.solid & 14) === 0 && b.chHitPt >= 0 && !b.obj && b.effect === 0 && !g.monsterAt(x, y);
  };
  const boxW = shape.w + reach.x + 2;
  const boxH = shape.h + reach.y + 2;
  const fits = (x0: number, y0: number) => {
    for (let y = y0 - 1; y < y0 - 1 + boxH; y++) for (let x = x0 - 1; x < x0 - 1 + boxW; x++) if (!clear(x, y)) return false;
    return true;
  };
  for (let d = 0; d < 50; d++)
    for (let dy = -d; dy <= d; dy++)
      for (let dx = -d; dx <= d; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
        const x0 = wx(near.x + dx);
        const y0 = wy(near.y + dy);
        if (!fits(x0, y0)) continue;
        for (const c of shape.cells) g.place(mon, x0 + c.x, y0 + c.y);
        return { x: x0, y: y0, w: boxW, h: boxH };
      }
  return undefined;
}

/** Clears other monsters out of the view around a formation, so all of it is drawn
 * (PLAYGAME draws at most 50 monsters at once). */
export function clearAround(g: Grid, box: { x: number; y: number; w: number; h: number }, keep: number, margin = { x: 9, y: 5 }): void {
  const near = (v: number, lo: number, len: number, m: number, size: number) => {
    const d = (((v - (lo - m)) % size) + size) % size;
    return d < len + m * 2;
  };
  for (let i = g.monsters.length - 1; i >= 0; i--) {
    const m = g.monsters[i];
    if (m.mon !== keep && near(m.x, box.x, box.w, margin.x, W) && near(m.y, box.y, box.h, margin.y, H)) g.monsters.splice(i, 1);
  }
}
