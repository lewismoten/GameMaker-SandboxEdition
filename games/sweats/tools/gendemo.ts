// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// along the avenue and in through The Hive's castle door, then rebuild.
//   cd web && npx vite-node ../games/sweats/tools/gendemo.ts && npx vite-node ../games/sweats/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the avenue and the counter the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 'hive1');
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
