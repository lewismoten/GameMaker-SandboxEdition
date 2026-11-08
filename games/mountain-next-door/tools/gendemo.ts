// Re-records the title screen's demo into src/demo.ts: the bot's own walk through the first level, then rebuild.
//   cd web && npx vite-node ../games/mountain-next-door/tools/gendemo.ts && npx vite-node ../games/mountain-next-door/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, Infinity, new URL('../src/demo.ts', import.meta.url));
