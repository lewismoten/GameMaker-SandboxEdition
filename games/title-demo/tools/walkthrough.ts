// Writes games/title-demo/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/title-demo/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Menu Picture',
  3: 'Level 2: A Demo That Plays Itself',
};
await writeSimWalkthrough('title-demo', sim, SEED, titles);
