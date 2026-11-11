// ISO directory records and the fixed image's byte-for-byte compatibility.
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { createIso } from './iso9660';

const enc = new TextEncoder();

/** The Rock Ridge names (NM) and modes (PX) in an ISO image's directory records. */
function rockRidge(img: Uint8Array): Map<string, number> {
  const out = new Map<string, number>();
  const dv = new DataView(img.buffer, img.byteOffset, img.byteLength);
  for (let i = 0; i + 4 < img.length; i++) {
    if (img[i] !== 0x4e || img[i + 1] !== 0x4d || img[i + 3] !== 1) continue; // "NM", version 1
    const len = img[i + 2];
    const name = new TextDecoder().decode(img.subarray(i + 5, i + len));
    // the PX entry comes just before NM in each record
    const px = i - 36;
    if (img[px] === 0x50 && img[px + 1] === 0x58) out.set(name, dv.getUint32(px + 4, true));
  }
  return out;
}

describe('iso9660', () => {
  it('writes a volume with Rock Ridge names, modes and links', () => {
    const img = createIso(
      [
        { path: 'My Game.app/Contents/MacOS/run', data: enc.encode('#!/bin/sh\n'), mode: 0o755 },
        { path: 'My Game.app/Contents/Info.plist', data: enc.encode('<plist/>') },
        { path: 'Applications', symlink: '/Applications' },
      ],
      { volume: 'My Game', date: new Date(Date.UTC(2026, 0, 1)) },
    );
    // SHA-256 captured from web/src/export/iso9660.ts before moving the writer.
    expect(createHash('sha256').update(img).digest('hex')).toBe('cf6d911eb02ad46c88791027b304a861691144a382e7db5b5e0b224221dd7762');
    expect(img.length % 2048).toBe(0);
    expect(new TextDecoder().decode(img.subarray(16 * 2048 + 1, 16 * 2048 + 6))).toBe('CD001');
    expect(new TextDecoder().decode(img.subarray(16 * 2048 + 40, 16 * 2048 + 47))).toBe('My Game');
    const rr = rockRidge(img);
    expect(rr.get('My Game.app')).toBe(0o040755);
    expect(rr.get('run')).toBe(0o100755);
    expect(rr.get('Info.plist')).toBe(0o100644);
    expect(rr.get('Applications')).toBe(0o120755);
  });
});
