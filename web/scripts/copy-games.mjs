// Copies the free "gameware" sample games from the original GameMaker CD image
// into public/games so the web app can offer them, and writes an index.json catalog.
import { readdirSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../cd/gameware');
const target = resolve(here, '../public/games');

// Files that only matter to DOS (executables, batch files, icons).
const skip = /\.(exe|bat|com|ico|bak|drv)$/i;

function cString(bytes) {
  const end = bytes.indexOf(0);
  return new TextDecoder('latin1').decode(end < 0 ? bytes : bytes.subarray(0, end)).trim();
}

function gameTitle(gam) {
  const isV3 = gam[0] === 0x47 && gam[1] === 0x4d; // "GM" header
  // v3: 256 byte header + 6 byte grator header + scene0 { type 2, pos 4, scroll 16, links 1 } -> desc[20]
  return isV3 ? cString(gam.subarray(285, 305)) : cString(gam.subarray(6, 21));
}

if (!existsSync(source)) {
  console.warn(`copy-games: ${source} not found, skipping sample games`);
  process.exit(0);
}

const catalog = [];
for (const dir of readdirSync(source).sort()) {
  const from = join(source, dir);
  if (!statSync(from).isDirectory()) continue;
  const id = dir.toLowerCase();
  const to = join(target, id);
  mkdirSync(to, { recursive: true });
  const files = [];
  for (const name of readdirSync(from).sort()) {
    if (skip.test(name)) continue;
    const lower = name.toLowerCase();
    copyFileSync(join(from, name), join(to, lower));
    files.push(lower);
  }
  const gamFile = files.find((f) => f.endsWith('.gam')) ?? null;
  const title = gamFile ? gameTitle(readFileSync(join(to, gamFile))) || id : `${id} (asset library)`;
  catalog.push({ id, title, gam: gamFile, files });
}

writeFileSync(join(target, 'index.json'), JSON.stringify(catalog, null, 1));
console.log(`copy-games: ${catalog.length} folders -> public/games`);
