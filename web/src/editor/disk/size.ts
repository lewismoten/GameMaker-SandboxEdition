// How much room a game needs as a DOS export (web/src/export/exportDos.ts): PLAYGAME's own files
// plus every file the export zip holds, and how many 3.5" disks that takes at 1.44 MB (high
// density) and at 720 KB (low, "double" density), packing whole files (DOS can't split one) and
// counting what FAT12 really gives: clusters, and the root directory's entry limit.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { WEB_ONLY } from '../../export/webOnly';
import { dosInstallFiles } from '../../export/dosInstall';
import { normalize, type GameFiles } from '../../project/files';

/** PLAYGAME's files as the DOS export adds them, plus setup, estimated notices and installation text. */
export const RUNTIME_FILES: [string, number][] = [
  ['XFERPLAY.EXE', 160598],
  ['SNDBLAST.DRV', 2493],
  ['CONFIG.HLP', 2722],
  ['CONFIG.BAT', 24],
  ['README.TXT', 1500],
  ...dosInstallFiles('XFERPLAY').map((e): [string, number] => [e.name, e.data.length]),
];

interface Density {
  label: string;
  /** Bytes a formatted disk holds (clusters x cluster size) and the root directory's entries. */
  clusters: number;
  clusterBytes: number;
  rootEntries: number;
}
export const HIGH: Density = { label: '1.44 MB', clusters: 2847, clusterBytes: 512, rootEntries: 224 };
export const LOW: Density = { label: '720 KB', clusters: 713, clusterBytes: 1024, rootEntries: 112 };

export interface SizeUp {
  files: [string, number][];
  /** Bytes of the game's own files, of PLAYGAME's, and the sum. */
  game: number;
  runtime: number;
  total: number;
  /** Files in the project the game never names (the DOS export still ships them). */
  unused: [string, number][];
  disks: { high: number; low: number };
}

/** Every file the .gam, and the pictures, slide shows and sound sets it names, open (stored names). */
function namedFiles(files: GameFiles, gam: string): Set<string> {
  const out = new Set<string>([normalize(gam)]);
  const add = (n: string | undefined) => {
    const at = files.resolve(n);
    if (at) out.add(at);
  };
  try {
    for (const s of parseGame(files.get(gam)!).scenes) for (const f of s.files) add(f);
  } catch {
    /* no or damaged .gam: nothing named */
  }
  for (const n of [...out]) {
    try {
      if (n.endsWith('.bkd')) add(parseBackdrop(files.get(n)!).gif);
      else if (n.endsWith('.lst')) for (const e of parseSlideList(files.get(n)!)) add(e.name);
      else if (n.endsWith('.snd')) for (const v of parseSoundSet(files.get(n)!).digital) if (v) add(`${v}.voc`);
    } catch {
      /* unreadable: leave its names alone */
    }
  }
  return out;
}

/** How many disks of one density the sizes take (first fit, largest first); Infinity when one file is bigger than a disk. */
export function disksFor(sizes: number[], d: Density): number {
  const room = d.clusters * d.clusterBytes;
  const slot = (n: number) => Math.max(1, Math.ceil(n / d.clusterBytes)) * d.clusterBytes;
  const disks: { left: number; entries: number }[] = [];
  for (const n of [...sizes].sort((a, b) => b - a)) {
    const need = slot(n);
    if (need > room) return Infinity;
    const at = disks.find((x) => x.left >= need && x.entries < d.rootEntries) ?? disks[disks.push({ left: room, entries: 0 }) - 1];
    at.left -= need;
    at.entries++;
  }
  return disks.length;
}

export function sizeUp(files: GameFiles, gam: string): SizeUp {
  const named = namedFiles(files, gam);
  const stored = files.names().filter((n) => !WEB_ONLY.test(n));
  const list: [string, number][] = stored.map((n) => [n, files.get(n)!.length]);
  const game = list.reduce((a, [, n]) => a + n, 0);
  const runtime = RUNTIME_FILES.reduce((a, [, n]) => a + n, 0);
  const sizes = [...list.map(([, n]) => n), ...RUNTIME_FILES.map(([, n]) => n)];
  return {
    files: list,
    game,
    runtime,
    total: game + runtime,
    unused: list.filter(([n]) => !named.has(n)),
    disks: { high: disksFor(sizes, HIGH), low: disksFor(sizes, LOW) },
  };
}

const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)} MB` : `${Math.round(n / 1000)} KB`);
const disks = (n: number) => (n === Infinity ? 'a file too big for one disk' : `${n} disk${n === 1 ? '' : 's'}`);

/** One plain line: the total and the disks it takes. */
export function floppyLine(s: SizeUp): string {
  const fits = s.disks.low === 1;
  return `${kb(s.total)} to run (${kb(s.game)} game + ${kb(s.runtime)} PLAYGAME): ${disks(s.disks.high)} at 1.44 MB, ${disks(s.disks.low)} at 720 KB; ${fits ? 'fits' : 'does not fit'} on one low density disk`;
}
