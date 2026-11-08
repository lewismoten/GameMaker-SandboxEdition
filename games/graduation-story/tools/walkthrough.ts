// Writes games/graduation-story/walkthrough.json: the bot plays the whole game on the built disk, and
// games/kit/walkthrough.ts checks the run on the real engine (title, the aisle, the ending).
//   cd web && npx vite-node ../games/graduation-story/tools/walkthrough.ts
import { graduationWalkthrough } from '../../kit/starter/graduationTools';
import { cfg } from '../src/config';
import { play } from './play';

await graduationWalkthrough(cfg.id, play, { 2: cfg.arrive.title, 3: cfg.level.title });
