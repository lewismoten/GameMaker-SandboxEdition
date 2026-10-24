// Writes src/manual/printables/levelSecrets.json: the blocks each game's printed Level Maps hide
// (its tin heart, Easter egg and felt egg) and, by being listed, which games get Level Maps.
// Rerun after moving a hidden thing; levelSecrets.test.ts fails until you do.
//
//   cd web && npx vite-node scripts/levelSecrets.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { levelSecretsJson, scanLevelSecrets } from './levelSecretsScan';

const out = scanLevelSecrets(join(__dirname, '../../games'));
writeFileSync(join(__dirname, '../src/manual/printables/levelSecrets.json'), levelSecretsJson(out));
console.log(`${Object.keys(out).length} games`);
