// Writes games/many-rooms/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a room is entered), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the rooms of both levels, the ending).
//   cd web && npx vite-node ../games/many-rooms/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Four Rooms (the red room)',
  3: 'Level 1: Four Rooms (the blue room)',
  4: 'Level 1: Four Rooms (the green room)',
  5: 'Level 1: Four Rooms (the gold room)',
  6: 'Level 2: One Landing Cell (the hub)',
  7: 'Level 2: One Landing Cell (the west room)',
  8: 'Level 2: One Landing Cell (the east room)',
};
await writeSimWalkthrough('many-rooms', sim, SEED, titles);
