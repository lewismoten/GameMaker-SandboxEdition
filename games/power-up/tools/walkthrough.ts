// Writes games/power-up/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/power-up/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The High Ledge',
  3: 'Level 2: The Wide Gap',
};
await writeSimWalkthrough('power-up', sim, SEED, titles);
