// Fragments coexist with legacy notes and remain target-scoped through a release cut.
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
