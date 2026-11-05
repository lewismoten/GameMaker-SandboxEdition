// Writes games/kits-shop/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the level, the ending).
//   cd web && npx vite-node ../games/kits-shop/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: "Level 1: Kit's Shop",
};
await writeSimWalkthrough('kits-shop', sim, SEED, titles);
