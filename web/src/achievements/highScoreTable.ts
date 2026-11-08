// One game's DOS high-score table (.his) read for All Mine: ten complete records, one name.
// Apart from highScores.ts so a page counting achievements loads the reader only for a save that has a table.
import { HIGH_SCORES, parseHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';

/** The parser pads short files; only ten complete, displayed, named records qualify. */
export function wholeTable(bytes?: Uint8Array): string | undefined {
  if (!bytes || bytes.length < HIGH_SCORES * 34) return;
  const rows = parseHighScores(bytes);
  const name = rows[0].name.trim().toLowerCase();
  // Zero scores and blank names are the format's placeholders. No name is reserved.
  if (!name || !rows.every((r) => r.score !== 0 && r.name.trim().toLowerCase() === name)) return;
  return JSON.stringify(rows);
}
