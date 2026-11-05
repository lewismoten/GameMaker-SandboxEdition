// Writes games/shadows/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (the yard twice, the hop, the hover, the ending).
//   cd web && npx vite-node ../games/shadows/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The yard, solid shadows',
  3: 'The yard, dithered shadows',
  4: 'The hop',
  5: 'The hover',
};
await writeSimWalkthrough('shadows', sim, SEED, titles);
