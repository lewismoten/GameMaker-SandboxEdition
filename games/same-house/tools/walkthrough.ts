// Writes games/same-house/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a scene), and games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/same-house/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: the street',
  3: 'Level 1: house 1 (red)',
  4: 'Level 1: house 2 (blue)',
  5: 'Level 1: house 3 (green)',
  6: 'Level 2: the square',
  7: 'Level 2: the wood room',
  8: 'Level 2: the ice room',
  9: 'Level 2: the lava room',
};
await writeSimWalkthrough('same-house', sim, SEED, titles);
