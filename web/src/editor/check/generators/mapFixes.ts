// Content generators for the map: a ladder (a column of up-gravity blocks) out of a pit to the
// first floor beside its rim, and a one-block gap where a wall or lock shuts the hero in. They
// work on a map's cells and block set and return the cells to change.
import { BACKBL, type Block } from '../../../formats/blocks';
import { MLEN, MWID } from '../../../formats/map';

const open = (b: Block | undefined) => !!b && b.solid !== 15;

/**
 * Cells for a ladder from `cell` straight up to the first height where the hero can step off
 * sideways onto a floor (an open cell beside it with something solid under it), and one
 * above that so the hero clears the rim. Undefined when no such height is in the column.
 */
export function ladderCells(blocks: Uint8Array, bg: Block[], cell: number): number[] | undefined {
  const x = cell % MLEN;
  let y = Math.floor(cell / MLEN);
  const at = (cx: number, cy: number) => (cx < 0 || cy < 0 || cx >= MLEN || cy >= MWID ? undefined : bg[blocks[cy * MLEN + cx]]);
  const out: number[] = [];
  for (; y > 1; y--) {
    if (!open(at(x, y))) return undefined;
    out.push(y * MLEN + x);
    for (const dx of [-1, 1]) {
      const side = at(x + dx, y - 1);
      const under = at(x + dx, y);
      if (open(side) && open(at(x + dx, y - 2)) && under && under.solid & 1 && y < Math.floor(cell / MLEN)) return out;
    }
  }
  return undefined;
}

/** A block to climb with: one the set already has that pulls up and isn't solid, else a new one. */
export function ladderBlock(bg: Block[], used: Uint32Array, air: number): { n: number; make?: Block } | undefined {
  for (let n = 0; n < BACKBL; n++) if (used[n] && bg[n].grav === 1 && !bg[n].solid && !bg[n].chHitPt) return { n };
  // a free slot: on no map of this set, with nothing drawn and no settings
  for (let n = BACKBL - 1; n > 0; n--) {
    const b = bg[n];
    if (used[n] || b.solid || b.grav || b.effect || b.scorePts || b.chHitPt || b.pixels.some((p) => p !== b.pixels[0])) continue;
    const base = bg[air];
    const pixels = base.pixels.slice();
    // two rails and rungs in color 0, or 15 where the air is color 0 (black and white in most palettes)
    const rail = pixels[0] === 0 ? 15 : 0;
    for (let y = 0; y < 20; y++) {
      pixels[y * 20 + 4] = pixels[y * 20 + 15] = rail;
      if (y % 5 === 2) for (let x = 4; x <= 15; x++) pixels[y * 20 + x] = rail;
    }
    return {
      n,
      make: {
        ...base,
        pixels,
        grav: 1,
        solid: 0,
        nextBl: n,
        touchBl: n,
        ntime: 0,
        birthTime: 0,
        birthMon: 0,
        chHitPt: 0,
        scorePts: 0,
        effect: 0,
        eamt: 0,
        obj: 0,
      },
    };
  }
  return undefined;
}

/** The scene's plain air: the open, harmless block the map uses most. */
export function airBlock(bg: Block[], used: Uint32Array): number {
  let best = 0;
  for (let n = 0; n < BACKBL; n++) {
    const b = bg[n];
    if (!b.solid && !b.chHitPt && !b.scorePts && !b.effect && used[n] > used[best]) best = n;
  }
  return best;
}

/** Harmless blocks the map already uses that a maze doesn't: landmark candidates. */
export function landmarkBlocks(blocks: Uint8Array, bg: Block[], avoid: Set<number>): number[] {
  const used = new Set(blocks);
  return [...used].filter(
    (n) =>
      n < BACKBL &&
      !avoid.has(n) &&
      bg[n].solid !== 15 &&
      !bg[n].chHitPt &&
      !bg[n].scorePts &&
      !bg[n].effect &&
      !bg[n].obj &&
      !bg[n].grav &&
      bg[n].touchBl === n,
  );
}

/** Crossroads at least `gap` blocks apart, each given a landmark block in turn. */
export function placeLandmarks(junctions: number[], marks: number[], gap = 6): [number, number][] {
  const out: [number, number][] = [];
  for (const j of junctions) {
    if (out.some(([c]) => Math.abs((c % MLEN) - (j % MLEN)) + Math.abs(Math.floor(c / MLEN) - Math.floor(j / MLEN)) < gap)) continue;
    out.push([j, marks[out.length % marks.length]]);
  }
  return out;
}

/**
 * A maze filling a rectangle (odd cells are rooms, walls between are knocked through by a
 * seeded depth-first walk), with a landmark block at some crossroads and a prize in a third of
 * its dead ends. Returns [cell, block] pairs to paint. The edge of the rectangle stays wall but
 * for an opening in the middle of each side.
 */
export function makeMaze(
  rect: { x: number; y: number; w: number; h: number },
  wall: number,
  floor: number,
  marks: number[],
  prize: number | undefined,
  seed = 1,
): [number, number][] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const w = rect.w - (rect.w % 2 === 0 ? 1 : 0);
  const hgt = rect.h - (rect.h % 2 === 0 ? 1 : 0);
  const grid: number[][] = Array.from({ length: hgt }, () => new Array<number>(w).fill(wall));
  const stack: [number, number][] = [[1, 1]];
  grid[1][1] = floor;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = (
      [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ] as const
    ).filter(([dx, dy]) => cx + dx > 0 && cy + dy > 0 && cx + dx < w - 1 && cy + dy < hgt - 1 && grid[cy + dy][cx + dx] === wall);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = next[Math.floor(rand() * next.length)];
    grid[cy + dy / 2][cx + dx / 2] = floor;
    grid[cy + dy][cx + dx] = floor;
    stack.push([cx + dx, cy + dy]);
  }
  // a way in on every side
  const midX = Math.floor(w / 4) * 2 + 1;
  const midY = Math.floor(hgt / 4) * 2 + 1;
  grid[0][midX] = grid[hgt - 1][midX] = grid[midY][0] = grid[midY][w - 1] = floor;
  const cell = (x: number, y: number) => (rect.y + y) * MLEN + rect.x + x;
  const open = (x: number, y: number) => y >= 0 && x >= 0 && y < hgt && x < w && grid[y][x] !== wall;
  const n = (x: number, y: number) => [open(x - 1, y), open(x + 1, y), open(x, y - 1), open(x, y + 1)].filter(Boolean).length;
  const dead: [number, number][] = [];
  const cross: number[] = [];
  for (let y = 0; y < hgt; y++)
    for (let x = 0; x < w; x++) {
      if (!open(x, y)) continue;
      if (n(x, y) === 1) dead.push([x, y]);
      if (n(x, y) >= 3) cross.push(cell(x, y));
    }
  const out: [number, number][] = [];
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) out.push([cell(x, y), grid[y][x]]);
  const paint = new Map(out);
  if (marks.length) for (const [c, b] of placeLandmarks(cross, marks)) paint.set(c, b);
  if (prize !== undefined) dead.forEach(([x, y], i) => i % 3 === 0 && paint.set(cell(x, y), prize));
  return [...paint];
}
