// Writes games/around-the-room/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine (title, four levels, the ending).
//   cd web && npx vite-node ../games/around-the-room/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: The Floor',
  3: 'Level 2: The Left Wall',
  4: 'Level 3: The Ceiling',
  5: 'Level 4: The Right Wall',
};
await writeSimWalkthrough('around-the-room', sim, SEED, titles);
