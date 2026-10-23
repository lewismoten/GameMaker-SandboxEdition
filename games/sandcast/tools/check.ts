// Checks the built disk: the multi-block objects (tools/align.ts). The bot's full play-through
// is tools/walkthrough.ts.
//   cd web && npx vite-node ../games/sandcast/tools/check.ts
import { align } from './align';

if (align()) throw new Error('sandcast: a multi-block object is out of line (above)');
