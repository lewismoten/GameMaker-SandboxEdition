// Writes games/beams/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (the beams, the fog, the glow, the ending).
//   cd web && npx vite-node ../games/beams/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The beams',
  3: 'The fog',
  4: 'The glow',
};
await writeSimWalkthrough('beams', sim, SEED, titles);
