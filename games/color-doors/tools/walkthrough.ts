// Writes games/color-doors/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (the hall, the five rooms, the ending).
//   cd web && npx vite-node ../games/color-doors/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The hall',
  3: 'As you see it',
  4: 'Red-green, one kind',
  5: 'Red-green, the other',
  6: 'Blue-yellow',
  7: 'No color',
};
await writeSimWalkthrough('color-doors', sim, SEED, titles);
