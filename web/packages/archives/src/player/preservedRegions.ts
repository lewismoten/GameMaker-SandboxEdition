// The raw parts of an imported player its author changed that aren't DOS player settings (an About
// page of their own, a renamed config file…), as the project's companion keeps them: offset plus
// base64 bytes. The DOS export writes them back over the stock player, leaving alone every patch
// the project's author changed since the import, so an unedited import comes out byte for byte.
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { patchSpans } from './patchSpans';

/** A run of an author's bytes: where it starts in the player, and its bytes in base64. */
export interface PreservedRegion {
  offset: number;
  data: string;
}

/** What an import kept of a 3.00 player: its raw regions and the patches read from it then. */
export interface PreservedParts {
  regions: PreservedRegion[];
  patches: PlayerPatches;
}

export const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
export const regionBytes = (r: PreservedRegion) => Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));

/**
 * Writes the regions into `exe` (a patched copy of the same build), in place, except the bytes of
 * patches whose value differs from the import's (those are the project author's newer choices).
 */
export function writePreserved(exe: Uint8Array, kept: PreservedParts, patches: PlayerPatches): void {
  const mine = new Set<number>();
  for (const id of new Set([...Object.keys(patches), ...Object.keys(kept.patches)]))
    if (JSON.stringify(patches[id]) !== JSON.stringify(kept.patches[id])) for (const o of patchSpans(id)) mine.add(o);
  for (const r of kept.regions) {
    const bytes = regionBytes(r);
    if (r.offset < 0 || r.offset + bytes.length > exe.length) throw new Error('A preserved part of the player lies outside it.');
    bytes.forEach((b, i) => {
      if (!mine.has(r.offset + i)) exe[r.offset + i] = b;
    });
  }
}

/** The printable runs (4+ characters) of a region, for showing it: [offset, text]. */
export function regionText(r: PreservedRegion): [number, string][] {
  const out: [number, string][] = [];
  const bytes = regionBytes(r);
  let s = '';
  let at = 0;
  for (let i = 0; i <= bytes.length; i++) {
    const c = bytes[i];
    if (i < bytes.length && c >= 0x20 && c < 0x7f) {
      if (!s) at = i;
      s += String.fromCharCode(c);
    } else {
      if (s.trim().length >= 4) out.push([r.offset + at, s]);
      s = '';
    }
  }
  return out;
}
