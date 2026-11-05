// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (the whole first level: the gate stays shut with nothing lit, the five bulbs light along the ledge, the gate opens), then rebuild.
//   cd web && npx vite-node ../games/show-the-count/tools/gendemo.ts && npx vite-node ../games/show-the-count/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 1400;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
