// Writes games/show-the-count/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the two levels, the ending).
//   cd web && npx vite-node ../games/show-the-count/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Light the Meter',
  3: 'Level 2: The Full Meter',
};
await writeSimWalkthrough('show-the-count', sim, SEED, titles);
