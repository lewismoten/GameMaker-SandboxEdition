// Re-records the title screen's demo into src/demo.ts: the bot's own run through the tower (walking into it and out the far side, then
// the coins), then rebuild.
//   cd web && npx vite-node ../games/blocks-budget/tools/gendemo.ts && npx vite-node ../games/blocks-budget/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 520;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
