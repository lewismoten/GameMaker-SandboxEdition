// Re-records the title screen's demo into src/demo.ts: the bot's own run through the first level,
// running out of time once (the bar goes dark, the gate shuts, the clock door) and then in time,
// then rebuild.
//   cd web && npx vite-node ../games/beat-the-clock/tools/gendemo.ts && npx vite-node ../games/beat-the-clock/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
const [first, second] = sim.segments;
if (!second) throw new Error('the first level should have been entered twice (the clock door)');
// the second go starts when the hero stepped into the clock door: the keys in between are one gap
const lastKey = first.keys.reduce((t, k) => t + k.delta, 0);
const gap = sim.segmentTicks[0] - lastKey;
const keys = [...first.keys, { delta: gap + second.keys[0].delta, key: second.keys[0].key }, ...second.keys.slice(1)];
recordDemo(keys, Infinity, new URL('../src/demo.ts', import.meta.url));
