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
