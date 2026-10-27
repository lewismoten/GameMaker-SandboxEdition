// Tests: a game's version rule (games/kit/versions.ts): a game whose disk changed since the last
// push to master needs a higher version than it had there; one unchanged or new needs none.
import { describe, expect, it } from 'vitest';
import { compareVersions, versionProblems, type VersionSource } from '../../games/kit/versions';

/** A made-up history: each game's version here, its about.json at the last push, and whether its disk changed. */
function history(games: Record<string, { here?: string; base?: { version?: string } | null; changed: boolean }>): VersionSource {
  return {
    version: (id) => games[id].here,
    baseAbout: (id) => games[id].base ?? undefined,
    changed: (id) => games[id].changed,
  };
}

describe('compareVersions', () => {
  it('orders major then minor, as numbers', () => {
    expect(compareVersions('1.10', '1.9')).toBeGreaterThan(0);
    expect(compareVersions('2.0', '1.9')).toBeGreaterThan(0);
    expect(compareVersions('1.1', '1.1')).toBe(0);
    expect(compareVersions('1.0', '1.1')).toBeLessThan(0);
  });
});

describe('versionProblems', () => {
  it('asks for a bump when the disk changed and the version did not', () => {
    const src = history({ a: { here: '1.0', base: { version: '1.0' }, changed: true } });
    expect(versionProblems(['a'], src)).toEqual([expect.stringMatching(/^a: changed since the last push to master; bump its version/)]);
  });

  it('passes a minor or major bump, and an unchanged game', () => {
    const src = history({
      minor: { here: '1.1', base: { version: '1.0' }, changed: true },
      major: { here: '2.0', base: { version: '1.3' }, changed: true },
      same: { here: '1.0', base: { version: '1.0' }, changed: false },
    });
    expect(versionProblems(['minor', 'major', 'same'], src)).toEqual([]);
  });

  it('takes a game with no version at the last push as 1.0', () => {
    const src = history({ old: { here: '1.0', base: {}, changed: true }, bumped: { here: '1.1', base: {}, changed: true } });
    expect(versionProblems(['old', 'bumped'], src)).toEqual([expect.stringMatching(/^old: /)]);
  });

  it('lets a game new since the last push start at any version', () => {
    expect(versionProblems(['new'], history({ new: { here: '1.0', base: null, changed: true } }))).toEqual([]);
  });

  it('wants a major.minor version in about.json', () => {
    const src = history({ none: { changed: false }, bad: { here: '1.0.1', changed: false } });
    expect(versionProblems(['none', 'bad'], src)).toHaveLength(2);
  });

  it('fails a version lowered below the last push', () => {
    expect(versionProblems(['a'], history({ a: { here: '1.0', base: { version: '1.2' }, changed: true } }))).toHaveLength(1);
  });
});
