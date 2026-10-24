// The editor's Level check (web/src/editor/check), static part only (no playtest), on a game's
// built disk, against a baseline of findings already looked at: only an error or warning that
// is not in levelCheck.baseline.json fails, so known false alarms don't. Infos are not checked.
// A game's about.json "sameEverySide" lists heroes and monsters meant to look the same from
// every side ("ship.chr", "hive.mon#0"), which the facing check leaves alone, as the editor's
// own list does.
//
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id>            new findings exit 1
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id> --update   write <id>'s baseline
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { runChecks } from '../../web/src/editor/check/report';
import { readDisk } from './gameSim';

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, 'levelCheck.baseline.json');

/** One finding as a baseline line: severity, check, scene and title. */
async function staticFindings(id: string): Promise<string[]> {
  const about = join(here, '..', id, 'about.json');
  const same = existsSync(about) ? ((JSON.parse(readFileSync(about, 'utf8')) as { sameEverySide?: string[] }).sameEverySide ?? []) : [];
  const r = await runChecks(new GameFiles(readDisk(join(here, '..', id, 'disk'))), { play: false, sameEverySide: same });
  const lines = r.findings.filter((f) => f.severity !== 'info').map((f) => `${f.severity} ${f.check} s${f.where.scene ?? '-'} ${f.title}`);
  return [...new Set(lines)].sort();
}

function readBaseline(): Record<string, string[]> {
  return existsSync(baselinePath) ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, string[]>) : {};
}

const [id, flag] = process.argv.slice(2);
if (id) {
  const now = await staticFindings(id);
  const base = readBaseline();
  if (flag === '--update') {
    base[id] = now;
    const sorted = Object.fromEntries(
      Object.keys(base)
        .sort()
        .map((k) => [k, base[k]]),
    );
    writeFileSync(baselinePath, JSON.stringify(sorted, null, 1) + '\n');
    console.log(`${id}: ${now.length} findings in the baseline`);
  } else {
    const known = new Set(base[id] ?? []);
    const added = now.filter((l) => !known.has(l));
    const gone = (base[id] ?? []).filter((l) => !now.includes(l)).length;
    for (const l of added) console.log(`${id}: new ${l}`);
    console.log(`${id}: ${now.length} errors and warnings, ${added.length} new${gone ? `, ${gone} gone from the baseline (--update to drop them)` : ''}`);
    process.exit(added.length ? 1 : 0);
  }
}
