// Packs a tab's collections (the Bard's on the Bizarre tab, the makers on Gameware and Shareware) into the tile grid so they take as
// few rows as they can: each collection is a band of its heading over its tiles, and one too
// short to fill a row shares it with the next that fits (first fit, in the collections' order),
// so a collection of one game sits beside the others rather than on a row of its own. Each row
// of tiles has a row for headings above it. The makers' groups (packGroups) leave no slot empty
// instead, a group carrying on onto the next row, in the order that reads best.

/** Where a collection goes: its heading's grid row and columns, and each tile's row and column (1-based grid lines). */
interface Placed {
  /** The collection's index in the list given. */
  index: number;
  head: { row: number; col: number; span: number };
  tiles: { row: number; col: number }[];
}

/** Places collections of `sizes` games in a grid `cols` wide, in reading order (row, then column). */
export function packCollections(sizes: readonly number[], cols: number): Placed[] {
  cols = Math.max(1, Math.floor(cols));
  /** Tiles already in each band (a heading row and a tile row). */
  const used: number[] = [];
  const out: (Placed & { band: number })[] = [];
  sizes.forEach((n, index) => {
    if (n <= 0) return;
    if (n > cols) {
      // more than a row: rows of its own, the last one left open for the next collections
      const band = used.length;
      const rows = Math.ceil(n / cols);
      for (let r = 0; r < rows; r++) used.push(r < rows - 1 ? cols : n - (rows - 1) * cols);
      const tiles = Array.from({ length: n }, (_, i) => ({ row: (band + Math.floor(i / cols)) * 2 + 2, col: 1 + (i % cols) }));
      out.push({ index, band, head: { row: band * 2 + 1, col: 1, span: cols }, tiles });
      return;
    }
    let band = used.findIndex((u) => cols - u >= n);
    if (band < 0) band = used.push(0) - 1;
    const col = used[band] + 1;
    used[band] += n;
    out.push({ index, band, head: { row: band * 2 + 1, col, span: n }, tiles: Array.from({ length: n }, (_, i) => ({ row: band * 2 + 2, col: col + i })) });
  });
  return out.sort((a, b) => a.band - b.band || a.head.col - b.head.col).map(({ band: _, ...p }) => p);
}

/** Every order of `items` (a few groups: at most 7! orders). */
function orders<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((x, i) => orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/** Groups laid one after another in `order`, a group carrying on onto the next row where the last ends. */
function flow(sizes: readonly number[], order: readonly number[], cols: number): Placed[] {
  let at = 0;
  return order.map((index) => {
    const n = sizes[index];
    const start = at;
    at += n;
    const row = Math.floor(start / cols);
    const col = (start % cols) + 1;
    const tiles = Array.from({ length: n }, (_, i) => ({ row: Math.floor((start + i) / cols) * 2 + 2, col: ((start + i) % cols) + 1 }));
    return { index, head: { row: row * 2 + 1, col, span: Math.min(n, cols - col + 1) }, tiles };
  });
}

/**
 * Places groups (the makers on the Gameware and Shareware tabs) in a grid `cols` wide with no
 * empty slot before the last tile, so they take the fewest rows there can be: each group follows
 * the last, carrying on onto the next row when it must (its heading over its first part, so
 * the headings never meet). The first `fixed` groups keep their places; the rest go in the
 * order that breaks the fewest groups across rows, then leaves the fewest single tiles cut off
 * from their group, then stays nearest the order given.
 */
export function packGroups(sizes: readonly number[], cols: number, fixed = 1): Placed[] {
  cols = Math.max(1, Math.floor(cols));
  const all = sizes.flatMap((n, i) => (n > 0 ? [i] : []));
  const first = all.slice(0, fixed);
  const rest = all.slice(fixed);
  const candidates = rest.length <= 7 ? orders(rest) : [rest];
  let best: { placed: Placed[]; score: number[] } | undefined;
  for (const order of candidates) {
    const placed = flow(sizes, [...first, ...order], cols);
    let breaks = 0;
    let lone = 0;
    for (const p of placed) {
      const rows = new Map<number, number>();
      for (const t of p.tiles) rows.set(t.row, (rows.get(t.row) ?? 0) + 1);
      breaks += rows.size - 1;
      if (rows.size > 1) lone += [...rows.values()].filter((k) => k === 1).length;
    }
    const moved = order.reduce((s, x, i) => s + Math.abs(rest.indexOf(x) - i), 0);
    const score = [breaks, lone, moved];
    const k = best ? score.findIndex((v, i) => v !== best!.score[i]) : -1;
    if (!best || (k >= 0 && score[k] < best.score[k])) best = { placed, score };
  }
  return best?.placed ?? [];
}
