// Re-records the title screen's demo into src/demo.ts: the bot's own run through level 1 (a flash at each sign) and
// the start of level 2, up to the mistake (a drop into the ditch and the walk back up the step), then rebuild.
//   cd web && npx vite-node ../games/lightning/tools/gendemo.ts && npx vite-node ../games/lightning/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of level 2 the demo shows after level 1: through the drop into the ditch and back out. */
const INTO_TWO = 420;
const { sim } = await play(undefined, 2);
const [one, two] = sim.segments.map((s) => s.keys);
const length = one.reduce((t, k) => t + k.delta, 0) + INTO_TWO;
recordDemo([...one, ...two], length, new URL('../src/demo.ts', import.meta.url));
