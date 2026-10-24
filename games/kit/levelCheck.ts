// The editor's Level check (web/src/editor/check), static part only (no playtest), on a game's
// built disk, against a baseline of findings already looked at: only an error or warning that
// is not in levelCheck.baseline.json fails, so known false alarms don't. Infos are not checked.
// A game's about.json "sameEverySide" lists heroes and monsters meant to look the same from
// every side ("ship.chr", "hive.mon#0"), which the facing check leaves alone, as the editor's
// own list does. Its "acceptedFindings" lists findings the designer looked at and kept on
// purpose, by the editor's stable key (check, scene and title, web/src/editor/check/accepted.ts), e.g.
// "hurt-lock s2 Monster 9 holds the hero while it hurts": they never fail, as in the editor.
//
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id>            new findings exit 1
//   cd web && npx vite-node ../games/kit/levelCheck.ts <id> --update   write <id>'s baseline
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameFiles } from '../../web/src/project/files';
import { runChecks } from '../../web/src/editor/check/report';
import { findingKey, splitAccepted } from '../../web/src/editor/check/accepted';
import { readDisk } from './gameSim';

const here = dirname(fileURLToPath(import.meta.url));
const baselinePath = join(here, 'levelCheck.baseline.json');

interface About {
  sameEverySide?: string[];
  acceptedFindings?: string[];
}

/** Each finding not accepted as a baseline line (severity, check, scene and title), and accepted keys no finding has now. */
async function staticFindings(id: string): Promise<{ lines: string[]; stale: string[] }> {
  const path = join(here, '..', id, 'about.json');
  const about = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as About) : {};
  const r = await runChecks(new GameFiles(readDisk(join(here, '..', id, 'disk'))), { play: false, sameEverySide: about.sameEverySide ?? [] });
  const accepted = about.acceptedFindings ?? [];
  const { open } = splitAccepted(r.findings, accepted);
  const keys = new Set(r.findings.map(findingKey));
  const lines = open.filter((f) => f.severity !== 'info').map((f) => `${f.severity} ${f.check} s${f.where.scene ?? '-'} ${f.title}`);
  return { lines: [...new Set(lines)].sort(), stale: accepted.filter((k) => !keys.has(k)) };
}

function readBaseline(): Record<string, string[]> {
  return existsSync(baselinePath) ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, string[]>) : {};
}

const [id, flag] = process.argv.slice(2);
if (id) {
  const { lines: now, stale } = await staticFindings(id);
  for (const k of stale) console.log(`${id}: about.json accepts "${k}", which is no longer found`);
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
