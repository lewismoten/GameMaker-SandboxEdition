// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/graduation-diploma/tools/check.ts   (BOT_LOG=1 prints every step)

import { graduationCheck } from '../../kit/starter/graduationTools';
import { cfg } from '../src/config';
import { buildLevels } from '../src/levels';
import { play } from './play';

await graduationCheck(cfg.id, buildLevels(), play);
