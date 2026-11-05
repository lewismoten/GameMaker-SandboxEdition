// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (Kit drops onto the road and waits while the balls roll out of the hill, then starts toward the door), then rebuild.
//   cd web && npx vite-node ../games/parallax/tools/gendemo.ts && npx vite-node ../games/parallax/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 450;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
