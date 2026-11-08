// Re-records both lessons: falling snow, a hop gap and return walk, then the growing drift.
//   cd web && npx vite-node ../games/snow/tools/gendemo.ts && npx vite-node ../games/snow/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play();
const keys: { delta: number; key: number }[] = [];
let carried = 0;
sim.segments.forEach((seg, i) => {
  seg.keys.forEach((k, n) => keys.push({ delta: n === 0 ? k.delta + carried : k.delta, key: k.key }));
  // The gap from the last key to a door link rides on the next scene's first delta.
  if (i < sim.segmentTicks.length) carried = sim.segmentTicks[i] - seg.keys.reduce((t, k) => t + k.delta, 0);
});
recordDemo(keys, Number.MAX_SAFE_INTEGER, new URL('../src/demo.ts', import.meta.url));
