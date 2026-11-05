// Writes games/near-far/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a scene is entered), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the scenes of both levels, the ending).
//   cd web && npx vite-node ../games/near-far/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Into the Distance (near)',
  3: 'Level 1: Into the Distance (far)',
  4: 'Level 1: Into the Distance (near again)',
  5: 'Level 2: Past the Cliff (near, before the cliff)',
  6: 'Level 2: Past the Cliff (far)',
  7: 'Level 2: Past the Cliff (near, past the cliff)',
};
await writeSimWalkthrough('near-far', sim, SEED, titles);
