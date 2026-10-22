// Design previews (never on the disk): every block set under each of its rooms' palettes,
// and the monster blocks, as PNG sheets in the folder given (default: the scratchpad's).
//   cd web && npx vite-node ../games/bakers/tools/preview.ts [out dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { buildPalette, type ThemeName } from '../src/art/pal';
import { buildTileSet, type Style } from '../src/blocks/tiles';

const out = process.argv[2] ?? join(process.env.TMPDIR ?? '/tmp', 'bakers-preview');
mkdirSync(out, { recursive: true });
const SETS: Record<Style, ThemeName[]> = {
  kitchen: ['pantry', 'bakehouse', 'sugar'],
  cellar: ['larder', 'cellar', 'brewery'],
  parlor: ['parlor', 'tearoom', 'clock', 'hidey'],
  works: ['bottling', 'loft', 'cistern', 'vault'],
};
for (const [style, themes] of Object.entries(SETS) as [Style, ThemeName[]][]) {
  const set = buildTileSet(style);
  const sheet = blockSheet(set.tiles.build().slice(0, set.tiles.names.length), 16);
  for (const th of themes) writePng(join(out, `set-${style}-${th}.png`), sheet, buildPalette(th).pal, 2);
  console.log(`${style}: ${set.tiles.names.length} blocks`);
}
