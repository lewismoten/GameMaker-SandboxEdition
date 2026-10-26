// An imported game's fingerprint: the CRC-32s of its .gam files and of its own player .EXEs,
// as the import scanner reads them (project/importScan.ts). Kept when the game is removed, so
// a later import can say "you removed this one before". No DOM.
import { crc32 } from '../project/zip';

export interface Fingerprint {
  /** Its .gam files' CRC-32s, smallest first. */
  gam: number[];
  /** Its player .EXEs' CRC-32s, smallest first; missing when they weren't known (a game imported before fingerprints were kept). */
  exe?: number[];
}

const sorted = (crcs: number[]) => [...new Set(crcs)].sort((a, b) => a - b);

/** A found game's fingerprint, from the scanner's CRCs. */
export function fingerprintOf(found: { gamCrcs: number[]; playerCrcs?: number[] }): Fingerprint {
  return { gam: sorted(found.gamCrcs), exe: sorted(found.playerCrcs ?? []) };
}

/** A stored game's fingerprint from its files (its players are not among them, so `exe` is unknown). */
export function fingerprintOfFiles(files: Record<string, Uint8Array>): Fingerprint {
  return {
    gam: sorted(
      Object.entries(files)
        .filter(([name]) => /\.gam$/i.test(name))
        .map(([, bytes]) => crc32(bytes)),
    ),
  };
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((n, i) => n === b[i]);

/** The same game: the same .gam files, and the same players when both are known. */
export function sameGame(a: Fingerprint, b: Fingerprint): boolean {
  return a.gam.length > 0 && same(a.gam, b.gam) && (!a.exe || !b.exe || same(a.exe, b.exe));
}

const hex = (n: number) => n.toString(16).toUpperCase().padStart(8, '0');

/** "GAM 1A2B3C4D · EXE 0F0E0D0C", for people. */
export function fingerprintText(f: Fingerprint): string {
  const parts = [`GAM ${f.gam.map(hex).join(', ') || 'none'}`];
  if (f.exe?.length) parts.push(`EXE ${f.exe.map(hex).join(', ')}`);
  return parts.join(' · ');
}
