// Writes games/thank-you-parade/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the levels, the ending).
//   cd web && npx vite-node ../games/thank-you-parade/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const NAMES = [
  'Call Time',
  'Gust',
  'Bakery Row',
  'Meanwhile',
  'Mill Creek',
  'Frost Lot',
  'The Float',
  'Practice Hall',
  'Drum-Off',
  'The Route',
  'The Bleachers',
  'The Clock Tower',
  'The Cannon Truck',
  'Step Off',
];
const titles: Record<number, string> = Object.fromEntries(NAMES.map((n, i) => [i + 2, `Level ${i + 1}: ${n}`]));
await writeSimWalkthrough('thank-you-parade', sim, SEED, titles, { clips: true });
