// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// across the hillside (out of the basket, over the hungry man and the fish basket), then rebuild.
//   cd web && npx vite-node ../games/loaf/tools/gendemo.ts && npx vite-node ../games/loaf/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the garden the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
