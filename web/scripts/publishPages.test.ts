// Release orchestration uses process stubs; no release commands run.
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { expect, it, vi } from 'vitest';

it('rejects an older release when the remote changes during its build', () => {
  const source = readFileSync(new URL('../../scripts/release/publish-pages.mjs', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '')
    .replace('import.meta.url', JSON.stringify(import.meta.url));
  const before = 'a'.repeat(40);
  let remote = before;
  const calls: string[][] = [];
  const execFileSync = vi.fn((cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (cmd === 'npm' && args[0] === 'ci') remote = 'b'.repeat(40);
    if (cmd !== 'git') return '';
    if (args[0] === 'ls-remote') return `${remote}\trefs/heads/gh-pages`;
    if (args[0] === 'push' && !args.includes(`--force-with-lease=refs/heads/gh-pages:${remote}`)) throw new Error('stale lease');
    return 'c'.repeat(40);
  });
  expect(() =>
    new Script(source).runInNewContext({
      execFileSync,
      mkdtempSync: () => '/tmp/mock-pages',
      rmSync: vi.fn(),
      writeFileSync: vi.fn(),
      tmpdir: () => '/tmp',
      dirname: () => '/tmp',
      join: (...parts: string[]) => parts.join('/'),
      resolve: () => '/mock-root',
      fileURLToPath: () => '/mock-script',
      supervisedFor: () => ({ named: true }),
      process: {
        argv: ['node', 'script', 'pages-v1.2.3', '--push'],
        env: {},
        exit: () => {
          throw new Error('unexpected exit');
        },
      },
      console: { log: vi.fn(), error: vi.fn() },
    }),
  ).toThrow('stale lease');
  expect(calls.findIndex((c) => c[1] === 'ls-remote')).toBeLessThan(calls.findIndex((c) => c[1] === 'worktree' && c[2] === 'add'));
  expect(calls.find((c) => c[1] === 'push')).toContain(`--force-with-lease=refs/heads/gh-pages:${before}`);
});

it('documents how to retain a previous deployment', () => {
  const runbook = readFileSync(new URL('../../docs/package-releases.md', import.meta.url), 'utf8');
  expect(runbook.match(/[^.\n]*previous deployment[^.\n]*/gi) ?? []).toEqual(expect.arrayContaining([expect.stringMatching(/branch or tag/i)]));
});
