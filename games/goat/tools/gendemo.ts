// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own
// run through the shepherds' field (out of the fold, wool, the first scream), then rebuild.
//   cd web && npx vite-node ../games/goat/tools/gendemo.ts && npx vite-node ../games/goat/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the field the demo shows. */
const LENGTH = 420;
const { sim } = await play();
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
