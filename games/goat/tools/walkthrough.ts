// Writes games/goat/walkthrough.json: the bot plays the whole game on the built disk (one
// key segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts
// checks the run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/goat/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: "Level 1: The Shepherds' Field", 3: 'Level 2: Bethlehem', 4: 'Level 3: The Caravan', 5: 'Level 4: The Stable' };
await writeSimWalkthrough('goat', sim, SEED, titles);
