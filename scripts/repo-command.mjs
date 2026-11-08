// Shared argv-only subprocesses for repository maintenance; no shell interpolation.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function command(cwd, argv, options = {}) {
  const { env, ...spawnOptions } = options;
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GM_FAST_TESTS: '', ...env },
    ...spawnOptions,
  });
  return { code: result.status ?? 127, stdout: result.stdout ?? '', stderr: result.error?.message ?? result.stderr ?? '', signal: result.signal };
}

export function git(cwd, ...args) {
  const result = command(cwd, ['git', ...args]);
  if (result.code !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}

export function mainModule(url) {
  return process.argv[1] && fileURLToPath(url) === resolve(process.argv[1]);
}

export function repository(cwd) {
  const root = git(cwd, 'rev-parse', '--show-toplevel');
  const common = resolve(root, git(root, 'rev-parse', '--git-common-dir'));
  return { root, main: resolve(common, '..') };
}
