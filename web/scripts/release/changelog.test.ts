import { describe, expect, it } from 'vitest';
import { REPO, cutRelease, extractSection, hasNoChanges, latestVersion } from '../../../scripts/release/changelog.mjs';

const text = `# Changelog

## [Unreleased]

Summary.

### Added

- New thing.

## [1.0.0] - 2026-01-01

First release.

### Added

- Everything.

[Unreleased]: ${REPO}/compare/pkg-v1.0.0...HEAD
[1.0.0]: ${REPO}/releases/tag/pkg-v1.0.0
`;

describe('changelog', () => {
  it('extracts a section without its heading or the link references', () => {
    expect(extractSection(text, '1.0.0')).toBe('First release.\n\n### Added\n\n- Everything.');
    expect(extractSection(text, 'Unreleased')).toContain('- New thing.');
    expect(extractSection(text, '9.9.9')).toBeNull();
  });
  it('finds the latest version and empty sections', () => {
    expect(latestVersion(text)).toBe('1.0.0');
    expect(hasNoChanges('Just a summary.')).toBe(true);
    expect(hasNoChanges('### Fixed\n\n- A bug.')).toBe(false);
  });
  it('cuts Unreleased into a dated version and fixes the links', () => {
    const out = cutRelease(text, { version: '1.1.0', date: '2026-02-02', prefix: 'pkg' });
    expect(out).toContain('## [Unreleased]\n\n## [1.1.0] - 2026-02-02\n\nSummary.');
    expect(extractSection(out, 'Unreleased')).toBe('');
    expect(out).toContain(`[Unreleased]: ${REPO}/compare/pkg-v1.1.0...HEAD\n[1.1.0]: ${REPO}/compare/pkg-v1.0.0...pkg-v1.1.0\n[1.0.0]:`);
    expect(out.match(/^\[Unreleased\]/gm)).toHaveLength(1);
  });
  it('refuses an empty Unreleased, a repeat and a bad version', () => {
    const empty = text.replace('- New thing.', '');
    expect(() => cutRelease(empty, { version: '1.1.0', date: 'd', prefix: 'pkg' })).toThrow(/no changes/);
    expect(() => cutRelease(text, { version: '1.0.0', date: 'd', prefix: 'pkg' })).toThrow(/already/);
    expect(() => cutRelease(text, { version: 'x', date: 'd', prefix: 'pkg' })).toThrow(/version/);
  });
});
