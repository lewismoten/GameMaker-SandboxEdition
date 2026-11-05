// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first scene (up close to the door,
// which lands in the far scene), then rebuild.
//   cd web && npx vite-node ../games/very-far/tools/gendemo.ts && npx vite-node ../games/very-far/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 160;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
