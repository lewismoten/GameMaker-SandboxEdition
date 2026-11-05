// Writes games/lights-out/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, both levels, the ending).
//   cd web && npx vite-node ../games/lights-out/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Lantern Cave',
  3: 'Level 2: Light Your Way',
  4: 'Level 3: The Lights Come On',
};
await writeSimWalkthrough('lights-out', sim, SEED, titles);
