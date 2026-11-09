// Whole-file 1.44 MB FAT12 layouts, not floppy images or sliced ZIP volumes.
import { expect, it } from 'vitest';
import type { ZipEntry } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { splitDosFiles } from './dosFloppies';
import { dosInstallFiles } from './dosInstall';

const entry = (name: string, size: number): ZipEntry => ({ name, data: new Uint8Array(size).fill(23) });
const base = [entry('TEST.EXE', 160598), entry('SNDBLAST.DRV', 2493), entry('CONFIG.HLP', 2722), entry('CONFIG.BAT', 24), entry('TEST.Z0G', 1000)];

it('packs complete files into FAT12 space and keeps the player, driver, setup and game on disk 1', () => {
  const files = [...base, ...dosInstallFiles('TEST'), entry('FIRST.VOC', 900000), entry('LAST.VOC', 900000)];
  const disks = splitDosFiles(files, 'TEST');
  expect(disks.length).toBe(2);
  for (const f of base) expect(disks[0].find((e) => e.name === f.name)?.data).toEqual(f.data);
  for (const [i, disk] of disks.entries()) {
    expect(disk.length).toBeLessThanOrEqual(224);
    expect(disk.reduce((sum, e) => sum + Math.ceil(e.data.length / 512) * 512, 0)).toBeLessThanOrEqual(2847 * 512);
    expect(disk.some((e) => e.name === `DISK${i + 1}.ID`)).toBe(true);
    const bat = disk.find((e) => e.name === 'INSTALL.BAT')!.data;
    expect(bat).toEqual(disks[0].find((e) => e.name === 'INSTALL.BAT')!.data);
    expect(new TextDecoder().decode(bat)).toContain('Insert disk 2 of 2');
    expect(new TextDecoder().decode(bat)).toContain('IF EXIST DISK2.ID GOTO copy2');
  }
  for (const file of files.filter((e) => !/^INSTALL\./.test(e.name))) {
    const copies = disks.flat().filter((e) => e.name === file.name);
    expect(copies.length).toBe(1);
    expect(copies[0].data).toEqual(file.data);
  }
  expect(splitDosFiles(files, 'TEST')).toEqual(disks);
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
  expect(() => splitDosFiles([...base, entry('test.exe', 1)], 'TEST')).toThrow(/duplicate/i);
  expect(() => splitDosFiles([...base, entry('../X.TXT', 1)], 'TEST')).toThrow(/DOS/);
  expect(() => splitDosFiles([...base, entry('INSTALL.TXT', 10)], 'TEST')).toThrow(/author/);
});
