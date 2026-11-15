// What a person's play leaves in a rebuilt DOS folder, and the backup helpers `dosbox.ts` uses so
// nothing is lost when the folder is emptied: PLAYED files are copied back in; anything else a person
// changed or added (a game made in Game-Maker there) is copied to a timestamped folder, never deleted.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * PLAYGAME/PLAYBACK write these: CONFIG.DAT (setup), GAME0-9.SAV and SAVNAMES.DAT (code/GM/PLAYGAME.C),
 * <game>.SAV (PLAYBACK.C's save) and <game>.HIS (HISCOREL.C's high scores).
 */
export const PLAYED = /^(config\.dat|game\d\.sav|savnames\.dat|.*\.sav|.*\.his)$/i;

/** `2026-11-14-03-05-09`: sorts by time and is a valid folder name everywhere. */
export function stamp(date = new Date()): string {
  return date.toISOString().replace(/[:T]/g, '-').slice(0, 19);
}

/** Every file under `dir` (relative path, upper-cased compare is the caller's job), for those `want` accepts. */
export function readTree(dir: string, want: (name: string, rel: string) => boolean = () => true, rel = ''): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const r = join(rel, name);
    if (statSync(path).isDirectory()) for (const [k, v] of readTree(path, want, r)) out.set(k, v);
    else if (want(name, r)) out.set(r, readFileSync(path));
  }
  return out;
}

/** Writes each file under `to`, never overwriting one already there (a clash gets a numbered name). Returns the count. */
export function copyOut(files: Map<string, Buffer>, to: string): number {
  for (const [rel, data] of files) {
    let path = join(to, rel);
    for (let n = 1; existsSync(path); n++) path = join(to, `${rel}.${n}`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  }
  return files.size;
}

/** What `dosbox.ts` writes itself each run: not a person's edit. */
const GENERATED = /^(DOSBOX\.command|\.gm-dosbox)$/;

/** Old files that the new build lacks or changed (not PLAYED ones, which are put back): a person's own edits. */
export function editedFiles(old: Map<string, Buffer>, fresh: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  for (const [rel, data] of old) {
    if (PLAYED.test(rel.split(/[\\/]/).pop() ?? rel) || GENERATED.test(rel)) continue;
    const path = join(fresh, rel);
    if (!existsSync(path) || !readFileSync(path).equals(data)) out.set(rel, data);
  }
  return out;
}
