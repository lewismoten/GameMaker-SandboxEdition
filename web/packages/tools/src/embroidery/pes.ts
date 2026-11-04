// Brother / Baby Lock PES, version 1, written by hand: the "#PES0001" header (22 bytes, no embroidery objects) followed by the
// PEC section, which holds everything a machine needs: the label, the thread-chart indices, one 7-bit or 12-bit signed move
// pair per stitch (in 0.1 mm, y DOWN, jumps and trims flagged), and a 48 x 38 bitmap of the design and of each color.
// This is from the format as documented by the open embroidery projects; it has not been run on a Brother machine.
import { toRecords } from './units';
import type { Pattern, Stitch } from './types';

const W = 48;
const H = 38;

/** A 6 x 38 byte bitmap (MSB first) of the given segments, scaled into 48 x 38 with a margin. */
function thumb(segs: [number, number, number, number][], ext: [number, number, number, number]): number[] {
  const [x0, y0, x1, y1] = ext;
  const k = Math.min((W - 4) / Math.max(1, x1 - x0), (H - 4) / Math.max(1, y1 - y0));
  const ox = (W - (x1 - x0) * k) / 2 - x0 * k;
  const oy = (H - (y1 - y0) * k) / 2 - y0 * k;
  const bits = new Uint8Array(W * H);
  for (const [ax, ay, bx, by] of segs) {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * k));
    for (let i = 0; i <= n; i++) {
      const px = Math.round(ox + (ax + ((bx - ax) * i) / n) * k);
      const py = Math.round(oy + (ay + ((by - ay) * i) / n) * k);
      if (px >= 0 && px < W && py >= 0 && py < H) bits[py * W + px] = 1;
    }
  }
  const out: number[] = [];
  for (let y = 0; y < H; y++)
    for (let bx = 0; bx < W / 8; bx++) out.push(Array.from({ length: 8 }, (_, b) => bits[y * W + bx * 8 + b] << (7 - b)).reduce((a, c) => a | c, 0));
  return out;
}

/** The PES file for a pattern. */
export function writePes(pattern: Pattern): Uint8Array {
  const moves = toRecords(pattern, 2047);
  const body: number[] = [];
  const segsByColor: [number, number, number, number][][] = [[]];
  let toggle = 2;
  let x = 0;
  let y = 0;
  let trimmed = false;
  const bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const long = (v: number, flag: number) => body.push(0x80 | flag | ((v >> 8) & 0x0f), v & 0xff);
  for (const m of moves) {
    if (m.cmd === 'color') {
      body.push(0xfe, 0xb0, toggle);
      toggle = toggle === 2 ? 1 : 2;
      segsByColor.push([]);
    } else if (m.cmd === 'trim') {
      trimmed = true;
    } else if (m.cmd === 'end') {
      body.push(0xff);
    } else {
      const dy = -m.dy; // PEC counts y downward
      if (m.cmd === 'jump') {
        const flag = trimmed ? 0x20 : 0x10;
        long(m.dx & 0xfff, flag);
        long(dy & 0xfff, flag);
      } else if (m.dx >= -64 && m.dx <= 63 && dy >= -64 && dy <= 63) {
        body.push(m.dx & 0x7f, dy & 0x7f);
      } else {
        long(m.dx & 0xfff, 0);
        long(dy & 0xfff, 0);
      }
      if (m.cmd === 'jump') trimmed = false;
      else segsByColor[segsByColor.length - 1].push([x, y, x + m.dx, y + dy]);
      x += m.dx;
      y += dy;
      bounds.x0 = Math.min(bounds.x0, x);
      bounds.x1 = Math.max(bounds.x1, x);
      bounds.y0 = Math.min(bounds.y0, y);
      bounds.y1 = Math.max(bounds.y1, y);
    }
  }
  const pec: number[] = [];
  const text = (s: string) => [...s].forEach((c) => pec.push(c.charCodeAt(0)));
  text(`LA:${pattern.name.slice(0, 16).padEnd(16, ' ')}`);
  pec.push(0x0d);
  pec.push(...Array(12).fill(0x20), 0xff, 0x00, 6, H, ...Array(12).fill(0x20));
  pec.push(pattern.threads.length - 1, ...pattern.threads.map((t) => t.pec ?? 20));
  while (pec.length < 0x1d0) pec.push(0x20);
  const offsetAt = pec.length + 2;
  const ext: [number, number, number, number] = [bounds.x0, bounds.y0, bounds.x1, bounds.y1];
  pec.push(0, 0, 0, 0, 0); // the two zero bytes, then the graphics offset (filled in below)
  pec.push(0x31, 0xff, 0xf0);
  const le16 = (v: number) => pec.push(v & 0xff, (v >> 8) & 0xff);
  le16(bounds.x1 - bounds.x0);
  le16(bounds.y1 - bounds.y0);
  le16(0x1e0);
  le16(0x1b0);
  pec.push(((0x9000 | -bounds.x0) >> 8) & 0xff, (0x9000 | -bounds.x0) & 0xff, ((0x9000 | -bounds.y0) >> 8) & 0xff, (0x9000 | -bounds.y0) & 0xff);
  pec.push(...body);
  const graphics = pec.length - 0x1d0;
  pec[offsetAt] = graphics & 0xff;
  pec[offsetAt + 1] = (graphics >> 8) & 0xff;
  pec[offsetAt + 2] = (graphics >> 16) & 0xff;
  pec.push(...thumb(segsByColor.flat(), ext));
  for (const s of segsByColor) pec.push(...thumb(s, ext));
  return Uint8Array.from([...'#PES0001'].map((c) => c.charCodeAt(0)).concat([22, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0xff, 0xff, 0, 0], pec));
}

/** Reads a PES back (the PEC section) into absolute stitches in mm. */
export function readPes(bytes: Uint8Array): { stitches: Stitch[]; colorChanges: number; threads: number; label: string } {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (String.fromCharCode(...bytes.subarray(0, 8)) !== '#PES0001') throw new Error('not a PES v1 file');
  const pec = dv.getUint32(8, true);
  const label = String.fromCharCode(...bytes.subarray(pec + 3, pec + 19)).trim();
  const threads = bytes[pec + 48] + 1;
  let i = pec + 0x1d0 + 20; // past the 20-byte stitch header (two zeros, offset, 31 FF F0, four int16, two origin words)
  const stitches: Stitch[] = [];
  let colorChanges = 0;
  let x = 0;
  let y = 0;
  const word = (): { v: number; flag: number } => {
    const b = bytes[i];
    if (b & 0x80) {
      let v = ((b & 0x0f) << 8) | bytes[i + 1];
      if (v & 0x800) v -= 0x1000;
      i += 2;
      return { v, flag: b & 0x30 };
    }
    i++;
    return { v: b >= 0x40 ? b - 0x80 : b, flag: 0 };
  };
  while (i < bytes.length) {
    if (bytes[i] === 0xff) {
      stitches.push({ x: x / 10, y: y / 10, cmd: 'end' });
      break;
    }
    if (bytes[i] === 0xfe) {
      colorChanges++;
      stitches.push({ x: x / 10, y: y / 10, cmd: 'color' });
      i += 3;
      continue;
    }
    const a = word();
    const b = word();
    x += a.v;
    y -= b.v;
    stitches.push({ x: x / 10, y: y / 10, cmd: a.flag ? 'jump' : 'stitch' });
  }
  return { stitches, colorChanges, threads, label };
}
