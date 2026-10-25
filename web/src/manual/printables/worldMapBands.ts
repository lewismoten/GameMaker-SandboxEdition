// One more way for the World Map (worldMapPlan.ts) to arrange a game built round hubs (a
// scene with many dead ends off it: Maximus's sectors and their worlds, a library's rooms and
// their books): each hub over a block of its dead ends, the blocks side by side in bands of a
// few, so every hub's places stay together as a region, and the other places (the start, the
// way between the hubs, the end) in a row along the top near the places they lead to.
import { flowOrder, settle, spanningForest, type Cells, type Graph } from '../../editor/editors/integrator/layoutCells';

/**
 * Hubs (3 or more dead ends) `perBand` to a band, each over its dead ends in rows of at most
 * `across`; undefined when the game has no hubs.
 */
export function bandCells(g: Graph, across: number, perBand: number): Cells | undefined {
  const { kids } = spanningForest(g);
  const order = flowOrder(g);
  const leafOf = (s: number) => (kids.get(s) ?? []).filter((c) => !kids.get(c)?.length);
  const hubs = order.filter((s) => leafOf(s).length >= 3);
  if (!hubs.length) return undefined;
  const cells: Cells = new Map();
  let top = 1;
  for (let b = 0; b < hubs.length; b += perBand) {
    let col = 0;
    let tallest = 0;
    for (const hub of hubs.slice(b, b + perBand)) {
      const leaves = leafOf(hub);
      const w = Math.min(across, leaves.length);
      const rows = Math.ceil(leaves.length / w);
      // the last row's places in the middle under the hub
      leaves.forEach((s, k) => {
        const r = Math.floor(k / w);
        const inRow = r === rows - 1 ? leaves.length - r * w : w;
        cells.set(s, { c: col + (w - inRow) / 2 + (k % w), r: top + 1 + r });
      });
      cells.set(hub, { c: col + (w - 1) / 2, r: top });
      col += w;
      tallest = Math.max(tallest, rows);
    }
    top += tallest + 1;
  }
  // everything else along the top, near the places it links with, kept in play order
  const rest = order.filter((s) => !cells.has(s));
  let want = rest.map((_, i) => i);
  for (let round = 0; round < 6; round++) {
    const col = new Map(rest.map((s, i) => [s, want[i]]));
    const at = (s: number) => cells.get(s)?.c ?? col.get(s);
    want = rest.map((s, i) => {
      const near = [...g.out.get(s)!, ...g.inn.get(s)!].map(at).filter((c): c is number => c !== undefined);
      return near.length ? (want[i] + near.reduce((a, b) => a + b, 0)) / (near.length + 1) : want[i];
    });
    want = settle(want, 0);
  }
  rest.forEach((s, i) => cells.set(s, { c: want[i], r: 0 }));
  return cells;
}
