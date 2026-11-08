// Create an isolated worker from fetched develop, clone disks, install matching declarations.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { capabilities } from './worker-capabilities.mjs';
import { cloneDisks } from './worker-disks.mjs';
import { command, git, mainModule, repository } from './repo-command.mjs';

export async function bootstrap(args) {
  const report = { version: 1, started: new Date().toISOString(), status: 'failed', capabilities: await capabilities() };
  try {
    if (args.length === 1 && args[0] === '--doctor') {
      report.status = 'capabilities-only';
      return report;
    }
    const [branch, destination] = args;
    if (args.length !== 2 || !/^feature\/[\w./-]+$/.test(branch)) throw new Error('usage: npm run worker:bootstrap -- feature/name <new-path> (or --doctor)');
    if (!report.capabilities.heavy.writable) throw new Error('Shared heavy lock is not writable; request host access, do not substitute a private lock');
    const repo = repository(process.cwd());
    const target = resolve(destination);
    if (existsSync(target)) throw new Error('Worker destination must not exist');
    git(repo.root, 'fetch', 'origin');
    report.baseRevision = git(repo.root, 'rev-parse', '--verify', 'origin/develop^{commit}');
    git(repo.root, 'worktree', 'add', '-b', branch, target, report.baseRevision);
    report.worktree = target;
    report.branch = branch;
    report.copied = cloneDisks(repo.main, target);
    const installed = command(target, ['node', join(repo.root, 'scripts/heavy.mjs'), 'npm', 'ci'], { stdio: 'inherit' });
    report.installExitCode = installed.code;
    if (installed.code !== 0) throw new Error('npm ci failed; worker is not ready');
    report.status = 'ready';
    report.can = ['Edit an isolated feature branch with private game disks.', 'Run checks using SDK declarations built by npm ci.'];
  } catch (error) {
    report.error = error.message;
  } finally {
    report.finished = new Date().toISOString();
  }
  return report;
}

if (mainModule(import.meta.url)) {
  const report = await bootstrap(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.status === 'failed' ? 2 : 0;
}
