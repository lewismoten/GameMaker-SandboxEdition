// How many ticks the bot's run takes a level (to size the title demo in gendemo.ts).
//   cd web && npx vite-node ../games/power-ladder/tools/ticks.ts
import { play } from './play';

const { sim } = await play();
sim.segments.forEach((s, i) => console.log(`level ${i + 1}: ${s.keys.reduce((n, k) => n + k.delta, 0)} ticks`));
