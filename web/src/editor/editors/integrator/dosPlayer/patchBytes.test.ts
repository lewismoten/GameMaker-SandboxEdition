// The Patch Lab's byte diff agrees with applyPlayerPatches on the real CD player, one entry of every kind.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATCHES } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import { patchEntry, type PatchValue } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { applyPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { byteRuns, hexOffset, runsOf } from './patchBytes';

const exe = new Uint8Array(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../../../cd/gm/xferplay.exe')));

const SAMPLES: [string, PatchValue][] = [
  ['str.menu.play', 'Go!!'],
  ['str.invent.score', 'Pts:  %ld'],
  ['layout.menu.play.x', 100],
  ['color.rgb.yellow', [0, 63, 63]],
  ['color.select.menu', 'red'],
  ['border.invent.outer', [20, 20, 300, 180]],
  ['table.fkeys.F5', 'off'],
];

describe('byteRuns', () => {
  it('covers one entry of every kind', () => {
    expect(new Set(SAMPLES.map(([id]) => patchEntry(id)!.kind))).toEqual(new Set(['text', 'format', 'number', 'rgb', 'select', 'frame', 'fkey']));
  });

  it.each(SAMPLES)('%s: stock bytes are the CD file’s, new bytes are what applyPlayerPatches writes', (id, value) => {
    const e = patchEntry(id)!;
    const out = applyPlayerPatches(exe, { [id]: value });
    const runs = byteRuns(e, value);
    expect(runs.length).toBe(runsOf(e).length);
    for (const r of runs) {
      expect(r.stock, `${id} stock at ${hexOffset(r.offset)}`).toEqual(Array.from(exe.subarray(r.offset, r.offset + r.stock.length)));
      expect(r.now, `${id} new at ${hexOffset(r.offset)}`).toEqual(Array.from(out.subarray(r.offset, r.offset + r.now.length)));
      expect(r.changed).toEqual(r.now.map((b, i) => b !== r.stock[i]));
    }
    expect(runs.some((r) => r.changed.some(Boolean))).toBe(true);
  });

  it('marks only the bytes that differ: "Go!!" over "Play" changes four, a longer shared prefix fewer', () => {
    const e = patchEntry('str.menu.play')!;
    expect(byteRuns(e, 'Go!!')[0].changed).toEqual([true, true, true, true]);
    expect(byteRuns(e, 'Pla').map((r) => r.changed)).toEqual([[false, false, false, true]]);
    expect(byteRuns(e, 'Pla')[0].nowText).toBe('Pla ');
    expect(byteRuns(e, 'Play')[0].changed).toEqual([false, false, false, false]);
  });

  it('every entry of the table has runs that lie inside the CD file and reproduce its stock bytes', () => {
    for (const e of PATCHES) {
      const stockValue = e.kind === 'fkey' ? 'on' : e.stock;
      for (const r of byteRuns(e, stockValue)) {
        expect(r.offset + r.stock.length, e.id).toBeLessThanOrEqual(exe.length);
        expect(r.stock, e.id).toEqual(Array.from(exe.subarray(r.offset, r.offset + r.stock.length)));
        expect(r.changed.some(Boolean), e.id).toBe(false);
      }
    }
  });
});
