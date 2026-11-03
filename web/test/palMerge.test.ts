// The build-time palette merge: identical palettes collapse, scenes are repointed, nothing else moves.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame, parseGame, serializeGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { identicalPalettes, mergeIdenticalPalettes } from '@lewismoten/gamemaker-sandbox-tools/kit/palMerge';

const pal = (v: number) => new Uint8Array(768).fill(v);

function gameWith(pals: string[]): Uint8Array {
  const g: Game = newGame('T');
  g.scenes = pals.map((p) => {
    const sc = emptyScene(ADVTYPE);
    sc.files[0] = p;
    return sc;
  });
  return serializeGame(g);
}

describe('mergeIdenticalPalettes', () => {
  it('keeps the first in scene order, repoints scenes and drops the rest', () => {
    const files = new Map<string, Uint8Array>([
      ['g.gam', gameWith(['b.pal', 'a.pal', 'c.pal', 'b.pal'])],
      ['a.pal', pal(1)],
      ['b.pal', pal(1)],
      ['c.pal', pal(2)],
      ['z.pal', pal(1)],
    ]);
    const r = mergeIdenticalPalettes(files);
    expect([...files.keys()].sort()).toEqual(['b.pal', 'c.pal', 'g.gam']);
    expect(r.saved).toBe(768 * 2);
    expect(parseGame(files.get('g.gam')!).scenes.map((s) => s.files[0])).toEqual(['b.pal', 'b.pal', 'c.pal', 'b.pal']);
    expect(identicalPalettes(files)).toEqual([]);
  });
  it('leaves a disk with no duplicates byte for byte', () => {
    const g = gameWith(['a.pal', 'c.pal']);
    const files = new Map<string, Uint8Array>([
      ['g.gam', g],
      ['a.pal', pal(1)],
      ['c.pal', pal(2)],
    ]);
    mergeIdenticalPalettes(files);
    expect(files.get('g.gam')).toBe(g);
  });
});
