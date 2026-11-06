// Re-records the title screen's demo into src/demo.ts: the bot's own run through
// the first room (the coins, then through the door; the demo ends a moment after it arrives in the next room), then rebuild.
//   cd web && npx vite-node ../games/room-to-room/tools/gendemo.ts && npx vite-node ../games/room-to-room/build.ts
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows. */
const LENGTH = 900;
const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, LENGTH, new URL('../src/demo.ts', import.meta.url));
