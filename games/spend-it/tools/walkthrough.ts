// Writes games/spend-it/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the two levels, the ending).
//   cd web && npx vite-node ../games/spend-it/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Key For 3 Coins',
  3: 'Level 2: Save Up',
};
await writeSimWalkthrough('spend-it', sim, SEED, titles);
