// Melco EXP (also read by Bernina): a stream of signed-byte moves, dx then dy, in 0.1 mm. A byte 0x80 starts a command:
// 0x80 0x01 is a color change, 0x80 0x04 a jump (its dx dy follow), 0x80 0x80 a trim. There is no header, palette or end mark.
import { toRecords } from './units';
import type { Pattern, Stitch } from './types';

const byte = (v: number) => v & 0xff;

/** The EXP file for a pattern. */
export function writeExp(pattern: Pattern): Uint8Array {
  const out: number[] = [];
  for (const r of toRecords(pattern, 127)) {
    if (r.cmd === 'stitch') out.push(byte(r.dx), byte(r.dy));
    else if (r.cmd === 'jump') out.push(0x80, 0x04, byte(r.dx), byte(r.dy));
    else if (r.cmd === 'trim') out.push(0x80, 0x80, 0x07, 0x00);
    else if (r.cmd === 'color') out.push(0x80, 0x01, 0x00, 0x00);
  }
  return Uint8Array.from(out);
}

const signed = (b: number) => (b > 127 ? b - 256 : b);

/** Reads an EXP back into absolute stitches in mm; the end is where the data stops. */
export function readExp(bytes: Uint8Array): { stitches: Stitch[]; colorChanges: number } {
  const stitches: Stitch[] = [];
  let colorChanges = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < bytes.length; ) {
    if (bytes[i] === 0x80 && i + 1 < bytes.length) {
      const c = bytes[i + 1];
      if (c === 0x01) {
        colorChanges++;
        stitches.push({ x: x / 10, y: y / 10, cmd: 'color' });
      } else if (c === 0x04 && i + 3 < bytes.length) {
        x += signed(bytes[i + 2]);
        y += signed(bytes[i + 3]);
        stitches.push({ x: x / 10, y: y / 10, cmd: 'jump' });
      } else if (c === 0x80) {
        stitches.push({ x: x / 10, y: y / 10, cmd: 'trim' });
      }
      i += 4;
      continue;
    }
    x += signed(bytes[i]);
    y += signed(bytes[i + 1]);
    stitches.push({ x: x / 10, y: y / 10, cmd: 'stitch' });
    i += 2;
  }
  stitches.push({ x: x / 10, y: y / 10, cmd: 'end' });
  return { stitches, colorChanges };
}
