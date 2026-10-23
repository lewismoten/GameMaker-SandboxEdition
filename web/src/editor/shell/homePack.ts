// Packs a tab's collections (the Bard's, on the Bizarre tab) into the tile grid so they take as
// few rows as they can: each collection is a band of its heading over its tiles, and one too
// short to fill a row shares it with the next that fits (first fit, in the collections' order),
// so a collection of one game sits beside the others rather than on a row of its own. Each row
// of tiles has a row for headings above it.

/** Where a collection goes: its heading's grid row and columns, and each tile's row and column (1-based grid lines). */
export interface Placed {
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
