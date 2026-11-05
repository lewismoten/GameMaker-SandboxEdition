// Writes games/three-tokens/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the two levels, the ending).
//   cd web && npx vite-node ../games/three-tokens/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Three for the Gate',
  3: 'Level 2: The Gate Is the Exit',
};
await writeSimWalkthrough('three-tokens', sim, SEED, titles);
