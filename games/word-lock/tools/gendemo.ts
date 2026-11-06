// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (the whole first level: two tokens, the gate that stays shut, the third token, the gate that opens), then rebuild.
//   cd web && npx vite-node ../games/word-lock/tools/gendemo.ts && npx vite-node ../games/word-lock/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 700;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
