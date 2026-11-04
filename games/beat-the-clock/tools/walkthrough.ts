// Writes games/beat-the-clock/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, level 1 twice: the clock door starts it again), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/beat-the-clock/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Beat the Clock',
  3: 'Level 2: Round and Round',
};
await writeSimWalkthrough('beat-the-clock', sim, SEED, titles);
