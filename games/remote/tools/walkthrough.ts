// Writes games/remote/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/remote/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Living Room',
  3: 'Level 2: The Kitchen',
  4: 'Level 3: The Void Between the Cushions',
  5: 'Level 4: The Living Room Ride',
};
await writeSimWalkthrough('remote', sim, SEED, titles);
