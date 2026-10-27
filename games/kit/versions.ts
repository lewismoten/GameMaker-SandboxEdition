// The rule for a game's version (about.json "version", "major.minor"): once its disk/ differs from
// the last push to master, its version must be higher than the one there. Major for new, removed or
// reordered levels or a big gameplay change; minor otherwise. versionCheck.ts reads git; this file
// only weighs what it is given, so a test can hand it a made-up history.

/** What the check needs to know about one game, here and at the last push to master. */
export interface VersionSource {
  /** Its version in the working tree (about.json), if it has one. */
  version(id: string): string | undefined;
  /** Its about.json at the last push to master: undefined when the game was not there yet. */
  baseAbout(id: string): { version?: string } | undefined;
  /** Whether its disk/ differs from the last push to master (committed or not). */
  changed(id: string): boolean;
}

/** A game's version before about.json had one: every game's text said 1.0. */
const FIRST = '1.0';

/** "major.minor" as two numbers, or undefined when it isn't one. */
function parse(v: string | undefined): [number, number] | undefined {
  const m = /^(\d+)\.(\d+)$/.exec(v ?? '');
  return m ? [Number(m[1]), Number(m[2])] : undefined;
}

/** Below 0 when a is the lower version, 0 when the same, above 0 when higher. */
export function compareVersions(a: string, b: string): number {
  const [pa, pb] = [parse(a), parse(b)];
  if (!pa || !pb) throw new Error(`not a major.minor version: ${pa ? b : a}`);
  return pa[0] - pb[0] || pa[1] - pb[1];
}

const RULE = 'Major (2.0) for new, removed or reordered levels or a big gameplay change; minor (1.1) otherwise.';

/** What is wrong with each game's version, one message each; empty when every game is fine. */
export function versionProblems(ids: string[], src: VersionSource): string[] {
  const problems: string[] = [];
  for (const id of ids) {
    const here = src.version(id);
    if (!parse(here)) {
      problems.push(`${id}: about.json needs "version": "major.minor" (it has ${JSON.stringify(here)})`);
      continue;
    }
    const base = src.baseAbout(id);
    // a game new since the last push starts at whatever version it is given
    if (!base || !src.changed(id)) continue;
    const was = parse(base.version) ? base.version! : FIRST;
    if (compareVersions(here!, was) <= 0) problems.push(`${id}: changed since the last push to master; bump its version (${here} here, ${was} there). ${RULE}`);
  }
  return problems;
}
