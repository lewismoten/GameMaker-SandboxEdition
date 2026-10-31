import { describe, expect, it } from 'vitest';
import { parseDiskDiffArgs } from './diskDiffArgs';

describe('disk:diff arguments', () => {
  it('keeps the two-path form', () => {
    expect(parseDiskDiffArgs(['--', 'a', 'b.zip', '--notes'])).toEqual({ mode: 'paths', a: 'a', b: 'b.zip', json: false, notes: true });
  });
  it('reads a game with --since and a revision', () => {
    expect(parseDiskDiffArgs(['goat', '--since', 'abc123', '--json'])).toEqual({ mode: 'since', game: 'goat', since: 'abc123', json: true, notes: false });
    expect(parseDiskDiffArgs(['goat', '--since=HEAD~3'])).toMatchObject({ since: 'HEAD~3' });
  });
  it('defaults the revision (last push to master)', () => {
    expect(parseDiskDiffArgs(['goat', '--since', '--notes'])).toEqual({ mode: 'since', game: 'goat', since: undefined, json: false, notes: true });
  });
  it('rejects the wrong number of paths', () => {
    expect(parseDiskDiffArgs(['a'])).toHaveProperty('error');
    expect(parseDiskDiffArgs(['a', 'b', '--since'])).toHaveProperty('error');
  });
});
