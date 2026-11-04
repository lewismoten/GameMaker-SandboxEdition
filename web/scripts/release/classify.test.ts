import { describe, expect, it } from 'vitest';
import { areaOf, classify, groupCommits, renderDraft, skipReason, type Commit, type Filters } from './classify';

const filters: Filters = { formatOnly: ['a'.repeat(40)], secretIds: ['hidden'], secretNames: ['THE HIDDEN ONE'] };
const c = (subject: string, files: string[] = ['web/src/x.ts'], hash = 'h1'): Commit => ({ hash, subject, files });

describe('classify', () => {
  it('sorts by the words of the subject', () => {
    expect(classify('Editor: fix the undo stack')).toBe('Fixed');
    expect(classify('Map: the cursor no longer jumps')).toBe('Fixed');
    expect(classify('Editor: add a Redo button')).toBe('Added');
    expect(classify('Remove the old banner')).toBe('Removed');
    expect(classify('Header: Games moves into the menu')).toBe('Changed');
  });
  it('reads the area prefix', () => {
    expect(areaOf('Tune-Up: stage one')).toBe('Tune-Up');
    expect(areaOf('No prefix here')).toBe('');
  });
});

describe('skipReason', () => {
  it('keeps ordinary commits', () => expect(skipReason(c('Map: add rulers'), filters)).toBe(''));
  it('leaves out merges, formatting, tests, docs and agent notes', () => {
    expect(skipReason(c('Merge branch x'), filters)).toBe('merge');
    expect(skipReason(c('Format web', undefined, 'a'.repeat(40)), filters)).toBe('formatting');
    expect(skipReason(c('Map: more checks', ['web/src/map.test.ts']), filters)).toBe('tests only');
    expect(skipReason(c('Map: notes', ['docs/a.md', 'README.md']), filters)).toBe('docs only');
    expect(skipReason(c('AGENTS: a rule'), filters)).toBe('agent notes');
  });
  it('leaves out every trace of a secret game', () => {
    expect(skipReason(c('A level tweak', ['games/hidden/build.ts']), filters)).toBe('secret game');
    expect(skipReason(c('Hidden: new room'), filters)).toBe('secret game');
    expect(skipReason(c('THE HIDDEN ONE gets a boss'), filters)).toBe('secret game');
    expect(skipReason(c('Tune-Up: roads', ['games/tuneup/build.ts']), filters)).toBe('');
  });
});

describe('groupCommits', () => {
  it('folds an area into one line with a count, oldest subject first', () => {
    const g = groupCommits([c('Tune-Up: stage two', undefined, '3'), c('Tune-Up: stage one', undefined, '2'), c('Map: add rulers', undefined, '1')]);
    expect(g.Changed).toEqual(['Tune-Up: stage one (2 commits)']);
    expect(g.Added).toEqual(['Map: add rulers']);
  });
  it('renders only sections with lines', () => {
    expect(renderDraft({ Added: ['A'], Changed: [], Fixed: ['F'], Removed: [] })).toBe('### Added\n\n- A\n\n### Fixed\n\n- F');
  });
});
