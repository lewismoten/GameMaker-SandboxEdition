// Writes games/puzzle-room/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, and one more after each soft drop), and games/kit/walkthrough.ts
// checks the run on the real engine (title, three levels, the ending).
//   cd web && npx vite-node ../games/puzzle-room/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Two Levers',
  3: 'Level 2: Wired Room',
};
await writeSimWalkthrough('puzzle-room', sim, SEED, titles);
