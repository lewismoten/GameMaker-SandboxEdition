// Writes src/manual/printables/levelViews.json: the part of each map the player ever sees, which
// the printed Level Maps crop to (levelViewsScan.ts). Slow: it plays every scene from every way
// in. Rerun after changing a game's levels; levelViews.test.ts fails until you do. Give game ids
// to rescan only those.
//
//   cd web && npx vite-node scripts/levelViews.ts [id...]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { levelViewsJson } from './levelViewsScan';
import { scanLevelViews } from './levelViewsPlay';
import type { LevelViews } from '../src/manual/printables/levelViews';

const ids = process.argv.slice(2);
const path = join(__dirname, '../src/manual/printables/levelViews.json');
const fresh = await scanLevelViews(join(__dirname, '../../games'), ids, (s) => console.log(s));
const kept = ids.length && existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as LevelViews) : {};
writeFileSync(path, levelViewsJson({ ...kept, ...fresh }));
console.log(`${Object.keys(fresh).length} games scanned`);
