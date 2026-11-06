// Writes games/power-ladder/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/power-ladder/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Small Key, Big Door',
  3: 'Level 2: One Gold Key',
  4: 'Level 3: Keys Add Up',
};
await writeSimWalkthrough('power-ladder', sim, SEED, titles);
