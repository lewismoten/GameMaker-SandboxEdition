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

/** An accepted entry: a bare key (the old shape) or a key with the reason the author gave. */
export type AcceptedEntry = string | { finding: string; why: string };

/** The finding key of an entry, whichever shape it has. */
export const acceptedKey = (e: AcceptedEntry): string => (typeof e === 'string' ? e : e.finding);

/** The reason an entry carries, or '' when it is a bare key or its reason is blank. */
export const acceptedWhy = (e: AcceptedEntry): string => (typeof e === 'string' ? '' : (e.why ?? '').trim());

/** The keys of a list of entries (a malformed entry is skipped). */
export const acceptedKeys = (list: Iterable<AcceptedEntry>): string[] =>
  [...list].filter((e) => typeof e === 'string' || typeof e?.finding === 'string').map(acceptedKey);

/** The keys of entries that give no reason (advice only: a reason is optional). */
export const entriesWithoutReason = (list: Iterable<AcceptedEntry>): string[] =>
  [...list].filter((e) => acceptedWhy(e) === '' && (typeof e === 'string' || typeof e?.finding === 'string')).map(acceptedKey);

/** The reason kept for a finding key, or ''. */
export const reasonFor = (list: Iterable<AcceptedEntry>, key: string): string => {
  for (const e of list) if (typeof e !== 'string' && e?.finding === key) return acceptedWhy(e);
  return '';
};

export const acceptedFindings = (project: Project): AcceptedEntry[] => project.extras<AcceptedEntry[]>(project.gam, SECTION, []);

/** Accepts (or, with `on` false, un-accepts) a finding by its key; a typed reason is kept with it (the old shape stays when there is none). */
export function setAccepted(project: Project, key: string, on = true, why = ''): void {
  const list = acceptedFindings(project).filter((e) => acceptedKey(e) !== key);
  const reason = why.trim();
  if (on) list.push(reason ? { finding: key, why: reason } : key);
  list.sort((a, b) => acceptedKey(a).localeCompare(acceptedKey(b)));
  project.setExtras(project.gam, SECTION, list.length ? list : undefined);
}

/**
 * The findings not accepted, and those that are. A hard finding (findings.ts isHard) is never accepted: an old
 * companion that lists one still loads, but the finding stays open, and `reopened` names those so the panel can say why.
 */
export function splitAccepted(findings: Finding[], accepted: Iterable<AcceptedEntry>): { open: Finding[]; accepted: Finding[]; reopened: Finding[] } {
  const keys = new Set(acceptedKeys(accepted));
  const out = { open: [] as Finding[], accepted: [] as Finding[], reopened: [] as Finding[] };
  for (const f of findings) {
    const listed = keys.has(findingKey(f));
    if (listed && isHard(f)) out.reopened.push(f);
    (listed && !isHard(f) ? out.accepted : out.open).push(f);
  }
  return out;
}

/** True when a companion's old accepted list still holds this hard finding (it is shown again, with a note). */
export const wasAcceptedButHard = (f: Finding, accepted: Iterable<AcceptedEntry>): boolean => isHard(f) && new Set(acceptedKeys(accepted)).has(findingKey(f));

/** The findings not accepted. */
export const openFindings = (findings: Finding[], accepted: Iterable<AcceptedEntry>): Finding[] => splitAccepted(findings, accepted).open;
