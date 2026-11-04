// Writes games/room-to-room/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment each time a room is entered), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the rooms of the three levels, the ending).
//   cd web && npx vite-node ../games/room-to-room/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Out the Door (the first room)',
  3: 'Level 1: Out the Door (the second room)',
  4: 'Level 2: There and Back (the hall)',
  5: 'Level 2: There and Back (the kitchen)',
  6: 'Level 2: There and Back (the bedroom)',
  7: 'Level 3: Two Doors (the fork)',
  8: 'Level 3: Two Doors (the garden)',
  9: 'Level 3: Two Doors (the attic)',
};
await writeSimWalkthrough('room-to-room', sim, SEED, titles);
