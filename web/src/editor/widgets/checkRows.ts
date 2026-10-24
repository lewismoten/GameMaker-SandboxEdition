// The Level check's findings as a checklist to fix: one row a finding (its kind, check, place,
// words, why it matters, the guide's section and whether it is still open, accepted, or kept
// on purpose), grouped by kind as the panel names them (findings.ts kindOf), and as a CSV file
// with every field quoted as spreadsheets expect. The report dialog (checkReport.ts) shows the
// groups, downloads the CSV and prints the checklist from them.
import { CHECKS, kindOf, sortFindings, type CheckInfo, type Finding, type Kind } from '../check/findings';
import { findingKey } from '../check/accepted';
import { GUIDE_TITLES } from './guideLink';

export type RowStatus = 'open' | 'accepted' | 'that’s on purpose';

export interface FindingRow {
  kind: Kind;
  finding: Finding;
  status: RowStatus;
}

/** How the panel, the report and the files name each kind, in the order they are listed. */
export const KINDS: Kind[] = ['error', 'warning', 'suggestion', 'info'];
export const KIND_LABEL: Record<Kind, string> = { error: 'Problem', warning: 'Warning', suggestion: 'Suggestion', info: 'Note' };
export const KIND_PLURAL: Record<Kind, string> = { error: 'Problems', warning: 'Warnings', suggestion: 'Suggestions', info: 'Notes' };

/** Each finding with its kind and status (an accepted taste finding is “that’s on purpose”). */
export function findingRows(findings: Finding[], accepted: Iterable<string>): FindingRow[] {
  const keys = new Set(accepted);
  return sortFindings(findings).map((f) => {
    const on = keys.has(findingKey(f));
    const taste = !!(CHECKS[f.check] as CheckInfo).taste;
    return { kind: kindOf(f), finding: f, status: !on ? 'open' : taste ? 'that’s on purpose' : 'accepted' };
  });
}

/** The rows by kind, problems first; kinds with no rows are left out. */
export function groupRows(rows: FindingRow[]): { kind: Kind; rows: FindingRow[] }[] {
  return KINDS.map((kind) => ({ kind, rows: rows.filter((r) => r.kind === kind) })).filter((g) => g.rows.length);
}

/** The cell a finding is at (its first, for one spread over several). */
export const cellOf = (f: Finding): number | undefined => f.where.cell ?? f.where.cells?.[0];

/** "Levels Players Forgive: Never trap the player". */
export const guideSection = (f: Finding): string => {
  const g = CHECKS[f.check].guide;
  return `${GUIDE_TITLES[g.chapter]}: ${g.section}`;
};

export const CSV_COLUMNS = ['kind', 'check', 'scene', 'map', 'x', 'y', 'title', 'detail', 'why', 'guide section', 'status'] as const;

/** One field of a CSV line: always quoted, quotes doubled (RFC 4180), so commas and line breaks stay in it. */
export const csvField = (v: string | number | undefined): string => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** The rows as CSV (CRLF line ends, a header line first). A finding with no map gets `map` (the map the report is of), if given. */
export function toCsv(rows: FindingRow[], map?: string): string {
  const lines = [CSV_COLUMNS.map(csvField).join(',')];
  for (const { kind, finding: f, status } of rows) {
    const cell = cellOf(f);
    lines.push(
      [
        KIND_LABEL[kind].toLowerCase(),
        CHECKS[f.check].name,
        f.where.scene,
        f.where.map ?? map ?? f.where.file ?? f.where.block?.file ?? f.where.monster?.file ?? f.where.sound?.file,
        cell === undefined ? '' : cell % 100,
        cell === undefined ? '' : Math.floor(cell / 100),
        f.title,
        f.detail,
        CHECKS[f.check].why,
        guideSection(f),
        status,
      ]
        .map(csvField)
        .join(','),
    );
  }
  return lines.join('\r\n') + '\r\n';
}

/** A file name part from a game's or map's name: "DESERT.MAP" → "desert". */
const part = (s: string) =>
  s
    .replace(/\.[^.]*$/, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'game';

/** "<game>-<map>-level-check.csv", or "<game>-level-check.csv" for every map at once. */
export const csvName = (game: string, map?: string) => `${part(game)}${map ? `-${part(map)}` : ''}-level-check.csv`;
