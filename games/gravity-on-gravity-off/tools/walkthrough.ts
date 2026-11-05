// Writes games/gravity-on-gravity-off/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/gravity-on-gravity-off/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Gravity On',
  3: 'Level 2: Gravity Off',
};
await writeSimWalkthrough('gravity-on-gravity-off', sim, SEED, titles);
