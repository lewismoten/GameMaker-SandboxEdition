// The W)arez area's releases (warezArea.ts is the area itself): what each ZIP holds, its size and
// file points, and the access code. Apart from the area so the C: drive's listing of downloads
// (retro/hacks/deskFiles.ts) loads only this, not the BBS terminal.
import type { ProgramRef } from '../dos/vfs';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { GMCRACK_DIZ, GMCRACK_NFO } from '../hacks/gmcrackText';
import { SAVEHACK_DIZ, SAVEHACK_DOC } from '../hacks/saveHackText';
import { FASTPLAY_DIZ, FASTPLAY_DOC } from '../hacks/fastPlayText';
import { REGGIE_DIZ, REGGIE_DOC } from '../hacks/reggieText';
import { FLAGS_DIZ, FLAGS_NFO } from '../hacks/flagsText';
import { PLAYHACK_DIZ, PLAYHACK_NFO } from '../hacks/playHackText';
import { PATCHING_DIZ, PATCHING_TXT } from '../hacks/patchingText';
import { GM30_DIZ, GM30_NFO, GM30_PART_BYTES, GM30_PARTS } from '../hacks/gm30Text';

interface WarezFile {
  name: string;
  size: number;
  /** A text file's lines (CP437 is applied when read). */
  text?: string[];
  run?: ProgramRef;
  /** Which of a multi-ZIP release's parts holds it (0, the first, by default). */
  part?: number;
}

export interface WarezRelease {
  /** The download's id, and its folder: C:\DOWNLOAD\<ID>. */
  id: string;
  /** The name in the listing (a multi-ZIP release's set name). */
  zip: string;
  /** The ZIPs downloaded, for a release split over several. */
  parts?: string[];
  /** The archive's size on the board (all parts). */
  bytes: number;
  diz: string[];
  /** What PKUNZIP puts in the folder, besides FILE_ID.DIZ. */
  files: WarezFile[];
}

export const WAREZ: WarezRelease[] = [
  {
    id: 'gmcrack',
    zip: 'GMCRACK.ZIP',
    bytes: 31_377,
    diz: GMCRACK_DIZ,
    files: [
      { name: 'GMCRACK.EXE', size: 42_667, run: { kind: 'gmcrack' } },
      { name: 'GMCRACK.NFO', size: 0, text: GMCRACK_NFO },
    ],
  },
  {
    id: 'savehack',
    zip: 'SAVEHACK.ZIP',
    bytes: 24_918,
    diz: SAVEHACK_DIZ,
    files: [
      { name: 'SAVEHACK.EXE', size: 38_214, run: { kind: 'savehack' } },
      { name: 'SAVEHACK.DOC', size: 0, text: SAVEHACK_DOC },
    ],
  },
  {
    id: 'playhack',
    zip: 'PLAYHACK.ZIP',
    bytes: 27_604,
    diz: PLAYHACK_DIZ,
    files: [
      { name: 'PLAYHACK.EXE', size: 40_118, run: { kind: 'playhack' } },
      { name: 'PLAYHACK.NFO', size: 0, text: PLAYHACK_NFO },
    ],
  },
  {
    id: 'patching',
    zip: 'PATCHING.ZIP',
    bytes: 3_212,
    diz: PATCHING_DIZ,
    files: [{ name: 'PATCHING.TXT', size: 0, text: PATCHING_TXT }],
  },
  {
    id: 'gm30',
    zip: 'GM30.ZIP',
    parts: GM30_PARTS,
    bytes: GM30_PARTS.length * GM30_PART_BYTES,
    diz: GM30_DIZ,
    files: [
      { name: 'INSTALL.EXE', size: 61_421, run: { kind: 'install', from: 'warez' } },
      { name: 'GM30.NFO', size: 0, text: GM30_NFO },
      ...GM30_PARTS.map((_, i) => ({ name: `GM30.00${i + 1}`, size: GM30_PART_BYTES - 1_517 - i * 211, part: i })),
    ],
  },
  {
    id: 'fastplay',
    zip: 'FASTPLAY.ZIP',
    bytes: 4_096,
    diz: FASTPLAY_DIZ,
    files: [
      { name: 'FASTPLAY.EXE', size: 6_144, run: { kind: 'fastplay' } },
      { name: 'FASTPLAY.DOC', size: 0, text: FASTPLAY_DOC },
    ],
  },
  {
    id: 'reggie',
    zip: 'REGGIE.ZIP',
    bytes: 5_632,
    diz: REGGIE_DIZ,
    files: [
      { name: 'REGGIE.EXE', size: 7_168, run: { kind: 'reggie' } },
      { name: 'REGGIE.DOC', size: 0, text: REGGIE_DOC },
    ],
  },
  {
    id: 'flags',
    zip: 'FLAGS.ZIP',
    bytes: 21_337,
    diz: FLAGS_DIZ,
    files: [
      { name: 'FLAGS.EXE', size: 24_576, run: { kind: 'flags' } },
      { name: 'FLAGS.NFO', size: 0, text: FLAGS_NFO },
    ],
  },
];

/** The ZIPs a release downloads as. */
export const zipsOf = (r: WarezRelease): string[] => r.parts ?? [r.zip];

/** File points a release costs: one a ZIP. */
export const pointsFor = (r: WarezRelease): number => zipsOf(r).length;

/** The access code bulletin 7 gives (the group's name: DiGiTAL DUNE). */
export const ACCESS_CODE = 'DUNE';

/** Is the typed code the right one (any case, spaces ignored)? */
export const accessOk = (typed: string): boolean => typed.replace(/\s+/g, '').toUpperCase() === ACCESS_CODE;

/** A text file's bytes: CP437, CR LF line ends. */
export function textBytes(lines: string[]): Uint8Array {
  const text = toCp437(lines.map((l) => `${l}\r\n`).join(''));
  return Uint8Array.from(text, (c) => c.charCodeAt(0) & 255);
}

export const fileSize = (f: WarezFile): number => (f.text ? textBytes(f.text).length : f.size);
