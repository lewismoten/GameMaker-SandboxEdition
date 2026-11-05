// Re-records the title screen's demo into src/demo.ts: the bot's own run through the street and
// the first two houses: the first sign, door 1 (the red house), back out, and door 2 (the blue house),
// so the title shows one map in two palettes. Then rebuild.
//   cd web && npx vite-node ../games/same-house/tools/gendemo.ts && npx vite-node ../games/same-house/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 4);
const keys: { delta: number; key: number }[] = [];
for (const seg of sim.segments) keys.push(...seg.keys);
if (!keys.length) throw new Error('the first scenes should have been played');
recordDemo(keys, Infinity, new URL('../src/demo.ts', import.meta.url));
