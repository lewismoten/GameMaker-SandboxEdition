// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// in the Piano Shop (the black-key ledges and the first keyboards), then rebuild.
//   cd web && npx vite-node ../games/tuneup/tools/gendemo.ts && npx vite-node ../games/tuneup/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the Piano Shop the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
