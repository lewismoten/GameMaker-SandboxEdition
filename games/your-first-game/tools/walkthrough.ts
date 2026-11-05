// Writes games/your-first-game/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/your-first-game/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Walk and Jump',
  3: 'Level 2: Key and Door',
  4: 'Level 3: All Together',
};
await writeSimWalkthrough('your-first-game', sim, SEED, titles);
