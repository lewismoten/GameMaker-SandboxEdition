// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// in the haunted bathroom (up the steam to the silver rack, over the towel), then rebuild.
//   cd web && npx vite-node ../games/loofah/tools/gendemo.ts && npx vite-node ../games/loofah/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the bedroom the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
