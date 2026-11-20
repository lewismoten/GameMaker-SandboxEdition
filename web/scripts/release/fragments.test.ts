// Fragments coexist with legacy notes and remain target-scoped through a release cut.
import { execFileSync, spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cutRelease, extractSection, hasNoChanges } from '../../../scripts/release/changelog.mjs';
import { consumeFragments, pendingNotes, readFragments, withPendingNotes } from './fragments';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
const setup = () => {
  const root = mkdtempSync(join(tmpdir(), 'release-fragments-'));
  roots.push(root);
  for (const target of ['engine', 'pages']) mkdirSync(join(root, 'changes/unreleased', target), { recursive: true });
  return root;
};
const add = (root: string, target: string, name: string, text: string) => writeFileSync(join(root, 'changes/unreleased', target, `${name}.md`), text);
const legacy =
  '# Changelog\n\n## [Unreleased]\n\nSummary.\n\n### Fixed\n\n- Legacy fix.\n\n### Security\n\n- Legacy security.\n\n## [1.0.0] - 2026-01-01\n\nOld notes.\n';

describe('release fragments', () => {
  it('sorts by filename and collects only the requested target', () => {
    const root = setup();
    add(root, 'engine', 'z', '### Fixed\n\n- Last.\n');
    add(root, 'engine', 'a', '### Fixed\n\n- First.\n');
    add(root, 'pages', 'other', '### Added\n\n- Site.\n');
    expect(readFragments(root, 'engine').map((f) => f.text)).toEqual(['### Fixed\n\n- First.', '### Fixed\n\n- Last.']);
    expect(readFragments(root, 'tools')).toEqual([]);
  });
  it('accepts fragments as pending changes while keeping legacy sections and history', () => {
    const fragments = [{ text: '### Added\n\n- New thing.' }, { text: '### Fixed\n\n- New fix with $& and $1.' }];
    const merged = withPendingNotes(legacy, fragments);
    expect(extractSection(merged, '1.0.0')).toBe('Old notes.');
    const pending = pendingNotes(legacy, fragments);
    expect(pending).toContain('Summary.');
    expect(pending.indexOf('- New fix')).toBeLessThan(pending.indexOf('### Security'));
    expect(pending).toContain('- Legacy fix.');
    expect(pending).toContain('- New fix with $& and $1.');
    expect(pending.match(/### Fixed/g)).toHaveLength(1);
    const empty = '# Changelog\n\n## [Unreleased]\n';
    expect(hasNoChanges(pendingNotes(empty, fragments))).toBe(false);
    const cut = cutRelease(withPendingNotes(empty, fragments), { version: '1.0.0', date: '2026-11-06', prefix: 'engine' });
    expect(extractSection(cut, 'Unreleased')).toBe('');
    expect(extractSection(cut, '1.0.0')).toContain('- New thing.');
    expect(withPendingNotes(legacy, [])).toBe(legacy);
  });
  it('rejects malformed fragments and leaves files alone on an unsuccessful cut', () => {
    const root = setup();
    add(root, 'engine', 'bad', 'A summary with no category.');
    expect(() => readFragments(root, 'engine')).toThrow(/expected/);
    add(root, 'engine', 'bad', '### Fixed\n- Missing blank line.');
    expect(() => readFragments(root, 'engine')).toThrow(/expected/);
    add(root, 'engine', 'bad', '### Fixed\n\n- First.\n- Second.');
    expect(() => readFragments(root, 'engine')).toThrow(/expected/);
    add(root, 'engine', 'bad', '### Fixed\n\n- Valid.\n');
    const fragments = readFragments(root, 'engine');
    expect(() => cutRelease(withPendingNotes(legacy, fragments), { version: 'bad', date: 'd', prefix: 'engine' })).toThrow();
    expect(readFileSync(fragments[0].path, 'utf8')).toContain('- Valid.');
    expect(() => pendingNotes('# No heading', fragments)).toThrow(/Missing/);
  });
  it('consumes exactly the fragments collected for a successful release', () => {
    const root = setup();
    add(root, 'engine', 'fix', '### Fixed\n\n- Engine.\n');
    add(root, 'pages', 'fix', '### Fixed\n\n- Site.\n');
    const fragments = readFragments(root, 'engine');
    const out = cutRelease(withPendingNotes(legacy, fragments), { version: '1.1.0', date: '2026-11-06', prefix: 'engine' });
    expect(extractSection(out, '1.1.0')).toContain('- Engine.');
    consumeFragments(fragments);
    expect(existsSync(fragments[0].path)).toBe(false);
    expect(readFragments(root, 'pages')).toHaveLength(1);
    expect(readFragments(root, 'engine')).toEqual([]);
  });
});

function releaseRepo() {
  const root = setup();
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root });
  git('init', '--quiet');
  writeFileSync(join(root, 'CHANGELOG.md'), legacy);
  for (const target of ['engine', 'archives', 'tools']) {
    const dir = join(root, 'web/packages', target);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'CHANGELOG.md'), legacy);
    writeFileSync(join(dir, 'package.json'), '{"version":"1.1.0"}');
  }
  git('add', '.');
  git('-c', 'user.email=test@example.com', '-c', 'user.name=Test', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Release fixture');
  git('tag', 'engine-v1.1.0');
  return root;
}

