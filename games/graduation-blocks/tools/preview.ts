// Design previews (never on the disk): the block sheet, the hero's poses, the monsters, the hall's whole map and every picture
// on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/graduation-blocks/tools/preview.ts [outDir]
import { graduationPreview } from '../../kit/starter/graduationPreview';
import { buildLevels } from '../../kit/starter/graduationLevel';
import { cfg } from '../src/config';

graduationPreview(cfg.id, new URL('../', import.meta.url), buildLevels(cfg));
