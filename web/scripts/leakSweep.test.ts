// Run the privacy sweep only on a temporary tracked fixture, never the developer's private patterns.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

function sweep(root: string, dist: string, patterns: string) {
  return spawnSync('bash', [fileURLToPath(new URL('./leakSweep.sh', import.meta.url)), dist, 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, HOME: join(root, 'FixturePrivateHome'), GM_LEAK_PATTERNS: patterns },
  });
}

function fixture(term: string, check: (dist: string, run: () => ReturnType<typeof sweep>) => void) {
  const root = mkdtempSync(join(tmpdir(), 'leak-sweep-'));
  try {
    const git = (...args: string[]) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    expect(git('init', '--quiet').status).toBe(0);
    mkdirSync(join(root, 'games/hidden-fixture'), { recursive: true });
    writeFileSync(join(root, 'games/hidden-fixture/about.json'), '{"secret": true, "title": "Hidden Fixture"}');
    writeFileSync(join(root, `${term}.txt`), term);
    expect(git('add', '.').status).toBe(0);
    const patterns = join(root, 'patterns.local');
    writeFileSync(patterns, `${term}\nAbsentPrivateTerm\n`);
    const dist = join(root, `${term}-dist`);
    mkdirSync(dist);
    check(dist, () => sweep(root, dist, patterns));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it.each(['FixturePrivateSurname', 'FixturePrivate#Surname'])('redacts %s and matching paths while preserving build exit codes', (term) => {
  fixture(term, (dist, run) => {
    const clean = run();
    expect(clean.status, clean.stderr).toBe(0);
    writeFileSync(join(dist, `${term}.txt`), term);
    const hit = run();
    expect(hit.status, hit.stderr).toBe(1);
    for (const result of [clean, hit]) {
      const output = result.stdout + result.stderr;
      for (const privateText of [term, 'AbsentPrivateTerm', 'FixturePrivateHome']) expect(output).not.toContain(privateText);
      expect(output).toMatch(/pattern \d+/);
    }
    expect(hit.stdout).toContain('<private>');
  });
});

it('accepts version strings with invalid octets and fails on a private IPv4 address', () => {
  fixture('FixturePrivateSurname', (dist, run) => {
    const file = join(dist, 'address.txt');
    writeFileSync(file, 'version 10.999.999.999 and 192.168.1.256');
    expect(run().status).toBe(0);
    writeFileSync(file, 'connect to 10.0.255.1:8080');
    expect(run().status).toBe(1);
  });
});

it.each([
  '100.127.0.1',
  '169.254.1.2',
  'http://127.0.0.1:8787',
  'fe80::1',
  'PC.TAIL.TS.NET',
  '/Users/synthetic/project',
  'user@example.com.evil.org',
  'UPPER@FOREIGN.INVALID',
  "o'wordsmith@dict.sandbox-u.edu",
  'other@dict.sandbox-u.edu',
  'wordsmith@dict.sandbox-u.edu.evil.org',
])('rejects a build containing %s', (value) => {
  fixture('FixturePrivateSurname', (dist, run) => {
    writeFileSync(join(dist, 'test.txt'), value);
    expect(run().status).toBe(1);
  });
});
it('scans the phone book chunk and accepts SVG coordinates and known domains', () => {
  fixture('FixturePrivateSurname', (dist, run) => {
    const file = join(dist, 'phoneBook-test.js');
    writeFileSync(
      file,
      'M10.5.3.2l1 Windows NT 10.0.19041.1 chrome 110.0.0.0 / 10.15.7.1 sandbox@sandbox.pgh.pa.us git@github.com wordsmith@dict.sandbox-u.edu',
    );
    expect(run().status).toBe(0);
    writeFileSync(file, 'fetch("/.for-lewis/file")');
    expect(run().status).toBe(1);
  });
});
it('handles comments, CRLF, invalid patterns and missing explicit files', () => {
  fixture('FixturePrivateSurname', (dist, run) => {
    const patterns = join(dist, '../patterns.local');
    writeFileSync(patterns, ' # ignored\r\n  \r\n  HiddenValue \r\n');
    writeFileSync(join(dist, 'test.txt'), 'HiddenValue');
    expect(run().status).toBe(1);
    writeFileSync(patterns, '(');
    expect(run().status).toBe(2);
    rmSync(patterns);
    expect(run().status).toBe(2);
  });
});
