// Writes games/very-far/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the scenes of both levels, the ending).
//   cd web && npx vite-node ../games/very-far/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Up Close',
  3: 'Level 2: Far Away (too quick)',
  4: 'Level 2: Far Away (slow steps)',
  5: 'Level 3: Big Things in Front',
};
await writeSimWalkthrough('very-far', sim, SEED, titles);
