// Re-records the title screen's demo into src/demo.ts: the bot's own run through levels 1 and 2, one
// unbroken list of keys (the demo recorder counts game ticks across scene changes, so the second level's
// keys follow the first's after the ticks between them). It shows each lesson once: Kit leans on the hedge and the picture stays,
// then the second level's picture follows him.
// Rebuild afterwards.
//   cd web && npx vite-node ../games/scroll/tools/gendemo.ts && npx vite-node ../games/scroll/build.ts
//   cd web && npx vite-node ../games/scroll/tools/demoCheck.ts      (plays the recording on the real engine)
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks cut from the end of the run: the last walk to the exit door. */
const END_SHORT = 60;
const { sim } = await play(undefined, 2);
const keys: { delta: number; key: number }[] = [];
let carried = 0;
sim.segments.forEach((seg, i) => {
  seg.keys.forEach((k, n) => keys.push({ delta: n === 0 ? k.delta + carried : k.delta, key: k.key }));
  // ticks from this segment's last key to the next scene's first tick are not keys: they ride on the next delta
  if (i < sim.segmentTicks.length) carried = sim.segmentTicks[i] - seg.keys.reduce((t, k) => t + k.delta, 0);
});
// the demo stops short of the last door, so the title screen's demo ends in the room and not in the ending
const total = keys.reduce((t, k) => t + k.delta, 0);
const cut: { delta: number; key: number }[] = [];
const held = new Set<number>();
let t = 0;
for (const k of keys) {
  if (t + k.delta > total - END_SHORT) break;
  t += k.delta;
  cut.push(k);
  if (k.key & 0x80) held.delete(k.key & 0x7f);
  else held.add(k.key);
}
// let go of whatever is still held, so the hero stands still until the demo's Esc and does not walk on into the door
for (const key of held) cut.push({ delta: 1, key: key | 0x80 });
recordDemo(cut, Number.MAX_SAFE_INTEGER, new URL('../src/demo.ts', import.meta.url));
