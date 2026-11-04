// Writes games/meet-the-monsters/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, both levels, the ending).
//   cd web && npx vite-node ../games/meet-the-monsters/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Walk and Hurt',
  3: 'Level 2: Bonk and Lives',
};
await writeSimWalkthrough('meet-the-monsters', sim, SEED, titles);
