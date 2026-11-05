// Writes games/leaves/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (the tumble, the gust, the ending).
//   cd web && npx vite-node ../games/leaves/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The tumble',
  3: 'The gust',
};
await writeSimWalkthrough('leaves', sim, SEED, titles);
