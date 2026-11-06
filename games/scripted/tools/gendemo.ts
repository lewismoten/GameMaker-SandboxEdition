// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run through the
// first level: reading the signs, coming to an empty stage, going back through the encore door, then
// watching the whole play from the front. Then rebuild.
//   cd web && npx vite-node ../games/scripted/tools/gendemo.ts && npx vite-node ../games/scripted/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the second go at the level the demo shows: walking to the stage and the whole play. */
const SECOND_GO = 400;
const { sim } = await play(undefined, 1);
const [first, second] = sim.segments;
if (!second || second.scene !== first.scene) throw new Error('the run should enter level 1 twice (the encore door)');
const ran = first.keys.reduce((t, k) => t + k.delta, 0);
// one stream of keys: the second go's first key counts on from the end of the first go
const keys = [...first.keys, ...second.keys.map((k, i) => (i ? k : { ...k, delta: k.delta + (sim.segmentTicks[0] - ran) }))];
recordDemo(keys, sim.segmentTicks[0] + SECOND_GO, new URL('../src/demo.ts', import.meta.url));
