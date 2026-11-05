// Writes games/overhead/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time an area is entered), and games/kit/walkthrough.ts
// checks the run on the real engine (title, the room, the roads, the ending).
//   cd web && npx vite-node ../games/overhead/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Room',
  3: 'Level 2: The Four Roads (the meadow)',
  4: 'Level 2: The Four Roads (the woods)',
  5: 'Level 2: The Four Roads (the village)',
  6: 'Level 2: The Four Roads (the pond)',
  7: 'Level 2: The Four Roads (the shop)',
};
await writeSimWalkthrough('overhead', sim, SEED, titles);
