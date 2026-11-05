// Re-records the title screen's demo into src/demo.ts: the bot's own whole run through the two levels, one
// unbroken list of keys (the demo recorder counts game ticks across scene changes, so the second level's
// keys follow the first's after the ticks between them). It shows each lesson once: every pad, the replay door, the cut-off, and the sounds that say what happened. Rebuild afterwards.
//   cd web && npx vite-node ../games/sound-board/tools/gendemo.ts && npx vite-node ../games/sound-board/build.ts
//   cd web && npx vite-node ../games/sound-board/tools/demoCheck.ts      (plays the recording on the real engine)
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play();
const keys: { delta: number; key: number }[] = [];
let carried = 0;
sim.segments.forEach((seg, i) => {
  seg.keys.forEach((k, n) => keys.push({ delta: n === 0 ? k.delta + carried : k.delta, key: k.key }));
  // ticks from this segment's last key to the next scene's first tick are not keys: they ride on the next delta
  if (i < sim.segmentTicks.length) carried = sim.segmentTicks[i] - seg.keys.reduce((t, k) => t + k.delta, 0);
});
recordDemo(keys, Number.MAX_SAFE_INTEGER, new URL('../src/demo.ts', import.meta.url));
