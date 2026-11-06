// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run, then rebuild.
//   cd web && npx vite-node ../games/graduation-moving/tools/gendemo.ts && npx vite-node ../games/graduation-moving/build.ts
import { graduationDemo } from '../../kit/starter/graduationTools';
import { play } from './play';

await graduationDemo(play, new URL('../src/demo.ts', import.meta.url));
