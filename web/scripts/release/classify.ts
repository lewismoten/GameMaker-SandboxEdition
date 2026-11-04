// Sorts commits into changelog sections and groups them by their "Area:" prefix. Pure: the git
// reading is in git.ts, so tests use made-up commits.
export interface Commit {
  hash: string;
  subject: string;
  files: string[];
}
export type Kind = 'Added' | 'Changed' | 'Fixed' | 'Removed';
export const KINDS: Kind[] = ['Added', 'Changed', 'Fixed', 'Removed'];

/** Added / Changed / Fixed / Removed from the words of a subject (after any "Area:" prefix). */
export function classify(subject: string): Kind {
  const s = subject.replace(/^[^:]{1,40}:\s+/, '').toLowerCase();
  if (/\b(fix|fixed|fixes|no longer|crash|crashes|bug|wrong|broken)\b/.test(s)) return 'Fixed';
  if (/^(remove|removed|removes|drop|dropped|drops|delete|deleted)\b/.test(s) || /\b(removed|dropped)\b/.test(s)) return 'Removed';
  if (/^(add|adds|added|new)\b/.test(s) || /\b(now has|new)\b/.test(s)) return 'Added';
  return 'Changed';
}

/** "Tune-Up" from "Tune-Up: ..." (a prefix of at most 40 characters), or '' when there is none. */
export function areaOf(subject: string): string {
  const m = /^([A-Za-z][^:]{0,39}):\s/.exec(subject);
  return m ? m[1] : '';
}

const docsFile = (f: string) => /\.md$/.test(f) || f.startsWith('docs/') || f.startsWith('.for-lewis/');
const testFile = (f: string) => /\.test\.[tj]s$/.test(f) || f.startsWith('web/test/');

/** Secret-game ids found in a game folder path. */
function touchesSecret(files: string[], secretIds: string[]): boolean {
  return files.some((f) => {
    const m = /^games\/([^/]+)\//.exec(f);
    return !!m && secretIds.includes(m[1]);
  });
}

export interface Filters {
  /** Full hashes from .git-blame-ignore-revs. */
  formatOnly: string[];
  /** Ids and titles of games whose about.json says secret. */
  secretIds: string[];
  secretNames: string[];
}

/** Why a commit stays out of a draft ('' when it stays in). Secret games are always left out: the notes are public. */
export function skipReason(c: Commit, f: Filters): string {
  const subject = c.subject.toLowerCase();
  if (touchesSecret(c.files, f.secretIds)) return 'secret game';
  if (f.secretNames.some((n) => n && subject.includes(n.toLowerCase()))) return 'secret game';
  if (f.secretIds.some((id) => new RegExp(`\\b${id}\\b`).test(subject))) return 'secret game';
  if (f.formatOnly.some((h) => h === c.hash || h.startsWith(c.hash))) return 'formatting';
  if (/^(format|prettier)\b/i.test(c.subject)) return 'formatting';
  if (/^merge\b/i.test(c.subject)) return 'merge';
  if (c.files.length && c.files.every(testFile)) return 'tests only';
  if (c.files.length && c.files.every(docsFile)) return 'docs only';
  if (/^(AGENTS|CLAUDE)\b/.test(c.subject) || /\bagent notes?\b/i.test(c.subject)) return 'agent notes';
  return '';
}

/** One line per area for the draft: the first subject, and a count when the area has more. */
export function groupCommits(commits: Commit[]): Record<Kind, string[]> {
  const out: Record<Kind, string[]> = { Added: [], Changed: [], Fixed: [], Removed: [] };
  const byArea = new Map<string, Commit[]>();
  for (const c of commits) {
    const key = areaOf(c.subject) ? `${classify(c.subject)}|${areaOf(c.subject)}` : `${classify(c.subject)}|#${c.hash}`;
    byArea.set(key, [...(byArea.get(key) ?? []), c]);
  }
  for (const [key, list] of byArea) {
    const kind = key.split('|')[0] as Kind;
    // git log lists newest first; the oldest subject reads as the start of the story
    const first = list[list.length - 1].subject.replace(/\s+/g, ' ').trim();
    out[kind].push(list.length > 1 ? `${first} (${list.length} commits)` : first);
  }
  return out;
}

/** The draft Unreleased body, a section per kind that has lines. */
export function renderDraft(groups: Record<Kind, string[]>): string {
  return KINDS.filter((k) => groups[k].length)
    .map((k) => `### ${k}\n\n${groups[k].map((l) => `- ${l}`).join('\n')}`)
    .join('\n\n');
}
