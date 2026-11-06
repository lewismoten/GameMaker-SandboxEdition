// Raw FAT12 data floppy geometry and byte-identical DOS export (no catalog lookup).
import { expect, it } from 'vitest';
import { makeFloppy, dosFiles } from '../../games/kit/testdisks/sound-stress/floppy';
import { makeDisk } from '../../games/kit/testdisks/sound-stress/disk';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('exports SOUNDTST runtime and every unmodified native resource', async () => {
  const files = await dosFiles();
  for (const [name, bytes] of makeDisk('unused').files) expect(files.get(name.toUpperCase())).toEqual(bytes);
  expect(files.get('SOUNDTST.EXE')).toEqual(new Uint8Array(readFileSync(resolve(import.meta.dirname, '../../cd/gm/xferplay.exe'))));
  for (const name of ['SNDBLAST.DRV', 'CONFIG.HLP', 'CONFIG.BAT']) expect(files.has(name)).toBe(true);
  const img = makeFloppy(files);
  expect(img).toEqual(makeFloppy(files));
  expect(img.length).toBe(1474560);
  const view = new DataView(img.buffer);
  expect([view.getUint16(11, true), img[13], view.getUint16(19, true), img[21], view.getUint16(24, true), view.getUint16(26, true)]).toEqual([
    512, 1, 2880, 0xf0, 18, 2,
  ]);
  expect(img.subarray(512, 512 + 4608)).toEqual(img.subarray(512 + 4608, 512 + 9216));
  // Independent root-directory and FAT-chain reader: no writer constants or helpers reused.
  const root = 19 * 512;
  const fat = img.subarray(512, 10 * 512);
  const next = (n: number) => {
    const pos = Math.floor(n * 1.5);
    const pair = fat[pos] | (fat[pos + 1] << 8);
    return n & 1 ? pair >> 4 : pair & 0xfff;
  };
  const found = new Map<string, Uint8Array>();
  for (let slot = root; slot < root + 224 * 32 && img[slot]; slot += 32) {
    if (img[slot + 11] & 8) continue;
    const name = new TextDecoder().decode(img.subarray(slot, slot + 8)).trim() + '.' + new TextDecoder().decode(img.subarray(slot + 8, slot + 11)).trim();
    const size = view.getUint32(slot + 28, true);
    const data: number[] = [];
    let cluster = view.getUint16(slot + 26, true);
    const seen = new Set<number>();
    while (cluster >= 2 && cluster < 0xff8) {
      expect(seen.has(cluster)).toBe(false);
      seen.add(cluster);
      data.push(...img.subarray((33 + cluster - 2) * 512, (34 + cluster - 2) * 512));
      cluster = next(cluster);
    }
    found.set(name, Uint8Array.from(data.slice(0, size)));
  }
  expect(found).toEqual(files);
}, 15000);

it('rejects oversized payloads and non-DOS names rather than making a broken disk', () => {
  expect(() => makeFloppy(new Map([['BIG.BIN', new Uint8Array(1474560)]]))).toThrow(/fit/);
  expect(() => makeFloppy(new Map([['too-long-name.bin', new Uint8Array(1)]]))).toThrow(/8.3/);
});
