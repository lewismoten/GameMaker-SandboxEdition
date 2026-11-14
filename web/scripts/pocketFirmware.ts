// Downloads the pinned Pocket Player firmware into web/public/pocket/fw/<board>/ for the production (gh-pages) build.
// The images are GitHub Release assets of lewismoten/gamemaker-pocket (made by its scripts/release_fw.py); pocketFirmware.json
// pins the release tag and each file's sha256 and size. A file already there with the right hash is kept; a wrong hash or
// size, a failed download or a missing file stops with exit 1. Not part of `npm ci`, dev or tests.
//   npx vite-node scripts/pocketFirmware.ts            download what is missing, verify everything
//   npx vite-node scripts/pocketFirmware.ts --check    verify only; exit 1 if anything is missing or wrong
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

interface Entry {
  board: string;
  file: string;
  asset: string;
  sha256: string;
  size: number;
}
const pin = JSON.parse(readFileSync(new URL('./pocketFirmware.json', import.meta.url), 'utf8')) as { repo: string; tag: string; files: Entry[] };
const dest = (e: Entry) => new URL(`../public/pocket/fw/${e.board}/${e.file}`, import.meta.url);
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const checkOnly = process.argv.includes('--check');
let bad = 0;

for (const e of pin.files) {
  const path = dest(e);
  const label = `${e.board}/${e.file}`;
  if (existsSync(path) && sha(readFileSync(path)) === e.sha256) {
    console.log(`ok       ${label}`);
    continue;
  }
  if (checkOnly) {
    console.error(`MISSING or WRONG  ${label}`);
    bad++;
    continue;
  }
  const url = `https://github.com/${pin.repo}/releases/download/${pin.tag}/${e.asset}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length !== e.size) throw new Error(`size ${bytes.length}, pinned ${e.size}`);
    const got = sha(bytes);
    if (got !== e.sha256) throw new Error(`sha256 ${got}, pinned ${e.sha256}`);
    mkdirSync(dirname(path.pathname), { recursive: true });
    writeFileSync(path, bytes);
    console.log(`fetched  ${label}`);
  } catch (err) {
    console.error(`FAILED   ${label} from ${url}: ${err instanceof Error ? err.message : String(err)}`);
    bad++;
  }
}
if (bad) {
  console.error(`Pocket firmware: ${bad} file(s) not usable. The release ${pin.tag} must exist on ${pin.repo} (scripts/release_fw.py --publish there).`);
  process.exit(1);
}
console.log(`Pocket firmware ${pin.tag}: ${pin.files.length} files verified.`);
