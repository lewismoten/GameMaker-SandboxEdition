// Re-records the title screen's demo into src/demo.ts: the bot's whole run, one unbroken list of keys (the demo
// recorder counts game ticks across scene changes, so a later scene's keys follow the earlier ones after the ticks between them):
// the hall, then each of the five doors in turn and back, then the last door, which ends the game. Then rebuild.
//   cd web && npx vite-node ../games/color-doors/tools/gendemo.ts && npx vite-node ../games/color-doors/build.ts
//   cd web && npx vite-node ../games/color-doors/tools/demoCheck.ts      (plays the recording on the real engine)
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the run the demo shows. */
const LENGTH = Number(process.env.DEMO_TICKS ?? Number.MAX_SAFE_INTEGER);
const { sim } = await play();
const keys: { delta: number; key: number }[] = [];
let carried = 0;
sim.segments.forEach((seg, i) => {
  seg.keys.forEach((k, n) => keys.push({ delta: n === 0 ? k.delta + carried : k.delta, key: k.key }));
  if (i < sim.segmentTicks.length) carried = sim.segmentTicks[i] - seg.keys.reduce((t, k) => t + k.delta, 0);
});
console.log(`whole run: ${sim.segmentTicks.join(' ')} ticks per scene entered`);
recordDemo(keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
