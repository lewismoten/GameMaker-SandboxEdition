import { describe, expect, it } from 'vitest';
import { BACKBL, newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { rangeDrift, reductions } from './reduceColors';

function room(): GameFiles {
  const f = new GameFiles();
  const p = new Uint8Array(768);
  for (let i = 0; i < 256; i++) p.fill(i & 63, i * 3, i * 3 + 3);
  p[3] = 7;
  f.set('a.pal', serializePalette(p));
  const bbl = newBlockSet('bbl');
  bbl[1] = { ...bbl[1], pixels: new Uint8Array(400).fill(12) }; // inside the monster range
  bbl[2] = { ...bbl[2], pixels: new Uint8Array(400).fill(40) }; // background range
  f.set('a.bbl', serializeBlocks(bbl));
  const map = newMap();
  map.blocks[0] = 1;
  map.blocks[1] = 2;
  f.set('a.map', serializeMap(map));
  const game = newGame('T');
  const s = emptyScene(ADVTYPE);
  s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  s.files = ['a.pal', 'a.map', 'a.bbl', '', '', '', '', '', '', '', '', ...new Array(9).fill('')];
  game.scenes.push(s);
  f.set('t.gam', serializeGame(game));
  return f;
}

describe('color reduction proposals', () => {
  const ranges = [
    { first: 10, last: 19, role: 'monster' as const },
    { first: 30, last: 50, role: 'background' as const },
  ];
  it('proposes moving a background block out of the monster range, and applies it', () => {
    const f = room();
    const r = reductions(f, 't.gam', ranges);
    expect(r).toHaveLength(1);
    expect(r[0].changedBlocks).toBe(1);
    r[0].apply(f, 't.gam');
    const b = parseBlocks(f.get('a.bbl')!, BACKBL);
    expect(b[1].pixels.every((v) => v < 10 || v > 19)).toBe(true);
    expect(b[2].pixels[0]).toBe(40);
    expect(f.get('a.bbl')!.length).toBe(63000);
  });
  it('reports a sprite file whose reserved colors differ between its scenes palettes', () => {
    const f = room();
    expect(rangeDrift(f, 't.gam', ranges)).toEqual([]);
  });
  it('proposes nothing without reservations', () => {
    expect(reductions(room(), 't.gam', [])).toEqual([]);
  });
});
