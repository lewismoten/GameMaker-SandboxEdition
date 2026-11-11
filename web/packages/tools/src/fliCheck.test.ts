// Portable animation findings against native game files.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { fliCheck } from './fliCheck';

function animation(types: number[]): Uint8Array {
  const bytes = new Uint8Array(128 + 16 + types.length * 6);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, bytes.length, true);
  view.setUint16(4, 0xaf11, true);
  view.setUint16(6, 1, true);
  view.setUint16(12, 8, true);
  view.setUint32(128, bytes.length - 128, true);
  view.setUint16(132, 0xf1fa, true);
  view.setUint16(134, types.length, true);
  types.forEach((type, i) => {
    view.setUint32(144 + i * 6, 6, true);
    view.setUint16(148 + i * 6, type, true);
  });
  return bytes;
}

describe('animations DOS can’t play', () => {
  it('ignores empty sources, non-animations and readable animations', () => {
    expect(fliCheck(new GameFiles())).toEqual([]);
    expect(
      fliCheck(
        new GameFiles([
          ['readme.txt', animation([13])],
          ['invalid.fli', new Uint8Array(128)],
          ['valid.fli', animation([])],
        ]),
      ),
    ).toEqual([]);
  });

  it('allows a file source to lack bytes for a listed animation', () => {
    expect(fliCheck({ byExtension: () => ['missing.fli'], get: () => undefined })).toEqual([]);
  });

  it('keeps file order and summarizes additional faults without changing the finding shape', () => {
    expect(
      fliCheck(
        new GameFiles([
          ['z.fli', animation([13])],
          ['a.fli', animation([13, 99])],
        ]),
      ),
    ).toEqual([
      {
        check: 'fli',
        severity: 'warning',
        title: 'a.fli can’t play right in real DOS: an all-black chunk in its first frame (PLAYGAME crashes on it)',
        detail:
          'It has 1 more: a chunk of type 99 in its first frame (PLAYGAME stops at it). Open it in the Animation editor and save any change (even one you then undo): the editor writes it again in pieces DOS reads, and it looks the same.',
        where: { file: 'a.fli' },
      },
      {
        check: 'fli',
        severity: 'warning',
        title: 'z.fli can’t play right in real DOS: an all-black chunk in its first frame (PLAYGAME crashes on it)',
        detail:
          'Open it in the Animation editor and save any change (even one you then undo): the editor writes it again in pieces DOS reads, and it looks the same.',
        where: { file: 'z.fli' },
      },
    ]);
  });
  it('finds an .FLI with an all-black chunk', () => {
    const fli = new Uint8Array(128 + 22);
    const dv = new DataView(fli.buffer);
    dv.setUint32(0, fli.length, true);
    dv.setUint16(4, 0xaf11, true);
    dv.setUint16(6, 1, true);
    dv.setUint16(12, 8, true);
    dv.setUint32(128, 22, true);
    dv.setUint16(132, 0xf1fa, true);
    dv.setUint16(134, 1, true);
    dv.setUint32(144, 6, true);
    dv.setUint16(148, 13, true);
    const f = fliCheck(new GameFiles([['intro.fli', fli]]));
    expect(f.map((x) => x.title)).toEqual(['intro.fli can’t play right in real DOS: an all-black chunk in its first frame (PLAYGAME crashes on it)']);
    expect(f[0].where.file).toBe('intro.fli');
  });
});
