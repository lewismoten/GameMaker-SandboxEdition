// Writes games/teach-test-twist/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/teach-test-twist/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Teach',
  3: 'Level 2: Test',
  4: 'Level 3: Twist',
};
await writeSimWalkthrough('teach-test-twist', sim, SEED, titles);
