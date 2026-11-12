// Writes games/stick-man-stars/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, all four levels, the ending).
//   cd web && npx vite-node ../games/stick-man-stars/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Stargazing Hill',
  3: 'Level 2: Main Street',
  4: 'Level 3: Shy Street',
  5: 'Level 4: Spam Row',
};
await writeSimWalkthrough('stick-man-stars', sim, SEED, titles);
