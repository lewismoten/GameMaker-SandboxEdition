// Writes src/seo/magazineText.json: TURBO BUTTON's words as plain text (manual/magazine/staticText.ts),
// which scripts/seoStaticPages.ts turns into magazine.html. Run it after the magazine's words or the
// game catalog change: npx vite-node scripts/magazineText.ts (magazineText.test.ts says when).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { magazineText } from '../src/manual/magazine/staticText';
import { cdCatalog } from './cdGames';

const root = join(__dirname, '../..');
const text = await magazineText(cdCatalog(join(root, 'cd')));
writeFileSync(join(__dirname, '../src/seo/magazineText.json'), `${JSON.stringify(text, null, 1)}\n`);
console.log('wrote src/seo/magazineText.json');
