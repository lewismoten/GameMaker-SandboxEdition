// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first level,
// from the entrance to the third sign (without the last key, the walk into the door, so the demo
// ends on the hall and Esc leaves it). Then rebuild.
//   cd web && npx vite-node ../games/title-demo/tools/gendemo.ts && npx vite-node ../games/title-demo/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
const [first] = sim.segments;
if (!first) throw new Error('the first level should have been played');
const length = first.keys.slice(0, -1).reduce((t, k) => t + k.delta, 0);
recordDemo(first.keys, length, new URL('../src/demo.ts', import.meta.url));
