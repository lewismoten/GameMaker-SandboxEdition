// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (the signs, the coins and the jump over the wall), then rebuild.
//   cd web && npx vite-node ../games/say-something/tools/gendemo.ts && npx vite-node ../games/say-something/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows: all of it, up to the walk into Pip. */
const LENGTH = 3000;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
