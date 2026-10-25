// What in an .FLI RSD's own player can't read (code/Image/FLI/FLI.CPP, as fliPlaygame.test.ts
// ports it): a chunk over FLI_CHUNK_MAX bytes (FileRead hands a decoder a chunk only when the
// whole of it fits its buffer, which shrinks when memory is short), an LC line of 128 packets
// or more (DoLineCompress reads the count as a signed char), an AllBlack chunk (PLAYGAME's
// VGAScrn has no BoxFill, so it calls a null pointer) and a chunk type FLI::View doesn't know
// (it stops). The editor's FLI writer (fli.ts encodeFli) makes none of them, so re-saving an
// animation through the editor fixes it. Used by the health check and the Level check.
import { FLI_CHUNK_MAX, isFli, parseFli } from './fli';

export type FliFaultKind = 'big' | 'packets' | 'black' | 'type';

export interface FliFault {
  kind: FliFaultKind;
  /** The frame it is in (0 the first; the last is the ring frame back to the start). */
  frame: number;
  /** The chunk's size with its header ('big'), the packet count ('packets') or the chunk type ('type'). */
  value: number;
}

/** Chunk types FLI::View plays: COLOR, LC, BLACK (a fault in PLAYGAME, but known), BRUN, COPY. */
const KNOWN = new Set([11, 12, 13, 15, 16]);

/** Every fault in an .FLI, the first of each kind per frame. A file that isn't an FLI has none. */
export function fliFaults(bytes: Uint8Array): FliFault[] {
  if (bytes.length < 128 || !isFli(bytes)) return [];
  const anim = parseFli(bytes);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: FliFault[] = [];
  anim.frames.forEach((start, frame) => {
    const seen = new Set<FliFaultKind>();
    const add = (kind: FliFaultKind, value: number) => {
      if (seen.has(kind)) return;
      seen.add(kind);
      out.push({ kind, frame, value });
    };
    const end = Math.min(bytes.length, start + dv.getUint32(start, true));
    let p = start + 16;
    for (let i = 0; i < dv.getUint16(start + 6, true) && p + 6 <= end; i++) {
      const size = dv.getUint32(p, true);
      const type = dv.getUint16(p + 4, true);
      if (size < 6) break;
      if (size > FLI_CHUNK_MAX) add('big', size);
      if (type === 13) add('black', type);
      else if (!KNOWN.has(type)) add('type', type);
      else if (type === 12) {
        const n = lcMostPackets(bytes, p + 6, Math.min(end, p + size));
        if (n >= 128) add('packets', n);
      }
      p += size;
    }
  });
  return out;
}

/** The most packets any line of an LC chunk's data (from `at` to `end`) has. */
function lcMostPackets(b: Uint8Array, at: number, end: number): number {
  if (at + 4 > end) return 0;
  const lines = b[at + 2] | (b[at + 3] << 8);
  let d = at + 4;
  let most = 0;
  for (let y = 0; y < lines && d < end; y++) {
    const packets = b[d++];
    most = Math.max(most, packets);
    for (let k = 0; k < packets && d + 1 < end; k++) {
      const len = (b[d + 1] << 24) >> 24;
      d += 2 + (len >= 0 ? len : 1);
    }
  }
  return most;
}

/** A fault in words, for a finding or a health issue. */
export function describeFliFault(f: FliFault): string {
  const where = f.frame === 0 ? 'its first frame' : `frame ${f.frame + 1}`;
  switch (f.kind) {
    case 'big':
      return `a ${f.value.toLocaleString('en-US')}-byte chunk in ${where} (DOS reads ${FLI_CHUNK_MAX.toLocaleString('en-US')} safely)`;
    case 'packets':
      return `a line of ${f.value} changes in ${where} (DOS reads 127 at most)`;
    case 'black':
      return `an all-black chunk in ${where} (PLAYGAME crashes on it)`;
    default:
      return `a chunk of type ${f.value} in ${where} (PLAYGAME stops at it)`;
  }
}
