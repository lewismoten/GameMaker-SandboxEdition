// Re-records the title screen's demo into src/demo.ts: the bot's own run through the red room (two coins, then
// the door, which lands in the blue room), then rebuild.
//   cd web && npx vite-node ../games/many-rooms/tools/gendemo.ts && npx vite-node ../games/many-rooms/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 700;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
