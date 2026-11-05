// Writes games/jump-boots/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/jump-boots/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Jet Pack',
  3: 'Level 2: Double-Jump Boots',
};
await writeSimWalkthrough('jump-boots', sim, SEED, titles);
