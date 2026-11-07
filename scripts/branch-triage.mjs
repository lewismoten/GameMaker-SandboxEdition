// Report cached unmerged remote features; merge-tree writes objects only to temporary storage.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { command, git, mainModule, repository } from './repo-command.mjs';

export function triage(cwd, now = Date.now()) {
  const { root } = repository(cwd);
  const base = git(root, 'rev-parse', '--verify', 'origin/develop^{commit}');
  const worktrees = git(root, 'worktree', 'list', '--porcelain')
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const fields = Object.fromEntries(
        block.split('\n').map((line) => {
          const i = line.indexOf(' ');
          return i < 0 ? [line, true] : [line.slice(0, i), line.slice(i + 1)];
        }),
      );
      const state = command(fields.worktree, ['git', 'status', '--porcelain']);
      return {
        path: fields.worktree,
        branch: fields.branch ?? null,
        revision: fields.HEAD,
        locked: fields.locked ?? false,
        prunable: fields.prunable ?? false,
        dirty: state.code === 0 ? !!state.stdout : null,
        error: state.code === 0 ? null : state.stderr,
      };
    });
  const objects = mkdtempSync(join(tmpdir(), 'branch-triage-'));
  try {
    const alternate = resolve(root, git(root, 'rev-parse', '--git-path', 'objects'));
    const refs = git(
      root,
      'for-each-ref',
      '--no-merged=origin/develop',
      '--format=%(refname:short)%09%(objectname)%09%(committerdate:unix)%09%(authorname)',
      'refs/remotes/origin/feature/',
    );
    const branches = refs
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [branch, revision, timestamp, author] = line.split('\t');
        const [behind, ahead] = git(root, 'rev-list', '--left-right', '--count', `${base}...${revision}`).split(/\s+/).map(Number);
        const cherry = git(root, 'cherry', base, revision);
        const patchEquivalent = !!cherry && cherry.split('\n').every((line) => line.startsWith('- '));
        const sameTree = git(root, 'rev-parse', `${base}^{tree}`) === git(root, 'rev-parse', `${revision}^{tree}`);
        const merged = command(root, ['git', 'merge-tree', '--write-tree', base, revision], {
          env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_OBJECT_DIRECTORY: objects, GIT_ALTERNATE_OBJECT_DIRECTORIES: alternate },
        });
        return {
          branch,
          revision,
          ageDays: Math.max(0, Math.floor((now - Number(timestamp) * 1000) / 86400000)),
          ahead,
          behind,
          author,
          owner: 'unknown (author is not task ownership)',
          alreadyOnDevelop: sameTree ? 'identical-tree' : patchEquivalent ? 'patch-equivalent' : 'no',
          conflict: merged.code === 0 ? 'clean' : merged.code === 1 ? 'conflict' : 'unknown',
          conflictDetails: merged.code === 0 ? '' : merged.stdout + merged.stderr,
          worktrees: worktrees.filter((w) => w.branch === `refs/heads/${branch.slice('origin/'.length)}` || w.revision === revision),
        };
      });
    return {
      version: 1,
      baseRevision: base,
      inventory: 'cached origin refs; fetch before running for current remote state',
      branches,
      worktrees,
      next: 'Run npm run already -- <task words> before briefing duplicate work. Ownership requires the task record; this command never deletes branches.',
    };
  } finally {
    rmSync(objects, { recursive: true, force: true });
  }
}

if (mainModule(import.meta.url)) {
  try {
    if (process.argv.length > 2) throw new Error('usage: npm run branches:triage');
    process.stdout.write(`${JSON.stringify(triage(process.cwd()), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
