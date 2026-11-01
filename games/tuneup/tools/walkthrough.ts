// Writes games/tuneup/walkthrough.json: the bot plays the whole game on the built disk, and
// games/kit/walkthrough.ts checks the run on the real engine (the title, every level, the ending).
//   cd web && npx vite-node ../games/tuneup/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Piano Shop',
  3: 'Level 2: The Player Piano',
  4: 'The Bandstand',
  5: "Level 3: The Music Store's Back Room",
  6: 'The Bandstand Again',
  7: 'Level 6: The Arcade',
  8: 'The Bandstand Again',
  9: 'Level 7: The Roller Rink',
  10: 'The Bandstand Again',
  11: 'Level 8: The Marching Field',
  12: 'The Bandstand Again',
  13: 'Level 9: The Woods by the River',
  14: 'The Bandstand Again',
};
await writeSimWalkthrough('tuneup', sim, SEED, titles);
