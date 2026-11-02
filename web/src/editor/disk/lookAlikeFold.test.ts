import { describe, expect, it } from 'vitest';
import { BACKBL, newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { planDisk } from './plan';

/** One scene whose set has blocks 1 and 2 drawn alike, block 3 the same picture but a pickup (it has other rules), and 4 in another color. */
function room(): GameFiles {
  const f = new GameFiles();
  const p = new Uint8Array(768);
  for (let i = 0; i < 256; i++) p.fill(i & 63, i * 3, i * 3 + 3);
  p[3] = 7;
  p[4 * 3] = 0; // index 4 and 5 show the same color, so blocks filled with either look alike
  p.set([9, 9, 9], 5 * 3);
  p.set([9, 9, 9], 6 * 3);
  f.set('a.pal', serializePalette(p));
  const bbl = newBlockSet('bbl');
  bbl[1] = { ...bbl[1], pixels: new Uint8Array(400).fill(5) };
  bbl[2] = { ...bbl[2], pixels: new Uint8Array(400).fill(6) };
  bbl[3] = { ...bbl[3], pixels: new Uint8Array(400).fill(5), obj: 1 };
  bbl[4] = { ...bbl[4], pixels: new Uint8Array(400).fill(20) };
  f.set('a.bbl', serializeBlocks(bbl));
  const map = newMap();
  map.blocks[0] = 2;
  map.blocks[1] = 1;
  map.blocks[2] = 3;
  map.blocks[3] = 4;
  f.set('a.map', serializeMap(map));
  f.set('a.cbl', serializeBlocks(newBlockSet('cbl')));
  const chr = newCharacter();
  chr.inv[0] = 3;
  f.set('a.chr', serializeCharacter(chr));
  const game = newGame('T');
  const s = emptyScene(ADVTYPE);
  s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
  s.files = ['a.pal', 'a.map', 'a.bbl', '', '', 'a.chr', 'a.cbl', '', '', '', '', ...new Array(9).fill('')];
  game.scenes.push(s);
  f.set('t.gam', serializeGame(game));
  return f;
}

describe('look-alike fold step', () => {
  it('joins blocks drawn alike, keeps a carried block at its number, and renumbers the map', () => {
    const f = room();
    const step = planDisk(f, 't.gam').steps.find((s) => s.kind === 'look');
    expect(step).toBeDefined();
    step!.apply(f, 't.gam');
    const cells = parseMap(f.get('a.map')!).blocks;
    // 2 became 1; the pickup 3 has other rules, so it keeps its number and picture
    expect([cells[0], cells[1], cells[2], cells[3]]).toEqual([1, 1, 3, 4]);
    const blocks = parseBlocks(f.get('a.bbl')!, BACKBL);
    expect(blocks[3].obj).toBe(1);
    expect(blocks[1].pixels.every((v) => v === 5)).toBe(true);
    expect(blocks[2].pixels.every((v) => v === 0)).toBe(true);
  });

  it('refuses to apply after a file changed since the preview', () => {
    const f = room();
    const step = planDisk(f, 't.gam').steps.find((s) => s.kind === 'look')!;
    f.set('a.map', serializeMap(newMap()));
    expect(() => step.apply(f, 't.gam')).toThrow(/changed since the preview/);
  });
});
