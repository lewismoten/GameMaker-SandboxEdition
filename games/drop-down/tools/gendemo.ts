// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (the walk to the signs, the failed hop and the crate breaking), then rebuild.
//   cd web && npx vite-node ../games/drop-down/tools/gendemo.ts && npx vite-node ../games/drop-down/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 260;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
