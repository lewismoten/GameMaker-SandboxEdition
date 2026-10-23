// Checks the built disk: the multi-block objects (tools/align.ts). The bot's full play-through
// is tools/walkthrough.ts.
//   cd web && npx vite-node ../games/snowbound/tools/check.ts
import { align } from './align';

if (align()) throw new Error('snowbound: a multi-block object is out of line (above)');
