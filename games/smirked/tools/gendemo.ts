// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own walk
// through the fog hall (batteries, dollars, a fog machine or two), then rebuild.
//   cd web && npx vite-node ../games/smirked/tools/gendemo.ts && npx vite-node ../games/smirked/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the living room the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
