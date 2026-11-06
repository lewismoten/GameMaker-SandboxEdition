// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first level by day:
// the three signs, the porch's coins and the door, which takes the hero into the same room at
// night. Then rebuild.
//   cd web && npx vite-node ../games/day-night/tools/gendemo.ts && npx vite-node ../games/day-night/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
const [first] = sim.segments;
if (!first) throw new Error('the first level should have been played');
recordDemo(first.keys, Infinity, new URL('../src/demo.ts', import.meta.url));
