// The designer's "it's meant to be" list: Level check findings looked at and kept on purpose
// (a foe that holds the hero on a boss stage, a maze meant to confuse). Each is kept by a
// stable key, its check, scene and title, such as "hurt-lock s2 Monster 9 holds the hero
// while it hurts", in the project's companion file (editor-only) on the .gam. The key leaves
// out the title's "first at (x, y)" and what follows its colon (measures that move as the map
// is edited), so an accepted finding stays accepted until it is a different one. The map panel's
// list and counts, the badges and the Before You Upload checklist leave accepted findings out;
// a built game's about.json "acceptedFindings" is the same list (games/kit/levelCheck.ts).
import type { Project } from '../core/project';
import { isHard, type Finding } from './findings';

const SECTION = 'acceptedFindings';

/** A title without the parts that move as the map is edited: "first at (x, y)" and what follows its colon. */
const stableTitle = (title: string): string =>
  title
    .replace(/,? \(?first at \(\d+, \d+\)\)?/g, '')
    .split(/(?<=\S): /)[0]
    .trim();

/** A finding's stable key: its check, scene and title (not its severity, cells or measures, which can change). */
export const findingKey = (f: Pick<Finding, 'check' | 'title' | 'where'>): string => `${f.check} s${f.where.scene ?? '-'} ${stableTitle(f.title)}`;

export const acceptedFindings = (project: Project): string[] => project.extras<string[]>(project.gam, SECTION, []);

/** Accepts (or, with `on` false, un-accepts) a finding by its key. */
export function setAccepted(project: Project, key: string, on = true): void {
  const list = acceptedFindings(project).filter((k) => k !== key);
  if (on) list.push(key);
  project.setExtras(project.gam, SECTION, list.length ? list.sort() : undefined);
}

/**
 * The findings not accepted, and those that are. A hard finding (findings.ts isHard) is never accepted: an old
 * companion that lists one still loads, but the finding stays open, and `reopened` names those so the panel can say why.
 */
export function splitAccepted(findings: Finding[], accepted: Iterable<string>): { open: Finding[]; accepted: Finding[]; reopened: Finding[] } {
  const keys = new Set(accepted);
  const out = { open: [] as Finding[], accepted: [] as Finding[], reopened: [] as Finding[] };
  for (const f of findings) {
    const listed = keys.has(findingKey(f));
    if (listed && isHard(f)) out.reopened.push(f);
    (listed && !isHard(f) ? out.accepted : out.open).push(f);
  }
  return out;
}

/** True when a companion's old accepted list still holds this hard finding (it is shown again, with a note). */
export const wasAcceptedButHard = (f: Finding, accepted: Iterable<string>): boolean => isHard(f) && new Set(accepted).has(findingKey(f));

/** The findings not accepted. */
export const openFindings = (findings: Finding[], accepted: Iterable<string>): Finding[] => splitAccepted(findings, accepted).open;
