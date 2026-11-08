// Writes games/thank-you-parade/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the twelve levels, the ending).
//   cd web && npx vite-node ../games/thank-you-parade/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Call Time',
  3: 'Level 2: Gust',
  4: 'Level 3: Bakery Row',
  5: 'Level 4: Meanwhile',
  6: 'Level 5: Mill Creek',
  7: 'Level 6: The Float',
  8: 'Level 7: Practice Hall',
  9: 'Level 8: Drum-Off',
  10: 'Level 9: The Route',
  11: 'Level 10: The Bleachers',
  12: 'Level 11: The Cannon Truck',
  13: 'Level 12: Step Off',
};
await writeSimWalkthrough('thank-you-parade', sim, SEED, titles, { clips: true });
