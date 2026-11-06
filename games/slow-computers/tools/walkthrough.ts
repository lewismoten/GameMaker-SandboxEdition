// Writes games/slow-computers/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/slow-computers/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Short and Long',
  3: 'Level 2: A Crowd',
  4: 'Level 3: Busy Sky',
};
await writeSimWalkthrough('slow-computers', sim, SEED, titles);
