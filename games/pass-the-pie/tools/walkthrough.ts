// Writes games/pass-the-pie/walkthrough.json: the bot plays the whole game on the built disk (one key segment a
// level), and games/kit/walkthrough.ts checks the run on the real engine (title, the six streets, the ending).
//   cd web && npx vite-node ../games/pass-the-pie/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Street 1: Pumpkin Yard',
  3: 'Street 2: Gravy Slide',
  4: 'Street 3: Windy Park',
  5: 'Street 4: Cranberry Roll',
  6: 'Street 5: Hungry Dog',
  7: 'Street 6: Parade Dash',
};
await writeSimWalkthrough('pass-the-pie', sim, SEED, titles);
