// Writes games/choose-hero/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, with the Big Hops door), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/choose-hero/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Two Doors',
  4: 'Level 2: The Same Climb (Big Hops)',
};
await writeSimWalkthrough('choose-hero', sim, SEED, titles);
