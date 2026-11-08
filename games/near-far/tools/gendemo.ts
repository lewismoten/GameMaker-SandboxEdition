// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first near scene (two coins, then
// the trail, which lands in the far plane), then rebuild.
//   cd web && npx vite-node ../games/near-far/tools/gendemo.ts && npx vite-node ../games/near-far/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 700;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
