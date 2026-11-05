// Writes games/breakable-walls/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, and one more for level 2 after the fall), and games/kit/walkthrough.ts
// checks the run on the real engine (title, three levels, the ending).
//   cd web && npx vite-node ../games/breakable-walls/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Bump a Crate',
  3: 'Level 2: Coins Pay Once',
  4: 'Level 3: Spinning Gems',
};
await writeSimWalkthrough('breakable-walls', sim, SEED, titles);
