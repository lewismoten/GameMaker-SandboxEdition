// Checks that every game whose disk/ changed since the last push to master has a higher version in
// its about.json than it had there (the rule is in versions.ts). The last push is
// `git merge-base HEAD origin/master`, else the local master; with neither (a checkout without
// git history, or master itself in CI) it skips with a note. Exits 1 when a game needs a bump.
//
//   cd web && npx vite-node ../games/kit/versionCheck.ts [<id>...]   (no ids: every game)
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versionProblems, type VersionSource } from './versions';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(gamesDir, '..');

function git(...args: string[]): { ok: boolean; out: string } {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
  return { ok: r.status === 0, out: (r.stdout ?? '').trim() };
}

/** The commit of the last push to master, or undefined when there is none to compare with. */
function lastPush(): string | undefined {
  for (const ref of ['origin/master', 'master']) {
    const r = git('merge-base', 'HEAD', ref);
    if (r.ok && r.out) return r.out;
  }
  return undefined;
}

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(gamesDir)
      .filter((id) => existsSync(join(gamesDir, id, 'about.json')))
      .sort();

const base = lastPush();
if (!base) {
  console.log('versions: skipped (no master to compare with: no git history here)');
  process.exit(0);
}

const src: VersionSource = {
  version: (id) => (JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as { version?: string }).version,
  baseAbout: (id) => {
    const r = git('show', `${base}:games/${id}/about.json`);
    return r.ok ? (JSON.parse(r.out) as { version?: string }) : undefined;
  },
  changed: (id) => {
    const disk = `games/${id}/disk`;
    const tracked = spawnSync('git', ['diff', '--quiet', base, '--', disk], { cwd: root }).status !== 0;
    return tracked || !!git('ls-files', '--others', '--exclude-standard', '--', disk).out;
  },
};

const problems = versionProblems(ids, src);
for (const p of problems) console.log(p);
console.log(`versions: ${problems.length ? `${problems.length} to bump` : 'ok'} (against ${base.slice(0, 9)}, the last push to master)`);
process.exit(problems.length ? 1 : 0);
