// Writes games/corner-view/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/corner-view/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Corner Room',
  3: 'Level 2: Stairs of Towers',
};
await writeSimWalkthrough('corner-view', sim, SEED, titles);
