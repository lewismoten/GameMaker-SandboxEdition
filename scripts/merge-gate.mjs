// Build and test a detached integration candidate; publish only the exact validated revision.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { command, git, mainModule, repository } from './repo-command.mjs';
import { assessTests, validateAllowlist } from './gate-failures.mjs';
import { unionConflicts } from './merge-union.mjs';
import { assertPrivateDisks } from './worker-disks.mjs';

export function gateOptions(args) {
  const options = { branches: [], games: [], push: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--push') options.push = true;
    else if (args[i] === '--games' && args[i + 1]) options.games.push(...args[++i].split(','));
    else if (!args[i].startsWith('-') && /^feature\/[\w./-]+$/.test(args[i])) options.branches.push(args[i]);
    else throw new Error('usage: npm run merge:gate -- feature/name... [--games id,id] [--push]');
  }
  if (!options.branches.length || options.games.some((id) => !/^[a-z0-9][a-z0-9-]*$/.test(id))) throw new Error('Expected feature branches and valid game IDs');
  return options;
}

export function runGate(options, settings = {}) {
  const repo = repository(settings.cwd ?? process.cwd());
  const integration = settings.integration ?? join(repo.main, '.claude/worktrees/merge');
  const output = settings.output ?? mkdtempSync(join(tmpdir(), 'merge-gate-'));
  mkdirSync(output, { recursive: true });
  const result = { version: 1, started: new Date().toISOString(), status: 'failed', exitCode: 2, integration, output, steps: [], inputs: [] };
  let locked = false;
  let phase = 2;
  const execute = settings.execute ?? command;
  function step(name, cwd, argv, accepted = [0]) {
    const started = Date.now();
    const r = execute(cwd, argv);
    const log = join(output, `${result.steps.length}-${name}.log`);
    writeFileSync(log, `${r.stdout ?? ''}${r.stderr ?? ''}`);
    result.steps.push({ name, argv, cwd, code: r.code, signal: r.signal, durationMs: Date.now() - started, log });
    process.stderr.write(`merge:gate ${name}: exit ${r.code}\n`);
    if (!accepted.includes(r.code)) throw new Error(`${name} failed; see ${log}`);
    return r;
  }
  const heavy = (name, cwd, argv) => step(name, cwd, ['node', join(repo.root, 'scripts/heavy.mjs'), ...argv]);
  const unchanged = () => {
    if (git(integration, 'rev-parse', 'HEAD') !== result.candidateRevision || git(integration, 'status', '--porcelain'))
      throw new Error('Candidate changed after being pinned');
  };
  try {
    // Read policy from the invoking checkout, before merging any untrusted candidate content.
    const policy = JSON.parse(readFileSync(new URL('./merge-gate-allowlist.json', import.meta.url), 'utf8'));
    validateAllowlist(policy);
    result.allowlist = policy;
    mkdirSync(resolve(integration, '..'), { recursive: true });
    mkdirSync(`${integration}.gate-lock`);
    locked = true;
    git(repo.root, 'fetch', 'origin');
    result.baseRevision = git(repo.root, 'rev-parse', '--verify', 'origin/develop^{commit}');
    result.inputs = options.branches.map((branch) => ({ branch, revision: git(repo.root, 'rev-parse', '--verify', `refs/remotes/origin/${branch}^{commit}`) }));
    if (existsSync(integration)) {
      if (
        // Git reports the physical path (for example /private/var rather than /var on macOS).
        realpathSync(git(integration, 'rev-parse', '--show-toplevel')) !== realpathSync(integration) ||
        command(integration, ['git', 'symbolic-ref', '-q', 'HEAD']).code !== 1 ||
        git(integration, 'status', '--porcelain')
      )
        throw new Error('Integration must be a clean detached worktree');
      git(integration, 'switch', '--detach', result.baseRevision);
    } else git(repo.root, 'worktree', 'add', '--detach', integration, result.baseRevision);
    assertPrivateDisks(integration);
    phase = 3;
    for (const input of result.inputs) {
      const merged = command(integration, ['git', 'merge', '--no-ff', '--no-commit', input.revision]);
      try {
        if (merged.code !== 0) {
          input.union = unionConflicts(integration);
          if (!input.union.length) throw new Error(merged.stderr);
        }
        if (existsSync(git(integration, 'rev-parse', '--git-path', 'MERGE_HEAD'))) git(integration, 'commit', '-m', `Merge ${input.branch}`);
      } catch (error) {
        git(integration, 'merge', '--abort');
        throw error;
      }
    }
    const markers = command(integration, [
      'git',
      'grep',
      '-n',
      '-E',
      '^(<<<<<<< |=======$|>>>>>>> )',
      '--',
      ':!package-lock.json',
      ':!code',
      ':!cd',
      ':!runtime',
    ]);
    if (markers.code !== 1) throw new Error(`Conflict markers or grep failure: ${markers.stdout}${markers.stderr}`);
    result.mergedRevision = git(integration, 'rev-parse', 'HEAD');
    result.mergedTree = git(integration, 'rev-parse', 'HEAD^{tree}');
    phase = 4;
    const web = join(integration, 'web');
    heavy('packages', integration, ['npm', 'run', 'build:packages']);
    // Force source-matching disks before any tests, regardless of copied cache timestamps.
    heavy('disks', integration, ['npm', 'run', 'build:games', '--', '--force']);
    if (options.games.length) {
      heavy('levelViews', web, ['npx', '--no-install', 'vite-node', 'scripts/levelViews.ts', ...options.games]);
      const allowed = 'web/src/manual/printables/levelViews.json';
      if (
        git(integration, 'diff', '--name-only')
          .split('\n')
          .some((f) => f && f !== allowed)
      )
        throw new Error('Generator changed unexpected tracked files');
      if (git(integration, 'diff', '--name-only', '--', allowed)) {
        git(integration, 'add', '--', allowed);
        git(integration, 'commit', '-m', 'Regenerate Level Maps for integration');
      }
    }
    if (git(integration, 'status', '--porcelain')) throw new Error('Candidate is dirty before validation');
    result.candidateRevision = git(integration, 'rev-parse', 'HEAD');
    result.candidateTree = git(integration, 'rev-parse', 'HEAD^{tree}');
    step('declarations', web, ['node', join(repo.root, 'scripts/decl-preflight.mjs'), '--web', web]);
    step('tsc', web, ['npx', '--no-install', 'tsc', '--noEmit', '-p', '.']);
    step('lint', web, ['npm', 'run', 'lint']);
    const reportFile = join(output, 'vitest.json');
    const tests = step(
      'vitest',
      web,
      [
        'node',
        join(repo.root, 'scripts/heavy.mjs'),
        'npx',
        '--no-install',
        'vitest',
        'run',
        '--maxWorkers=2',
        '--reporter=json',
        `--reporter=${join(repo.root, 'scripts/gate-vitest-reporter.mjs')}`,
        `--outputFile=${reportFile}`,
      ],
      [0, 1],
    );
    result.tests = assessTests(
      JSON.parse(readFileSync(reportFile, 'utf8')),
      tests.code,
      validateAllowlist(policy),
      web,
      JSON.parse(readFileSync(`${reportFile}.completion.json`, 'utf8')),
    );
    if (!result.tests.ok) throw new Error('Unexpected test failures');
    for (const id of options.games) heavy(`game-${id}`, web, ['npx', '--no-install', 'vite-node', '../games/kit/checkGames.ts', '--game', id, '--quick']);
    validateAllowlist(policy);
    unchanged();
    result.testedRevision = result.candidateRevision;
    if (options.push) {
      phase = 5;
      const remote = git(integration, 'ls-remote', 'origin', 'refs/heads/develop').split(/\s/)[0];
      if (remote !== result.baseRevision) throw new Error('Remote develop advanced; rebuild and retest a new candidate');
      unchanged();
      step('push', integration, ['git', 'push', 'origin', `${result.testedRevision}:refs/heads/develop`]);
      result.pushedRevision = result.testedRevision;
    }
    result.status = result.tests.failures.length ? 'passed-with-exceptions' : 'passed';
    result.exitCode = 0;
  } catch (error) {
    result.error = error.message;
    result.exitCode = phase;
  } finally {
    if (locked) rmdirSync(`${integration}.gate-lock`);
    result.finished = new Date().toISOString();
    writeFileSync(join(output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (mainModule(import.meta.url)) {
  try {
    const result = runGate(gateOptions(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.exitCode;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
