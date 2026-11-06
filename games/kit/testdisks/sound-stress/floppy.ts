// A single 1.44 MB FAT12 data image, matching newfs_msdos -f 1440 geometry. Not bootable.
// No splitting needed for this diagnostic. Does not depend on a sibling installer branch.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { exportDos } from '../../../../web/src/export/exportDos';
import { makeDisk } from './disk';

export async function dosFiles(): Promise<Map<string, Uint8Array>> {
  const gm = resolve(import.meta.dirname, '../../../../cd/gm');
  const bytes = (name: string) => new Uint8Array(readFileSync(resolve(gm, name)));
  const exported = await exportDos(new GameFiles(makeDisk('unused').files), {
    gam: 'soundtst.gam',
    title: 'SOUND STRESS',
    date: new Date('2026-11-06T00:00:00Z'),
    runtime: { player: bytes('xferplay.exe'), driver: bytes('sndblast.drv'), help: bytes('config.hlp') },
  });
  return new Map((await readZip(exported.zip)).map((entry) => [entry.name, entry.data]));
}

export function makeFloppy(files: ReadonlyMap<string, Uint8Array>): Uint8Array {
  if (files.size > 223) throw new Error('Files do not fit the FAT12 root directory');
  const img = new Uint8Array(1474560);
  const view = new DataView(img.buffer);
  const ascii = (offset: number, text: string) => img.set(new TextEncoder().encode(text), offset);
  img.set([0xeb, 0x3c, 0x90]);
  ascii(3, 'MSDOS5.0');
  view.setUint16(11, 512, true);
  img[13] = 1;
  view.setUint16(14, 1, true);
  img[16] = 2;
  view.setUint16(17, 224, true);
  view.setUint16(19, 2880, true);
  img[21] = 0xf0;
  view.setUint16(22, 9, true);
  view.setUint16(24, 18, true);
  view.setUint16(26, 2, true);
  img[38] = 0x29;
  view.setUint32(39, 0x534e4454, true);
  ascii(43, 'SOUNDTST   ');
  ascii(54, 'FAT12   ');
  img.set([0xfa, 0xf4, 0xeb, 0xfd], 62); // halt, not a DOS boot disk
  img.set([0x55, 0xaa], 510);
  const fat = new Uint8Array(9 * 512);
  fat.set([0xf0, 0xff, 0xff]);
  const set = (n: number, value: number) => {
    const offset = Math.floor((n * 3) / 2);
    if (n & 1) {
      fat[offset] = (fat[offset] & 15) | ((value << 4) & 0xf0);
      fat[offset + 1] = value >> 4;
    } else {
      fat[offset] = value & 255;
      fat[offset + 1] = (fat[offset + 1] & 0xf0) | (value >> 8);
    }
  };
  let cluster = 2;
  let slot = 19 * 512;
  // Label consumes one of the 224 root entries, not a file.
  ascii(slot, 'SOUNDTST   ');
  img[slot + 11] = 8;
  slot += 32;
  const seen = new Set<string>();
  for (const [name, data] of files) {
    if (!/^[A-Z0-9_$~!#%&-]{1,8}\.[A-Z0-9]{1,3}$/.test(name) || seen.has(name)) throw new Error(`Invalid or duplicate DOS 8.3 name: ${name}`);
    seen.add(name);
    const count = Math.ceil(data.length / 512);
    if (cluster + count > 2849) throw new Error('Files do not fit one 1.44 MB floppy');
    const [base, ext] = name.split('.');
    ascii(slot, base.padEnd(8) + ext.padEnd(3));
    img[slot + 11] = 0x20;
    view.setUint16(slot + 24, ((2026 - 1980) << 9) | (11 << 5) | 6, true);
    view.setUint16(slot + 26, count ? cluster : 0, true);
    view.setUint32(slot + 28, data.length, true);
    img.set(data, (33 + cluster - 2) * 512);
    for (let n = 0; n < count; n++) set(cluster + n, n === count - 1 ? 0xfff : cluster + n + 1);
    cluster += count;
    slot += 32;
  }
  img.set(fat, 512);
  img.set(fat, 10 * 512);
  return img;
}
