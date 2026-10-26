// "Remove all imported…" and "Remove the ones from this import" take exactly the imported games.
import { describe, expect, it } from 'vitest';
import { importedToRemove } from './importBatch';

const projects = [{ id: 'mine' }, { id: 'a1' }, { id: 'a2' }, { id: 'b1' }, { id: 'moved' }, { id: 'old' }];
// "moved" came in with import A, then was moved to My games; "old" was imported before batches were kept
const imported = new Set(['a1', 'a2', 'b1', 'old']);
const batches: Record<string, string> = { a1: 'A', a2: 'A', b1: 'B', moved: 'A' };
const pick = (batch?: string) =>
  importedToRemove(
    projects,
    (id) => imported.has(id),
    batch,
    (id) => batches[id],
  ).map((p) => p.id);

describe('importedToRemove', () => {
  it('takes every imported game, and none of My games', () => {
    expect(pick()).toEqual(['a1', 'a2', 'b1', 'old']);
  });

  it('takes one import’s games, not one moved to My games since', () => {
    expect(pick('A')).toEqual(['a1', 'a2']);
    expect(pick('B')).toEqual(['b1']);
    expect(pick('C')).toEqual([]);
  });
});
