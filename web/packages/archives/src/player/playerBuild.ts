// Which Game-Maker build a player .EXE is (1.0 through 3.00), and what its author changed. Read in
// order: its size and MD5 against each build's stock copy (playerBuildData.ts; a buyer's owner
// field ignored), then the "Version x.xx" line RSD's About text holds 26 bytes before
// "Recreational Software Designs" (at any offset), then "unknown". Each answer carries a
// confidence and the reasons for it, never more certainty than the bytes give. Nothing is run.
import { md5Hex } from './md5';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { crc32 } from '../project/zip';
import { BLOCK, BUILD_DATA, type BuildData } from './playerBuildData';

type Confidence = 'high' | 'medium' | 'low';

export interface PlayerIdentity {
  /** '1.0', '1.04', '2.00', '2.02', '2.04', '3.00', '3.00-playgame', or 'unknown'. */
  build: string;
  /** For people: "Game-Maker 2.02", "Game-Maker 3.00 (PLAYGAME.EXE)" or "an unknown Game-Maker build". */
  label: string;
  confidence: Confidence;
  reasons: string[];
  /** True when every byte is the build's stock copy (its owner field aside). */
  stock: boolean;
  /** The About page's version line as this copy has it (an author could edit it). */
  versionLine?: string;
  /** Who replaced RSD's About text, as that text names them. */
  aboutAuthor?: string;
}

const RSD = 'Recreational Software Designs';
const VERSION = /^\s*Version (\d\.\d{1,2})\s*$/;

export const buildData = (id: string): BuildData | undefined => BUILD_DATA.find((b) => b.id === id);

/** "Game-Maker 2.02"; the CD's PLAYGAME.EXE is named as such. */
export function buildLabel(id: string): string {
  if (id === '3.00-playgame') return 'Game-Maker 3.00 (PLAYGAME.EXE)';
  return BUILD_DATA.some((b) => b.id === id) ? `Game-Maker ${id}` : 'an unknown Game-Maker build';
}

/** The NUL-ended string at `o`. */
function stringAt(exe: Uint8Array, o: number, max = 80): string {
  let s = '';
  for (let i = o; i < exe.length && exe[i] && s.length < max; i++) s += String.fromCharCode(exe[i]);
  return s;
}

function indexOfText(exe: Uint8Array, text: string): number {
  outer: for (let i = 0; i + text.length <= exe.length; i++) {
    for (let k = 0; k < text.length; k++) if (exe[i + k] !== text.charCodeAt(k)) continue outer;
    return i;
  }
  return -1;
}

/** A copy with the build's owner field zeroed (what its MD5 and block CRCs were taken of). */
export function withoutOwner(exe: Uint8Array, b: BuildData): Uint8Array {
  const z = exe.slice();
  if (b.owner) z.fill(0, b.owner[0], b.owner[0] + b.owner[1]);
  return z;
}

/** The About page's lines, read from the build's string slots. */
export function aboutLines(exe: Uint8Array, b: BuildData): string[] {
  return b.about.map((o) => stringAt(exe, o, 40));
}

/** Who an About text names: "copyright 1992 by X", else its first line. */
function authorOf(lines: string[]): string | undefined {
  for (const l of lines) {
    const m = /(?:copyright|\(c\))\s*\d{4}\s+by\s+(.+)/i.exec(l);
    if (m) return m[1].trim();
  }
  return lines.map((l) => l.trim()).find((l) => /[A-Za-z]{2}/.test(l));
}

/** The indexes of the 128-byte blocks of `exe` (owner field zeroed) that differ from the build's stock copy. */
export function changedBlocks(exe: Uint8Array, b: BuildData): number[] {
  const crc = Uint8Array.from(atob(b.crc), (c) => c.charCodeAt(0));
  const z = withoutOwner(exe, b);
  const out: number[] = [];
  for (let i = 0; i * BLOCK < z.length; i++) {
    const c = crc32(z.subarray(i * BLOCK, (i + 1) * BLOCK));
    if ((c & 0xff) !== crc[i * 2] || ((c >> 8) & 0xff) !== crc[i * 2 + 1]) out.push(i);
  }
  return out;
}

/** True when a run of the About page's slots lies in a changed block. */
export function aboutChanged(b: BuildData, blocks: number[]): boolean {
  const set = new Set(blocks);
  return b.about.some((o) => set.has(Math.floor(o / BLOCK)));
}

/** True for a player squeezed by PKLITE or LZEXE (its strings can't be read). */
function isCompressed(exe: Uint8Array): boolean {
  const head = String.fromCharCode(...exe.subarray(0, 120));
  return /PKLITE|PKlite|LZ09|LZ91/.test(head);
}

