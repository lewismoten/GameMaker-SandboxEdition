// Re-records the title screen's demo into src/demo.ts: the bot's run through the first level (the copies that blink as one,
// then the six that are each their own, and the door), then rebuild.
//   cd web && npx vite-node ../games/lightning-bugs/tools/gendemo.ts && npx vite-node ../games/lightning-bugs/build.ts
//   cd web && npx vite-node ../games/lightning-bugs/tools/demoCheck.ts      (plays the recording on the real engine)
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

const { sim } = await play(undefined, 1);
recordDemo(sim.segments[0].keys, Number.MAX_SAFE_INTEGER, new URL('../src/demo.ts', import.meta.url));
