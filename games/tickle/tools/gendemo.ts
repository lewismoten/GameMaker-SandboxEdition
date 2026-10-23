// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the classroom (the first practice rats pinned and tickled), then rebuild.
//   cd web && npx vite-node ../games/tickle/tools/gendemo.ts && npx vite-node ../games/tickle/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the classroom the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