export function identifyPlayer(exe: Uint8Array): PlayerIdentity {
  const reasons: string[] = [];
  const sig = indexOfText(exe, RSD);
  const line = sig >= 26 ? stringAt(exe, sig - 26, 30) : undefined;
  const said = line !== undefined ? VERSION.exec(line)?.[1] : undefined;
  const sized = BUILD_DATA.filter((b) => b.size === exe.length);
  for (const b of sized) {
    if (md5Hex(withoutOwner(exe, b)) === b.md5) {
      reasons.push(
        `${exe.length.toLocaleString('en-US')} bytes and every byte as ${buildLabel(b.id)}’s own copy has it${b.owner ? ' (its owner field aside)' : ''}`,
      );
      return { build: b.id, label: buildLabel(b.id), confidence: 'high', reasons, stock: true, versionLine: stringAt(exe, b.version, 30).trim() };
    }
  }
  if (sized.length) {
    const b = sized[0];
    const own = stringAt(exe, b.version, 30);
    const versionLine = own.trim();
    reasons.push(`${exe.length.toLocaleString('en-US')} bytes, the size of ${buildLabel(b.id)}’s player`);
    reasons.push(`${changedBlocks(exe, b).length} of its ${Math.ceil(exe.length / BLOCK)} 128-byte blocks differ from the stock copy`);
    const id: PlayerIdentity = { build: b.id, label: buildLabel(b.id), confidence: 'medium', reasons, stock: false, versionLine };
    if (sig === b.version + 26 && VERSION.exec(own)?.[1] === b.id.replace('-playgame', '')) {
      reasons.push(`its About text says “${versionLine}” where that build has it`);
      id.confidence = 'high';
    } else if (said) {
      reasons.push(`its About text says “${fromCp437(line!).trim()}”${sig === b.version + 26 ? ', an edited version line' : ' at another offset'}`);
    } else {
      id.aboutAuthor = authorOf(aboutLines(exe, b));
      reasons.push(
        `RSD’s About text is replaced${id.aboutAuthor ? ` (by ${fromCp437(id.aboutAuthor)}, as the new text says)` : ''}, so no version line backs the size`,
      );
    }
    return id;
  }
  if (said) {
    const known = BUILD_DATA.find((b) => b.id === said);
    reasons.push(`no known build is ${exe.length.toLocaleString('en-US')} bytes, but its About text says “${line!.trim()}”`);
    return {
      build: 'unknown',
      label: known ? `${buildLabel(known.id)} (a copy of another size)` : buildLabel('unknown'),
      confidence: 'low',
      reasons,
      stock: false,
      versionLine: line!.trim(),
    };
  }
  reasons.push(
    isCompressed(exe)
      ? 'it is compressed (PKLITE or LZEXE), so its size and text can’t be compared'
      : `no known build is ${exe.length.toLocaleString('en-US')} bytes and it has no Game-Maker version line`,
  );
  return { build: 'unknown', label: buildLabel('unknown'), confidence: 'low', reasons, stock: false };
}

export interface FolderEstimate {
  /** "3.00", "2.00 or later", "before 3.00", or "unknown". */
  estimate: string;
  confidence: Confidence;
  reasons: string[];
}

/**
 * What a folder without a readable player says about the build it was made with. Every
 * pre-3.00 .gam is 6,600 bytes with no version in it, so this is an estimate with reasons.
 */
export function estimateFromFolder(names: string[], gams: Uint8Array[]): FolderEstimate {
  const reasons: string[] = [];
  const v300 = gams.some((g) => g.length > 4 && g[0] === 0x47 && g[1] === 0x4d);
  const ext = (n: string) => n.toLowerCase().replace(/^.*\./, '');
  const cmf = names.some((n) => ext(n) === 'cmf');
  const title = names.some((n) => /(^|[\\/])gmtitle\.gif$/i.test(n));
  if (v300) {
    reasons.push('its .gam starts with the “GM” header Game-Maker 3.00 writes');
    return { estimate: '3.00', confidence: 'high', reasons };
  }
  if (gams.length) reasons.push('its .gam has the pre-3.00 layout, which every build from 1.0 to 2.04 wrote alike');
  if (cmf) reasons.push('it has CMF songs, which the 1.0 and 1.04 players can’t play (they have no FM music code)');
  if (title) reasons.push('it has gmtitle.gif, the title picture the players before 3.00 show first');
  if (cmf) return { estimate: '2.00 or later, before 3.00', confidence: gams.length ? 'medium' : 'low', reasons };
  if (gams.length || title) return { estimate: 'before 3.00', confidence: 'medium', reasons };
  reasons.push('nothing in the folder names a build');
  return { estimate: 'unknown', confidence: 'low', reasons };
}
