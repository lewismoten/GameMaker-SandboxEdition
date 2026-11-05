// Writes games/day-night/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/day-night/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: One Map, Two Looks (day)',
  3: 'Level 1: the same map at night',
  4: 'Level 2: Sundown Street (day)',
  5: 'Level 2: dusk',
  6: 'Level 2: night',
};
await writeSimWalkthrough('day-night', sim, SEED, titles);
