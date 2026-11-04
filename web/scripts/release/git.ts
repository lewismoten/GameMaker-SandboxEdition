// Reads git for the release scripts: targets, last tags, commits since, secret games.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Commit, Filters } from './classify';

export interface Target {
  name: string;
  prefix: string;
  /** Repo-relative folder the commits must touch (the site takes all). */
  path: string;
  changelog: string;
  /** Repo-relative package.json that holds the version (packages only). */
  manifest?: string;
}
export const TARGETS: Record<string, Target> = {
  pages: { name: 'pages', prefix: 'pages', path: '', changelog: 'CHANGELOG.md' },
  engine: pkg('engine'),
  archives: pkg('archives'),
  tools: pkg('tools'),
};
function pkg(id: string): Target {
  const dir = `web/packages/${id}`;
  return { name: id, prefix: id, path: dir, changelog: `${dir}/CHANGELOG.md`, manifest: `${dir}/package.json` };
}

export function repoRoot(): string {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });

/** The newest tag of a target ("engine-v3.1.0"), or '' when it has none. */
export function lastTag(root: string, t: Target): string {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', `${t.prefix}-v*`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/** Commits since the last tag (all history with no tag), no merges, newest first. */
export function commitsSince(root: string, t: Target, tag: string): Commit[] {
  const args = ['log', '--no-merges', '--name-only', '--format=%x01%H%x02%s', tag ? `${tag}..HEAD` : 'HEAD'];
  if (t.path) args.push('--', t.path);
  return git(root, ...args)
    .split('\x01')
    .filter(Boolean)
    .map((block) => {
      const [head, ...rest] = block.split('\n');
      const [hash, subject] = head.split('\x02');
      return { hash, subject, files: rest.filter(Boolean) };
    });
}

/** Ids and titles of games whose about.json has "secret": true, and the formatting-only hashes. */
export function filtersFor(root: string): Filters {
  const secretIds: string[] = [];
  const secretNames: string[] = [];
  for (const id of readdirSync(join(root, 'games'))) {
    const file = join(root, 'games', id, 'about.json');
    if (!existsSync(file)) continue;
    const about = JSON.parse(readFileSync(file, 'utf8')) as { secret?: boolean; title?: string };
    if (about.secret !== true) continue;
    secretIds.push(id);
    if (about.title) secretNames.push(about.title, about.title.split(':')[0]);
  }
  const ignore = join(root, '.git-blame-ignore-revs');
  const formatOnly = existsSync(ignore)
    ? readFileSync(ignore, 'utf8')
        .split('\n')
        .filter((l) => /^[0-9a-f]{40}$/.test(l.trim()))
        .map((l) => l.trim())
    : [];
  return { formatOnly, secretIds, secretNames };
}
