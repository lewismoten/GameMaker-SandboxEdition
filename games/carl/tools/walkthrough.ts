// Writes games/carl/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all six levels, the ending, the credits).
//   cd web && npx vite-node ../games/carl/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Couch', 3: 'Level 2: The Walls', 4: 'Level 3: Joins Me in Bed', 5: 'Level 4: The Open Window', 6: 'Level 5: Carl Has Seen Things', 7: 'Level 6: The Aux Cord' };
await writeSimWalkthrough('carl', sim, SEED, titles);
