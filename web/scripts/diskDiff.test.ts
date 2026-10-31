// Disk diff summaries per file type, from tiny fixtures built with the engine's own writers.
import { describe, expect, it } from 'vitest';
import { cellClusters, diffDisks, formatDiff, lineDiff, ranges, sniffKind, summarizeChange } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { BACKBL, emptyBlock, newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { defaultPalette, serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';

const enc = (s: string) => new TextEncoder().encode(s);

describe('helpers', () => {
  it('writes ranges', () => expect(ranges([3, 4, 5, 9])).toBe('3-5, 9'));
  it('counts line changes', () => expect(lineDiff(['a', 'b', 'c'], ['a', 'x', 'c', 'd'])).toEqual({ added: 2, removed: 1 }));
  it('groups nearby cells', () => {
    const w = 100;
    expect(cellClusters([w * 5 + 5, w * 5 + 6, w * 50 + 40], w)).toEqual([
      { count: 2, x0: 5, y0: 5, x1: 6, y1: 5 },
      { count: 1, x0: 40, y0: 50, x1: 40, y1: 50 },
    ]);
  });
  it('sniffs contents before extensions', () => {
    expect(sniffKind('A.FLI', enc('hello'))).toBe('fli (not that format)');
    expect(sniffKind('PIC.DAT', encodeGif({ width: 1, height: 1, pixels: new Uint8Array(1), palette: defaultPalette() }))).toBe('gif');
  });
});

describe('summaries by type', () => {
  it('palette', () => {
    const a = defaultPalette();
    const b = a.slice();
    b[3 * 7] ^= 1;
    expect(summarizeChange('x.pal', serializePalette(a), serializePalette(b)).summary).toEqual(['1 color changed: 7']);
  });
  it('blocks', () => {
    const a = newBlockSet('bbl');
    const b = newBlockSet('bbl');
    b[5] = { ...emptyBlock(5), pixels: new Uint8Array(400).fill(9) };
    expect(a).toHaveLength(BACKBL);
    expect(summarizeChange('x.bbl', serializeBlocks(a), serializeBlocks(b)).summary.join()).toMatch(/block (changed|new).*: 5$/);
  });
  it('map', () => {
    const a = newMap();
    const b = newMap();
    b.blocks[2 * 100 + 3] = 4;
    b.blocks[2 * 100 + 4] = 4;
    const s = summarizeChange('x.map', serializeMap(a), serializeMap(b)).summary;
    expect(s[0]).toBe('2 cells changed in 1 cluster');
    expect(s[1]).toContain('cluster at (3,2)-(4,2): 2 cells');
  });
  it('game', () => {
    const a = newGame('One');
    const b = newGame('One');
    b.scenes[1].desc = 'Done';
    const s = summarizeChange('x.gam', serializeGame(a), serializeGame(b)).summary;
    expect(s).toContain('scenes changed: 1');
    expect(s.join()).toContain('"Game Won" -> "Done"');
  });
  it('characters and monsters', () => {
    const a = newCharacter();
    const b = newCharacter();
    b.sequences[1].key = 5;
    expect(summarizeChange('x.chr', serializeCharacter(a), serializeCharacter(b)).summary[0]).toBe('sequences changed: 1');
    const m = newMonsterSet();
    const n = newMonsterSet();
    n[2].power = 7;
    expect(summarizeChange('x.mon', serializeMonsters(m), serializeMonsters(n)).summary[0]).toBe('1 monster changed: 2');
  });
  it('text', () => expect(summarizeChange('a.txt', enc('a\nb\n'), enc('a\nc\nd\n')).summary).toEqual(['2 lines added, 1 line removed']));
  it('gif', () => {
    const img = { width: 2, height: 2, pixels: new Uint8Array([0, 1, 2, 3]), palette: defaultPalette() };
    const s = summarizeChange('a.gif', encodeGif(img), encodeGif({ ...img, pixels: new Uint8Array([0, 1, 2, 4]) })).summary;
    expect(s).toEqual(['2x2', '1 pixel changed', 'palette same']);
  });
  it('fli', () => {
    const pal = new Uint8Array(768);
    const f = (v: number) => new Uint8Array(64 * 64).fill(v);
    const s = summarizeChange(
      'a.fli',
      encodeFli([f(1), f(2)], pal, { width: 64, height: 64 }),
      encodeFli([f(1), f(3)], pal, { width: 64, height: 64 }),
    ).summary;
    expect(s[0]).toBe('64x64, 3 frames -> 64x64, 3 frames');
    expect(s[2]).toBe('1 frame differs');
  });
  it('voc', () =>
    expect(summarizeChange('a.voc', encodeVoc(new Float32Array(11025)), encodeVoc(new Float32Array(22050))).summary).toEqual([
      '1.00 s at 10989 Hz -> 2.01 s at 10989 Hz',
    ]));
  it('bytes, and a short palette falls back to bytes', () => {
    expect(summarizeChange('a.dat', new Uint8Array([1, 2, 3]), new Uint8Array([1, 9, 3])).summary).toEqual([
      'same size (3 bytes)',
      '1 byte differs, the first at offset 1',
    ]);
    expect(summarizeChange('a.pal', new Uint8Array([1]), new Uint8Array([2])).summary[0]).toBe('same size (1 bytes)');
  });
});

describe('diffDisks', () => {
  it('lists added, removed and changed in sorted order, the same every time', () => {
    const a = new Map([
      ['b.txt', enc('x')],
      ['a.txt', enc('x')],
      ['gone.txt', enc('x')],
    ]);
    const b = new Map([
      ['new.txt', enc('x')],
      ['a.txt', enc('y')],
      ['b.txt', enc('x')],
    ]);
    const d = diffDisks(a, b);
    expect(d.added.map((f) => f.name)).toEqual(['new.txt']);
    expect(d.removed.map((f) => f.name)).toEqual(['gone.txt']);
    expect(d.changed.map((f) => f.name)).toEqual(['a.txt']);
    expect(d.unchanged).toBe(1);
    expect(formatDiff(d)).toBe(formatDiff(diffDisks(a, b)));
    expect(formatDiff(d).split('\n')[0]).toBe('1 file changed, 1 file added, 1 file removed, 1 unchanged');
  });
});
