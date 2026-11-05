// Re-records the title screen's demo into src/demo.ts: the bot's own run through the whole first
// level (the signs, the coins, the jump over the wall, the hill, the gumdrop and the exit), then rebuild.
//   cd web && npx vite-node ../games/your-first-game/tools/gendemo.ts && npx vite-node ../games/your-first-game/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, Infinity, new URL('../src/demo.ts', import.meta.url));
