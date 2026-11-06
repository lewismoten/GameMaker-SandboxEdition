// Disposable local Git remotes and deterministic check results for workflow regression tests.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { command, git } from '../../scripts/repo-command.mjs';

export function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'repo-workflow-'));
  const root = join(dir, 'repo');
  const remote = join(dir, 'origin.git');
  try {
    mkdirSync(root);
    git(root, 'init', '-b', 'develop');
    git(root, 'config', 'commit.gpgsign', 'false');
    git(root, 'config', 'tag.gpgsign', 'false');
    git(root, 'config', 'user.email', 'test@example.invalid');
    git(root, 'config', 'user.name', 'Workflow test');
    git(root, 'config', 'core.hooksPath', '/dev/null');
    writeFileSync(join(root, 'notes.txt'), 'base\n');
    writeFileSync(join(root, 'code.js'), '// base\n');
    git(root, 'add', '.');
    git(root, 'commit', '-m', 'base');
    git(root, 'init', '--bare', remote);
    git(root, 'remote', 'add', 'origin', remote);
    git(root, 'push', 'origin', 'develop');
    return { dir, root, remote, integration: join(dir, 'merge'), output: join(dir, 'results') };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

export function change(root, branch, file, text) {
  git(root, 'switch', '-C', branch, 'origin/develop');
  writeFileSync(join(root, file), text);
  git(root, 'add', '--', file);
  git(root, 'commit', '-m', branch);
  git(root, 'push', 'origin', branch);
  return git(root, 'rev-parse', 'HEAD');
}

export function testReport(web, failed = false) {
  return {
    numTotalTests: 1,
    numFailedTests: failed ? 1 : 0,
    success: !failed,
    testResults: [
      {
        name: join(web, 'example.test.ts'),
        status: failed ? 'failed' : 'passed',
        message: '',
        assertionResults: [
          { fullName: 'example works', status: failed ? 'failed' : 'passed', failureMessages: failed ? ['AssertionError: expected true'] : [] },
        ],
      },
    ],
  };
}

export function fakeChecks(failed = false, visit = () => {}) {
  return (cwd, argv) => {
    visit(cwd, argv);
    if (argv[0] === 'git') return command(cwd, argv);
    if (argv.includes('vitest')) {
      const file = argv.find((s) => s.startsWith('--outputFile=')).slice('--outputFile='.length);
      writeFileSync(file, JSON.stringify(testReport(cwd, failed)));
      writeFileSync(`${file}.completion.json`, JSON.stringify({ reason: failed ? 'failed' : 'passed', unhandledErrors: [] }));
      return { code: failed ? 1 : 0, stdout: '', stderr: '' };
    }
    return { code: 0, stdout: '', stderr: '' };
  };
}
