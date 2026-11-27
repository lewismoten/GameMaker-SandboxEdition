// Re-records the title screen demo in src/demo.ts. Kit takes two gold keys in the first room,
// spends one at the gold door and keeps the spare. Rebuild to put the recording on disk.
//   cd web && npx vite-node ../games/special-counters/tools/gendemo.ts && npx vite-node ../games/special-counters/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
