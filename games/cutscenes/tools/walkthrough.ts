// Writes games/cutscenes/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/cutscenes/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Scene That Moves On',
  3: 'Level 2: A Menu Room',
  4: 'Level 2: A Menu Room (tale one)',
  5: 'Level 2: A Menu Room (tale two)',
};
await writeSimWalkthrough('cutscenes', sim, SEED, titles);
