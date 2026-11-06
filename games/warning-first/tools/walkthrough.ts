// Writes games/warning-first/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/warning-first/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Rumble, Then Puff',
  3: 'Level 2: Flicker, Then Gone',
};
await writeSimWalkthrough('warning-first', sim, SEED, titles);
