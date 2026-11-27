// Re-records the start of Stargazing Hill into src/demo.ts. Stick Man walks under the low stars
// and jumps to pick the high ones. Run from the repository root to record and rebuild.
//   cd web && npx vite-node ../games/stick-man-stars/tools/gendemo.ts && npx vite-node ../games/stick-man-stars/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 460;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
