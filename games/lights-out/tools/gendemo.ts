// Re-records the title screen's demo into src/demo.ts: the bot's own run through
// the first level (the pulse, the lights-out, the flags, out the door), then rebuild.
//   cd web && npx vite-node ../games/lights-out/tools/gendemo.ts && npx vite-node ../games/lights-out/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows: all of it. */
const LENGTH = 100000;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
