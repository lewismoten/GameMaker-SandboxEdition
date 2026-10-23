// Writes games/tickle/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/tickle/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Course', 3: 'Level 2: The Lab', 4: 'Level 3: The Sewers', 5: 'Level 4: The Empire' };
await writeSimWalkthrough('tickle', sim, SEED, titles, {});
