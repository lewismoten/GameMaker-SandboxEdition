// Writes games/sounds-and-music/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, three levels, the ending).
//   cd web && npx vite-node ../games/sounds-and-music/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Song Per Room',
  3: 'Level 2: Sounds on Pickups',
  4: 'Level 3: A Quiet Room',
};
await writeSimWalkthrough('sounds-and-music', sim, SEED, titles);
