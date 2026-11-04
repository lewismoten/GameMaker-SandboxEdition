// Writes games/keys-and-doors/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/keys-and-doors/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: One Key, One Door',
  3: 'Level 2: Two Keys, One Door',
  4: 'Level 3: Two Keys, Two Doors',
};
await writeSimWalkthrough('keys-and-doors', sim, SEED, titles);
