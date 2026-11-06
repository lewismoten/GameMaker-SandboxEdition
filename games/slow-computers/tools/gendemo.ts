// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first level's
// signs, one short pad and the first long pad. Then rebuild.
//   cd web && npx vite-node ../games/slow-computers/tools/gendemo.ts && npx vite-node ../games/slow-computers/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
const [first] = sim.segments;
if (!first) throw new Error('the first level should have been played');
recordDemo(first.keys, 460, new URL('../src/demo.ts', import.meta.url));
