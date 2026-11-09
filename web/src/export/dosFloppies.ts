// Lay a DOS export out on formatted 1.44 MB FAT12 disks. Files are never sliced or rewritten.
import type { ZipEntry } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { dosInstallFiles, isGeneratedDosInstall } from './dosInstall';

const room = 2847 * 512;
const slots = 224;
const allocation = (e: ZipEntry) => Math.ceil(e.data.length / 512) * 512;

export function splitDosFiles(entries: ZipEntry[], stem: string): ZipEntry[][] {
  const names = new Set<string>();
  for (const e of entries) {
    const name = e.name.toUpperCase();
    if (!/^[A-Z0-9_'\-~!@#$%^&()]{1,8}(\.[A-Z0-9_'\-~!@#$%^&()]{1,3})?$/.test(name)) throw new Error(`Not a flat DOS name: ${e.name}`);
    if (names.has(name)) throw new Error(`Duplicate DOS name: ${name}`);
    if (/^DISK\d+\.ID$/.test(name)) throw new Error(`${name} is reserved for disk markers.`);
    if (/^INSTALL\.(BAT|TXT)$/.test(name) && !isGeneratedDosInstall(name, e.data, stem))
      throw new Error(`Keep the author's own ${name}; not generated installation support.`);
    names.add(name);
  }
  for (const name of [`${stem}.EXE`, 'SNDBLAST.DRV', 'CONFIG.BAT']) if (!names.has(name)) throw new Error(`Not a standalone DOS export: missing ${name}`);
  const payload = entries.filter((e) => !/^INSTALL\.(BAT|TXT)$/i.test(e.name)).map((e) => ({ ...e, name: e.name.toUpperCase() }));
  const first = (e: ZipEntry) => e.name.startsWith(`${stem}.`) || ['SNDBLAST.DRV', 'CONFIG.BAT', 'CONFIG.HLP'].includes(e.name);
  const required = payload.filter(first);
  const rest = payload.filter((e) => !first(e)).sort((a, b) => b.data.length - a.data.length || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  // Installer size depends on N. Repack until the reserved text agrees with N;
  // extra prompts only increase overhead, so the disk count never shrinks.
  let count = 1;
  for (;;) {
    const support = dosInstallFiles(stem, count);
    const overhead = support.reduce((sum, e) => sum + allocation(e), 512); // one nonempty marker
    const capacity = room - overhead;
    const diskSlots = slots - support.length - 1;
    if (required.reduce((sum, e) => sum + allocation(e), 0) > capacity || required.length > diskSlots)
      throw new Error('Player, setup and main game do not fit on disk 1.');
    const disks: ZipEntry[][] = [[...required]];
    const used = [required.reduce((sum, e) => sum + allocation(e), 0)];
    for (const e of rest) {
      const size = allocation(e);
      if (size > capacity) throw new Error(`${e.name} cannot fit on a disk; files are never split.`);
      let at = disks.findIndex((disk, i) => disk.length < diskSlots && used[i] + size <= capacity);
      if (at < 0) {
        at = disks.length;
        disks.push([]);
        used.push(0);
      }
      disks[at].push(e);
      used[at] += size;
    }
    if (disks.length > 99) throw new Error('More than 99 disks would be needed.');
    if (disks.length !== count) {
      count = disks.length;
      continue;
    }
    return disks.map((disk, i) => [...support, { name: `DISK${i + 1}.ID`, data: new TextEncoder().encode(`${stem} disk ${i + 1} of ${count}\r\n`) }, ...disk]);
  }
}
