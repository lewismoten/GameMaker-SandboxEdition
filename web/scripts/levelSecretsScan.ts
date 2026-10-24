// Node only (scripts/levelSecrets.ts and its test): every game that may show Level Maps, read
// from games/<id>/about.json and its built disk, with the blocks its maps must hide
// (src/manual/printables/levelSecrets.ts). Secret games are left out altogether.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame } from '../src/formats/game';
import { mayShowLevelMaps, secretBlocksOf, type AboutForSecrets, type SecretBlocks } from '../src/manual/printables/levelSecrets';

export function scanLevelSecrets(gamesDir: string): Record<string, SecretBlocks> {
  const out: Record<string, SecretBlocks> = {};
  for (const id of readdirSync(gamesDir).sort()) {
    const aboutFile = join(gamesDir, id, 'about.json');
    const disk = join(gamesDir, id, 'disk');
    if (!existsSync(aboutFile) || !existsSync(disk)) continue;
    const about = JSON.parse(readFileSync(aboutFile, 'utf8')) as AboutForSecrets;
    if (!mayShowLevelMaps(about)) continue;
    const files = new Map(readdirSync(disk).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(disk, n)))]));
    const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
    if (!gam) continue;
    out[id] = secretBlocksOf(parseGame(files.get(gam)!), { get: (n) => files.get(n.toLowerCase()) }, about);
  }
  return out;
}

/** levelSecrets.json as the script writes it: one game a line. */
export const levelSecretsJson = (s: Record<string, SecretBlocks>): string =>
  `{\n${Object.entries(s)
    .map(([id, v]) => `  ${JSON.stringify(id)}: ${JSON.stringify(v)}`)
    .join(',\n')}\n}\n`;
