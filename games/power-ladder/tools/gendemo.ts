// Re-records the title screen's demo into src/demo.ts: the start of the bot's own run
// through the first level (the signs, the coins and the jump over the wall), then rebuild.
//   cd web && npx vite-node ../games/power-ladder/tools/gendemo.ts && npx vite-node ../games/power-ladder/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 540;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
