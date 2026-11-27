// Whole-file 1.44 MB FAT12 layouts, not floppy images or sliced ZIP volumes.
import { deepStrictEqual } from 'node:assert';
import { expect, it } from 'vitest';
import type { ZipEntry } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { splitDosFiles } from './dosFloppies';
import { dosInstallFiles } from './dosInstall';

const entry = (name: string, size: number): ZipEntry => ({ name, data: new Uint8Array(size).fill(23) });
const base = [entry('TEST.EXE', 160598), entry('SNDBLAST.DRV', 2493), entry('CONFIG.HLP', 2722), entry('CONFIG.BAT', 24), entry('TEST.Z0G', 1000)];

it('packs complete files into FAT12 space and keeps the player, driver, setup and game on disk 1', () => {
  const files = [...base, ...dosInstallFiles('TEST'), entry('FIRST.VOC', 900000), entry('LAST.VOC', 900000)];
  const expected = files.map(({ name, data }) => ({ name, data: data.slice() }));
  const disks = splitDosFiles(files, 'TEST');
  expect(disks.length).toBe(2);
  // Node compares byte views directly; Vitest's iterable equality enumerates every byte key.
  deepStrictEqual(files, expected);
  for (const f of base) expect(disks[0].some((e) => e.name === f.name)).toBe(true);
  for (const [i, disk] of disks.entries()) {
    expect(disk.length).toBeLessThanOrEqual(224);
    expect(disk.reduce((sum, e) => sum + Math.ceil(e.data.length / 512) * 512, 0)).toBeLessThanOrEqual(2847 * 512);
    expect(disk.some((e) => e.name === `TEST.D0${i + 1}`)).toBe(true);
    const bat = disk.find((e) => e.name === 'INSTALL.BAT')!.data;
    deepStrictEqual(bat, disks[0].find((e) => e.name === 'INSTALL.BAT')!.data);
    expect(new TextDecoder().decode(bat)).toContain('Insert disk 2 of 2');
    expect(new TextDecoder().decode(bat)).toContain('IF EXIST TEST.D02 GOTO copy2');
  }
  for (const file of expected.filter((e) => !/^INSTALL\./.test(e.name))) {
    const copies = disks.flat().filter((e) => e.name === file.name);
    expect(copies.length).toBe(1);
    deepStrictEqual(copies[0].data, file.data);
  }
  deepStrictEqual(splitDosFiles(files, 'TEST'), disks);
});

it('counts directory slots as well as bytes, including empty files and installer overhead', () => {
  const files = [...base, ...Array.from({ length: 230 }, (_, n) => entry(`F${n}.TXT`, 0))];
  const disks = splitDosFiles(files, 'TEST');
  expect(disks.length).toBe(2);
  expect(disks.every((disk) => disk.length <= 224)).toBe(true);
});

it('rejects oversized files, first-disk overflow, collisions and non-flat DOS names without changing input', () => {
  expect(() => splitDosFiles([...base, entry('BIG.VOC', 1474560)], 'TEST')).toThrow(/fit/);
  expect(() =>
    splitDosFiles(
      base.map((e) => (e.name === 'TEST.Z0G' ? entry(e.name, 1400000) : e)),
      'TEST',
    ),
  ).toThrow(/disk 1/);
  expect(() => splitDosFiles([...base, entry('DISK2.ID', 1)], 'TEST')).toThrow(/reserved/);
  expect(() => splitDosFiles([...base, entry('ELSE.D02', 1)], 'TEST')).toThrow(/reserved/);
  expect(() => splitDosFiles([...base, entry('test.exe', 1)], 'TEST')).toThrow(/duplicate/i);
  expect(() => splitDosFiles([...base, entry('../X.TXT', 1)], 'TEST')).toThrow(/DOS/);
  expect(() => splitDosFiles([...base, entry('INSTALL.TXT', 10)], 'TEST')).toThrow(/author/);
});

it('continues from the installed batch and checks both the game and disk before copying', () => {
  const set = (stem: string) =>
    splitDosFiles([entry(stem + '.EXE', 1), entry('SNDBLAST.DRV', 1), entry('CONFIG.BAT', 1), entry('A.VOC', 900000), entry('B.VOC', 900000)], stem);
  const [first, second] = set('TEST');
  const other = set('ELSE')[1];
  const bat = new TextDecoder().decode(first.find((e) => e.name === 'INSTALL.BAT')!.data);
  const marker = /IF EXIST (\S+) GOTO copy2/.exec(bat)![1];
  expect(second.some((e) => e.name === marker)).toBe(true);
  expect(other.some((e) => e.name === marker)).toBe(false);
  expect(first.some((e) => e.name === marker)).toBe(false);
  expect(bat).toContain('IF "%1"=="NEXT" GOTO disk1');
  expect(bat).toContain('GOTO disk2\r\n:copy2\r\nCOPY /B *.*');
  expect(bat).toContain('%GMIDRV%\\TEST\\INSTALL.BAT NEXT');
});
