// The high-score file (<game>.his: ten { long score; char name[30]; }, code/GM/HISCOREL.C) for
// the save editors. Unlike formats/highscore.ts this keeps each name's original 30 bytes, so a
// table read and written back is byte for byte the file it came from, and an edit changes only
// the entries edited.
import { cString } from '../../formats/binary';
import { HIGH_SCORES, type HighScore } from '../../formats/highscore';

export { HIGH_SCORES, type HighScore };

const NAME_BYTES = 30;
const RECORD = 4 + NAME_BYTES;
/** The longest name PLAYGAME's "Enter Your Name:" takes (CheckHighScores' gGet). */
export const HIGH_SCORE_NAME_MAX = 22;
export const SCORE_MIN = -2147483648;
export const SCORE_MAX = 2147483647;

export interface HighScoreTable {
  entries: HighScore[];
  /** The file it was read from (to keep unedited names' bytes). */
  raw?: Uint8Array;
}

/** The game's high-score file name: its .gam's name with .his (engine/menus.ts highScoreFile). */
export function highScoreFileName(gam: string): string {
  return `${gam.replace(/\.[^.]*$/, '').toLowerCase()}.his`;
}

/** The high-score file among a game's save files, if one was written. */
export function findHighScoreFile(files: Record<string, Uint8Array>, gam?: string): string | undefined {
  const want = gam ? highScoreFileName(gam) : undefined;
  const names = Object.keys(files);
  return names.find((n) => n.toLowerCase() === want) ?? names.find((n) => /\.his$/i.test(n));
}

export function parseHighScoreTable(bytes: Uint8Array | undefined): HighScoreTable {
  const entries: HighScore[] = [];
  for (let i = 0; i < HIGH_SCORES; i++) {
    const at = i * RECORD;
    const dv = bytes && bytes.length >= at + 4 ? new DataView(bytes.buffer, bytes.byteOffset + at, 4) : undefined;
    entries.push({ score: dv ? dv.getInt32(0, true) : 0, name: bytes ? cString(bytes.subarray(at + 4, at + RECORD)) : '' });
  }
  return { entries, raw: bytes };
}

export function serializeHighScoreTable(table: HighScoreTable): Uint8Array {
  const out = new Uint8Array(HIGH_SCORES * RECORD);
  const raw = table.raw;
  if (raw) out.set(raw.subarray(0, out.length));
  const before = raw ? parseHighScoreTable(raw).entries : undefined;
  const dv = new DataView(out.buffer);
  for (let i = 0; i < HIGH_SCORES; i++) {
    const e = table.entries[i] ?? { score: 0, name: '' };
    const at = i * RECORD;
    dv.setInt32(at, Math.trunc(Math.min(SCORE_MAX, Math.max(SCORE_MIN, e.score))), true);
    if (before && before[i].name === e.name) continue;
    out.fill(0, at + 4, at + RECORD);
    for (let c = 0; c < Math.min(NAME_BYTES - 1, e.name.length); c++) out[at + 4 + c] = e.name.charCodeAt(c) & 0xff;
  }
  return out;
}

/** Highest first, as CheckHighScores keeps them (a tie keeps the earlier one first). */
export function sortHighScores(entries: HighScore[]): HighScore[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.score - a.e.score || a.i - b.i)
    .map(({ e }) => e);
}

/** An empty table (what a game with no .his starts from). */
export function emptyHighScores(): HighScoreTable {
  return { entries: Array.from({ length: HIGH_SCORES }, () => ({ score: 0, name: '' })) };
}

/** Warnings about one entry (empty when fine). */
export function highScoreWarnings(e: HighScore): string[] {
  const out: string[] = [];
  if (e.score === 0 && e.name) out.push('A score of 0 is not shown on the Top Ten screen.');
  if (e.score < 0) out.push('Below 0: every new score beats it.');
  if (e.name.length > HIGH_SCORE_NAME_MAX) out.push(`Longer than the ${HIGH_SCORE_NAME_MAX} letters the game lets a player type (the file holds 29).`);
  if (/[^\x20-\x7e]/.test(e.name)) out.push('Only plain letters, digits and marks show on the DOS screen.');
  if (e.score < -999_999_999) out.push('Wider than the 10 columns the table gives a score.');
  return out;
}
