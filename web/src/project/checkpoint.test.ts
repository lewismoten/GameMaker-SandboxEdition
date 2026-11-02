// restoreChanges: only differing files come back, files made since are removed.
import { expect, it } from 'vitest';
import { GameFiles } from './files';
import { restoreChanges } from './checkpoint';

it('lists changed, removed and recreated files, and leaves the rest', () => {
  const now = new GameFiles([
    ['a.map', new Uint8Array([1, 2])],
    ['b.bbl', new Uint8Array([9])],
    ['new.bbl', new Uint8Array([5])],
  ]);
  const cp = { name: 'x', made: 0, files: { 'a.map': new Uint8Array([1, 3]), 'b.bbl': new Uint8Array([9]), 'gone.pal': new Uint8Array([7]) } };
  const ch = restoreChanges(now, cp);
  expect([...ch.keys()].sort()).toEqual(['a.map', 'gone.pal', 'new.bbl']);
  expect(ch.get('new.bbl')).toBeNull();
  expect([...ch.get('a.map')!]).toEqual([1, 3]);
});
