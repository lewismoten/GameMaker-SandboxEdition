// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the city (past the rich man, the first stall and the beggar), then rebuild.
//   cd web && npx vite-node ../games/needle/tools/gendemo.ts && npx vite-node ../games/needle/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the garden the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
