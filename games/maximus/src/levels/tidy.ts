// Level-design tidy-up for generated worlds: a pickup the courier can never reach (in a cave
// pocket the generator sealed off) is cleared to the ground it lay on, and a healing spring
// that landed in such a pocket moves to a cave floor that can be reached. Found with
// tools/reach.ts.
import type { Block } from '../../../web/src/formats/blocks';
import type { SetBuilder } from '../blocks/blockset';
import { Grid, W, H, reachable } from './mapkit';

/** Blocks a courier gets through one way or another: doors, force fields, crystal and false rock. */
const THROUGH = ['door', 'field:on', 'field:on2', 'field:off', 'glass', 'fake', 'laser:v', 'laser:v0', 'laser:h', 'laser:h0', 'plat:off'];

export function tidyUnreachable(
  g: Grid,
  s: SetBuilder,
  bbl: Block[],
  from: { x: number; y: number },
  tall: boolean,
  floors: { x0: number; x1: number; y: number }[] = [],
): number {
  const through = new Set(THROUGH.filter((n) => s.has(n)).map((n) => s.id(n)));
  const seen = reachable(g, bbl, from.x, from.y, { tall, pass: (n) => through.has(n) });
  const near = (x: number, y: number) => [0, 1, -1, W, -W].some((d) => seen[(y * W + x + d + W * H) % (W * H)]);
  const pickups = new Set(s.family('p').concat(s.family('pc')));
  const heal = s.has('heal') ? s.id('heal') : -1;
  let fixed = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = g.get(x, y);
      if ((!pickups.has(n) && n !== heal) || near(x, y)) continue;
      if (n === heal) {
        const spot = floors.find((f) => seen[f.y * W + f.x0] && !g.isLocked(f.x0, f.y));
        if (!spot) continue;
        g.set(spot.x0, spot.y, heal, true);
      }
      // the block a pickup turns into when taken is the ground it lies on
      g.set(x, y, n === heal ? s.id('cave:0') : bbl[n].touchBl, true);
      fixed++;
    }
  return fixed;
}
