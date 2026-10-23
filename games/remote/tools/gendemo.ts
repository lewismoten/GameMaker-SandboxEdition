// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own search
// of the living room (the couch cushions, the game controller, Teddy), then rebuild.
//   cd web && npx vite-node ../games/remote/tools/gendemo.ts && npx vite-node ../games/remote/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the living room the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
