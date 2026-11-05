// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first level,
// walking across the stage to the wall,
// Then rebuild.
//   cd web && npx vite-node ../games/cutscenes/tools/gendemo.ts && npx vite-node ../games/cutscenes/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
const [first] = sim.segments;
if (!first) throw new Error('the first level should have been played');
recordDemo(first.keys, Infinity, new URL('../src/demo.ts', import.meta.url));
