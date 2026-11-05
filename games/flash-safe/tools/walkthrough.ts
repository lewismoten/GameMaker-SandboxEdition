// Writes games/flash-safe/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/flash-safe/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Hit Without a Flash',
  3: 'Level 2: Slow and Small',
  4: 'Level 3: Storm, Held',
};
await writeSimWalkthrough('flash-safe', sim, SEED, titles);
