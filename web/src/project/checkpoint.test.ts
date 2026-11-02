// Checkpoint list: stamps as deltas, delete absorbing, tags, restoreChanges.
import { expect, it } from 'vitest';
import { GameFiles } from './files';
import { checkpointList, restoreChanges, versionAt, withStamp, withTag, withoutStamp } from './checkpoint';

const game = (...e: [string, number[]][]) => new GameFiles(e.map(([n, b]) => [n, Uint8Array.from(b)] as [string, Uint8Array]));

it('lists changed, removed and recreated files, and leaves the rest', () => {
  const now = game(['a.map', [1, 2]], ['b.bbl', [9]], ['new.bbl', [5]]);
  const v = new Map([
    ['a.map', Uint8Array.of(1, 3)],
    ['b.bbl', Uint8Array.of(9)],
    ['gone.pal', Uint8Array.of(7)],
  ]);
  const ch = restoreChanges(now, v);
  expect([...ch.keys()].sort()).toEqual(['a.map', 'gone.pal', 'new.bbl']);
  expect(ch.get('new.bbl')).toBeNull();
  expect([...ch.get('a.map')!]).toEqual([1, 3]);
});

it('keeps a list of stamps as deltas, rebuilds each, and deletes one without losing the others', () => {
  const big = new Array(2000).fill(4);
  let list = withStamp([], { id: 'a', name: 'one', made: 1 }, game(['x.bbl', big], ['n.txt', [97, 10]]));
  const v2 = big.slice();
  v2[100] = 9;
  list = withStamp(list, { id: 'b', name: 'two', made: 2 }, game(['x.bbl', v2], ['n.txt', [97, 10, 98, 10]]));
  const v3 = v2.slice();
  v3[1900] = 1;
  list = withStamp(list, { id: 'c', name: 'three', made: 3 }, game(['x.bbl', v3]));
  expect(JSON.stringify(list[1].delta).length).toBeLessThan(400);
  expect([...versionAt(list, 1).get('x.bbl')!]).toEqual(v2);
  const less = withoutStamp(list, 'b');
  expect(less.map((c) => c.id)).toEqual(['a', 'c']);
  expect([...versionAt(less, 1).get('x.bbl')!]).toEqual(v3);
  expect(versionAt(less, 1).has('n.txt')).toBe(false);
  expect([...versionAt(less, 0).get('x.bbl')!]).toEqual(big);
});

it('tags and untags, and reads the single whole checkpoint of earlier versions', () => {
  let list = withStamp([], { id: 'a', name: 'one', made: 1 }, game(['a.map', [1]]));
  expect(withTag(list, 'a', ' v1.0 ')[0].tag).toBe('v1.0');
  list = withTag(withTag(list, 'a', 'v1'), 'a', '');
  expect(list[0].tag).toBeUndefined();
  const old = checkpointList({ checkpoint: { name: 'Before', made: 5, files: { 'a.map': Uint8Array.of(7) } } });
  expect(old).toHaveLength(1);
  expect([...versionAt(old, 0).get('a.map')!]).toEqual([7]);
});
