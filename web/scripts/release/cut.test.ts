// Exercise the cut command against temporary files without a git repository or a real release.
import { afterEach, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractSection } from '../../../scripts/release/changelog.mjs';

const state = vi.hoisted(() => ({ root: '' }));
vi.mock('./git', () => ({
  repoRoot: () => state.root,
  TARGETS: { engine: { name: 'engine', prefix: 'engine', changelog: 'CHANGELOG.md', manifest: 'package.json' } },
}));
const argv = process.argv;
afterEach(() => {
  process.argv = argv;
  vi.resetModules();
  if (state.root) rmSync(state.root, { recursive: true, force: true });
  state.root = '';
});
const setup = (version: string) => {
  state.root = mkdtempSync(join(tmpdir(), 'release-cut-'));
  mkdirSync(join(state.root, 'changes/unreleased/engine'), { recursive: true });
  mkdirSync(join(state.root, 'changes/unreleased/pages'), { recursive: true });
  writeFileSync(join(state.root, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- Legacy.\n');
  writeFileSync(join(state.root, 'package.json'), '{"version":"1.0.0"}\n');
  writeFileSync(join(state.root, 'changes/unreleased/engine/fix.md'), '### Fixed\n\n- Fragment.\n');
  writeFileSync(join(state.root, 'changes/unreleased/pages/site.md'), '### Added\n\n- Site.\n');
  process.argv = ['node', 'cut.ts', 'engine', version, '2026-11-06'];
};

it('writes the combined release and manifest, consuming only that target’s fragments', async () => {
  setup('1.1.0');
  await import('./cut');
  const text = readFileSync(join(state.root, 'CHANGELOG.md'), 'utf8');
  expect(extractSection(text, '1.1.0')).toBe('### Fixed\n\n- Legacy.\n- Fragment.');
  expect(extractSection(text, 'Unreleased')).toBe('');
  expect(JSON.parse(readFileSync(join(state.root, 'package.json'), 'utf8'))).toEqual({ version: '1.1.0' });
  expect(() => readFileSync(join(state.root, 'changes/unreleased/engine/fix.md'))).toThrow();
  expect(readFileSync(join(state.root, 'changes/unreleased/pages/site.md'), 'utf8')).toContain('- Site.');
});
it('leaves the changelog, manifest and fragment intact when a cut is rejected', async () => {
  setup('invalid');
  const before = readFileSync(join(state.root, 'CHANGELOG.md'), 'utf8');
  await expect(import('./cut')).rejects.toThrow(/Not a version/);
  expect(readFileSync(join(state.root, 'CHANGELOG.md'), 'utf8')).toBe(before);
  expect(JSON.parse(readFileSync(join(state.root, 'package.json'), 'utf8'))).toEqual({ version: '1.0.0' });
  expect(readFileSync(join(state.root, 'changes/unreleased/engine/fix.md'), 'utf8')).toContain('- Fragment.');
});
