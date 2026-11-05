// Writes games/town-links/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (title, the world, the town, the house, the ending).
//   cd web && npx vite-node ../games/town-links/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The world map',
  3: 'The town',
  4: 'The house',
};
await writeSimWalkthrough('town-links', sim, SEED, titles);
