// How levelCheck.ts words and sorts the Level check's findings for the command line: a problem or
// a warning not yet looked at fails the check (it is a fact the tool measured), while a suggestion
// (a warning from a taste check, web/src/editor/check/findings.ts kindOf) is advice an author can
// dismiss, so it is printed and never fails the build. Infos are left out. The tool can't see
// whether a choice is on purpose: accepting a finding in about.json "acceptedFindings" silences it.
import { kindOf, type Finding } from '../../web/src/editor/check/findings';

/** A finding as one baseline line: severity, check, scene and title. */
export const lineOf = (f: Finding): string => `${f.severity} ${f.check} s${f.where.scene ?? '-'} ${f.title}`;

/** The open findings as sorted lines: `hard` fail a check that is new, `advice` (suggestions) never do. */
export function splitLines(open: Finding[]): { hard: string[]; advice: string[] } {
  const keep = open.filter((f) => f.severity !== 'info');
  const lines = (list: Finding[]) => [...new Set(list.map(lineOf))].sort();
  return { hard: lines(keep.filter((f) => kindOf(f) !== 'suggestion')), advice: lines(keep.filter((f) => kindOf(f) === 'suggestion')) };
}
