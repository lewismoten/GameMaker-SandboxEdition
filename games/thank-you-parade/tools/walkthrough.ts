// Writes games/thank-you-parade/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the seven levels, the ending).
//   cd web && npx vite-node ../games/thank-you-parade/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Call Time',
  3: 'Level 2: Gust',
  4: 'Level 3: Meanwhile',
  5: 'Level 4: The Float',
  6: 'Level 5: Drum-Off',
  7: 'Level 6: The Route',
  8: 'Level 7: Step Off',
};
await writeSimWalkthrough('thank-you-parade', sim, SEED, titles, { clips: true });
