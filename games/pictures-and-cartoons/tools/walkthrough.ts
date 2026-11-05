// Writes games/pictures-and-cartoons/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, both levels, the ending).
//   cd web && npx vite-node ../games/pictures-and-cartoons/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Picture First',
  3: 'Level 2: A Cartoon Between',
  4: 'Level 3: Keep It Short',
};
await writeSimWalkthrough('pictures-and-cartoons', sim, SEED, titles);