function check(root: string) {
  return spawnSync(process.execPath, [require.resolve('vite-node/vite-node.mjs'), join(__dirname, 'check.ts')], { cwd: root, encoding: 'utf8' });
}

it('reports a malformed pages fragment and checks the remaining targets', () => {
  const root = releaseRepo();
  add(root, 'pages', 'bad', '### Fixd\n\n- Typo.');
  add(root, 'pages', 'second', 'Missing heading.');
  writeFileSync(join(root, 'changes/unreleased/pages/note.markdown'), '### Fixed\n\n- Valid content.');
  for (const name of ['.keep', '.gitkeep']) writeFileSync(join(root, 'changes/unreleased/engine', name), '');
  writeFileSync(join(root, 'web/packages/engine/CHANGELOG.md'), legacy.replace('1.0.0', '1.1.0'));
  const malformed = check(root);
  expect(malformed.status, malformed.stderr).toBe(1);
  expect(malformed.stdout).toContain(`FAIL pages: ${join(root, 'changes/unreleased/pages/bad.md')}: expected one ### category, a blank line and one bullet.`);
  expect(malformed.stdout).toContain(`FAIL pages: ${join(root, 'changes/unreleased/pages/second.md')}: expected one`);
  expect(malformed.stdout).toContain(`FAIL pages: ${join(root, 'changes/unreleased/pages/note.markdown')}: expected a .md fragment file.`);
  expect(malformed.stdout).toContain('ok   engine');

  expect(malformed.stdout).toContain('ok   archives');
  expect(malformed.stdout).toContain('ok   tools');
});

it('fails when the latest tag is ahead of the changelog even after the manifest advances', () => {
  const root = releaseRepo();
  writeFileSync(join(root, 'web/packages/engine/package.json'), '{"version":"1.2.0"}');
  const missingRelease = check(root);
  expect(missingRelease.status, missingRelease.stderr).toBe(1);
  expect(missingRelease.stdout).toContain('FAIL engine: 1.1.0 is tagged but the changelog stops at 1.0.0');
});

it('requires a note for a source change when the newest release tag is on a side branch', () => {
  const root = releaseRepo();
  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=Test', '-c', 'commit.gpgsign=false', ...args], { cwd: root });
  git('switch', '-qc', 'release');
  git('commit', '--allow-empty', '-qm', 'Tag release');
  git('tag', 'engine-v1.2.0');
  git('switch', '-q', '-');
  const dir = join(root, 'web/packages/engine');
  writeFileSync(join(dir, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n\n## [1.2.0] - 2026-01-02\n\nReleased.\n');
  writeFileSync(join(dir, 'package.json'), '{"version":"1.2.0"}');
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src/index.ts'), 'export const version = 2;\n');
  git('add', '.');
  git('commit', '-qm', 'Change engine source');
  const result = check(root);
  expect(result.status, result.stderr).toBe(1);
  expect(result.stdout).toContain('FAIL engine: 1 commits since engine-v1.2.0, but Unreleased and fragments list nothing');
});
