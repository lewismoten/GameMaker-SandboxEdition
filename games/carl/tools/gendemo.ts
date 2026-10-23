// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the living room (the candy on the shelf, the coffee table, over Teddy), then rebuild.
//   cd web && npx vite-node ../games/carl/tools/gendemo.ts && npx vite-node ../games/carl/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the living room the demo shows. */
const LENGTH = 300;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
