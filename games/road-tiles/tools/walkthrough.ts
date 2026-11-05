// Writes games/road-tiles/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment for each level), and games/kit/walkthrough.ts
// checks the run on the real engine (title, the three levels, the ending).
//   cd web && npx vite-node ../games/road-tiles/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Round Corners',
  3: 'Level 2: Diagonals',
  4: 'Level 3: Road and Ground',
};
await writeSimWalkthrough('road-tiles', sim, SEED, titles);
