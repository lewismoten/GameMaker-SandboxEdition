// Re-records the title screen's demo into src/demo.ts: the bot's own run through the whole first
// level (the signs, the jump over the gap, the drop in for the coin, and the exit), then rebuild.
//   cd web && npx vite-node ../games/teach-test-twist/tools/gendemo.ts && npx vite-node ../games/teach-test-twist/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, Infinity, new URL('../src/demo.ts', import.meta.url));
