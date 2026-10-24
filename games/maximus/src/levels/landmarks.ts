// One signature landmark per biome on every surface world, built from the decoration blocks
// SURFACE.BBL already has (it is full to its 150 blocks), so each world's own palette colors
// it: a grove of great trees in the green and autumn worlds (on fungal worlds the same shapes come out
// as a pale-stalked, pink-capped giant mushroom), crystal spires on crystal and ice worlds, a
// fall of the world's own liquid from a floating crag on lava and toxic worlds (lava or acid),
// a bone arch in the deserts and twin obelisks on the ash worlds. Scenery only: nothing in
// them hurts, and only the arch's lintel can be stood on.
import { rng } from '../../../kit/pixels';
import { type Grid, W, wx } from './mapkit';
import type { SetBuilder } from '../blocks/blockset';

type Cell = [dx: number, dy: number, block: string];

/** Cells relative to the left foot (dy up is negative), and the footprint's width. */
function shape(biome: string, rover: boolean): { w: number; cells: Cell[] } | undefined {
  const col = (dx: number, from: number, to: number, b: string): Cell[] => Array.from({ length: to - from + 1 }, (_, i) => [dx, -(from + i), b]);
  switch (biome) {
    case 'verdant':
    case 'autumn':
    case 'jungle':
    case 'fungal': {
      // a grove of three tall trees grown together, the middle one tallest
      const cells: Cell[] = [];
      for (const [cx, tall] of [
        [0, 4],
        [4, 4],
        [2, 5],
      ]) {
        for (let y = 0; y < tall; y++) cells.push([cx, -y, 'tree:trunk'], [cx + 1, -y, 'tree:trunk:r']);
        cells.push([cx, -tall, 'tree:bl'], [cx + 1, -tall, 'tree:br'], [cx, -tall - 1, 'tree:tl'], [cx + 1, -tall - 1, 'tree:tr']);
      }
      return { w: 6, cells };
    }
    case 'crystal':
    case 'ice':
      // a spire of crystal with shorter ones at its feet
      return { w: 5, cells: [...col(2, 0, 5, 'crystals'), ...col(1, 0, 2, 'crystals'), ...col(3, 0, 3, 'crystals'), [0, 0, 'crystals'], [4, 0, 'crystals']] };
    case 'lava':
    case 'toxic':
      // a floating crag pouring the world's liquid down to the ground
      return {
        w: 5,
        cells: [
          [0, -7, 'ledge:l'],
          [1, -7, 'ledge:m'],
          [2, -7, 'ledge:m'],
          [3, -7, 'ledge:m'],
          [4, -7, 'ledge:r'],
          [1, -6, 'island:under'],
          [3, -6, 'island:under'],
          ...col(2, 0, 6, 'fall:0').map(([dx, dy]): Cell => [dx, dy, `fall:${-dy % 3}`]),
          [1, 0, 'boulder'],
          [3, 0, 'boulder'],
        ],
      };
    case 'desert':
      // the ribs of something very large, arched over the sand (a rover drives under: no lintel)
      return {
        w: 5,
        cells: [
          ...col(0, 0, 4, 'pillar:mid').map(([dx, dy, b]): Cell => [dx, dy, dy === 0 ? 'pillar:base' : b]),
          ...col(4, 0, 4, 'pillar:mid').map(([dx, dy, b]): Cell => [dx, dy, dy === 0 ? 'pillar:base' : b]),
          [0, -5, 'pillar:top'],
          [4, -5, 'pillar:top'],
          ...(rover
            ? []
            : ([
                [0, -6, 'ledge:l'],
                [1, -6, 'ledge:m'],
                [2, -6, 'ledge:m'],
                [3, -6, 'ledge:m'],
                [4, -6, 'ledge:r'],
              ] as Cell[])),
          [1, 0, 'skulls'],
          [3, 0, 'skulls'],
        ],
      };
    case 'ash':
      // twin obelisks with a totem between
      return {
        w: 5,
        cells: [
          [0, 0, 'pillar:base'],
          ...col(0, 1, 6, 'pillar:mid'),
          [0, -7, 'pillar:top'],
          [4, 0, 'pillar:base'],
          ...col(4, 1, 6, 'pillar:mid'),
          [4, -7, 'pillar:top'],
          ...col(2, 0, 2, 'totem'),
        ],
      };
  }
  return undefined;
}

/**
 * Puts the biome's landmark on two flat stretches of ground, about half a world apart and well
 * away from the landing site (`ax`), over open air and small plants only. `h` is the ground height per column.
 */
export function placeLandmarks(g: Grid, s: SetBuilder, biome: string, seed: number, h: number[], ax: number, rover: boolean): number {
  const sh = shape(biome, rover);
  if (!sh) return 0;
  const r = rng(seed * 31 + 17);
  // open air, and the small things that grow on the ground (a landmark may stand on them)
  const open = new Set(
    ['air', 'grass:0', 'grass:1', 'bush:0', 'bush:1', 'flowers', 'boulder', 'stump', 'sapling', 'cactus', 'skulls', 'mushroom', 'crystals', 'totem'].map((n) =>
      s.id(n),
    ),
  );
  let placed = 0;
  for (const half of [0, 1]) {
    for (let t = 0; t < 200; t++) {
      const x0 = wx(Math.floor((half + r()) * (W / 2)));
      const far = Math.min(Math.abs(x0 - ax), W - Math.abs(x0 - ax));
      if (far < 12) continue;
      // flat ground under the whole footprint
      const y = h[x0] - 1;
      let ok = true;
      for (let i = 0; i < sh.w && ok; i++) if (h[wx(x0 + i)] !== h[x0]) ok = false;
      if (!ok) continue;
      if (!sh.cells.every(([dx, dy]) => open.has(g.get(x0 + dx, y + dy)) && !g.isLocked(wx(x0 + dx), y + dy))) continue;
      for (const [dx, dy, b] of sh.cells) g.set(x0 + dx, y + dy, s.id(b), true);
      placed++;
      break;
    }
  }
  return placed;
}
