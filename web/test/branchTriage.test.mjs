// Cached branch ancestry, patch equivalence, conflicts and dirty worktrees in disposable repos.
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { triage } from '../../scripts/branch-triage.mjs';
import { git } from '../../scripts/repo-command.mjs';
import { change, fixture } from './repoWorkflowFixtures.mjs';

const fixtures = [];
afterEach(() => {
  for (const f of fixtures.splice(0)) rmSync(f.dir, { recursive: true, force: true });
});

it('lists only unmerged remote features with conflict and worktree state', () => {
  const f = fixture();
  fixtures.push(f);
  change(f.root, 'feature/conflict', 'code.js', '// worker\n');
  change(f.root, 'feature/equivalent', 'new.txt', 'same patch\n');
  git(f.root, 'switch', 'develop');
  git(f.root, 'cherry-pick', 'feature/equivalent');
  writeFileSync(join(f.root, 'code.js'), '// develop\n');
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-m', 'develop moves');
  git(f.root, 'push', 'origin', 'develop');
  change(f.root, 'feature/active', 'active.txt', 'active\n');
  writeFileSync(join(f.root, 'active.txt'), 'dirty\n');
  const report = triage(f.root, Date.now() + 3 * 86400000);
  const branches = Object.fromEntries(report.branches.map((b) => [b.branch, b]));
  expect(branches['origin/feature/conflict']).toMatchObject({ ahead: 1, behind: 2, conflict: 'conflict', alreadyOnDevelop: 'no', ageDays: 3 });
  expect(branches['origin/feature/active']).toMatchObject({ conflict: 'clean', ahead: 1, behind: 0 });
  expect(branches['origin/feature/active'].worktrees[0].dirty).toBe(true);
  expect(git(f.root, 'status', '--porcelain')).toMatch(/active.txt/);
});

it('detects cherry-picked work independently of commit ancestry', () => {
  const f = fixture();
  fixtures.push(f);
  change(f.root, 'feature/done', 'done.txt', 'done\n');
  git(f.root, 'switch', 'develop');
  writeFileSync(join(f.root, 'other.txt'), 'different parent\n');
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-m', 'other');
  git(f.root, 'cherry-pick', 'feature/done');
  git(f.root, 'push', 'origin', 'develop');
  const report = triage(f.root);
  expect(report.branches[0].alreadyOnDevelop).toBe('patch-equivalent');
  git(f.root, 'merge', '--no-ff', 'feature/done', '-m', 'record ancestry');
  git(f.root, 'push', 'origin', 'develop');
  expect(triage(f.root).branches).toEqual([]);
});
