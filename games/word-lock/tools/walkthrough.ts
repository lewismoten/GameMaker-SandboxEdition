// Writes games/word-lock/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the two levels, the ending).
//   cd web && npx vite-node ../games/word-lock/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Pay to Pass',
  3: 'Level 2: No Tray',
};
await writeSimWalkthrough('word-lock', sim, SEED, titles);
