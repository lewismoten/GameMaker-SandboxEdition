// Writes games/thank-you-parade/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the six levels, the ending).
//   cd web && npx vite-node ../games/thank-you-parade/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Scattered',
  3: 'Level 2: Gust',
  4: 'Level 3: The Float',
  5: 'Level 4: In Step',
  6: 'Level 5: The Route',
  7: 'Level 6: Finale',
};
await writeSimWalkthrough('thank-you-parade', sim, SEED, titles, { clips: true });
