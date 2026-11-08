// Writes games/one-more-try/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, and one more for level 1 after the post), and games/kit/walkthrough.ts
// checks the run on the real engine (title, two levels, the ending).
//   cd web && npx vite-node ../games/one-more-try/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Post to Start Over',
  3: 'Level 2: Ways Back',
};
await writeSimWalkthrough('one-more-try', sim, SEED, titles);
