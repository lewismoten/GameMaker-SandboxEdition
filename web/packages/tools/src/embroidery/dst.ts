// Tajima DST: a 512-byte text header, then 3-byte records. Each record packs a move of up to +/-121 units (0.1 mm) in x and
// y as balanced ternary digits (weights 1, 3, 9, 27, 81) spread over the three bytes, with flags for a jump and for a color change.
// A trim is written as a few tiny jumps (machines cut the thread after three or more in a row). No palette is stored.
import { toRecords, type Move } from './units';
import type { Pattern, Stitch } from './types';

const WEIGHTS = [
  // [byte, plus bit, minus bit, weight] for x, then y
  [
    [0, 0x01, 0x02, 1],
    [1, 0x01, 0x02, 3],
    [0, 0x04, 0x08, 9],
    [1, 0x04, 0x08, 27],
    [2, 0x04, 0x08, 81],
  ],
  [
    [0, 0x80, 0x40, 1],
    [1, 0x80, 0x40, 3],
    [0, 0x20, 0x10, 9],
    [1, 0x20, 0x10, 27],
    [2, 0x20, 0x10, 81],
  ],
] as const;

/** The 3 bytes of one move. */
function encode(dx: number, dy: number, flag: number): [number, number, number] {
  const b: [number, number, number] = [0, 0, 0x03 | flag];
  [dx, dy].forEach((v, axis) => {
    let rest = v;
    // balanced ternary from the heaviest digit down: each digit is -1, 0 or +1 times its weight
    for (const [byte, plus, minus, w] of [...WEIGHTS[axis]].reverse()) {
      if (rest > w / 2) {
        b[byte] |= plus;
        rest -= w;
      } else if (rest < -w / 2) {
        b[byte] |= minus;
        rest += w;
      }
    }
    if (rest !== 0) throw new Error(`move ${v} does not fit a DST record`);
  });
  return b;
}

const pad = (s: string, n: number) => s.slice(0, n).padEnd(n, ' ');

/** The DST file for a pattern. */
export function writeDst(pattern: Pattern): Uint8Array {
  const recs: [number, number, number][] = [];
  let colors = 0;
  let x = 0;
  let y = 0;
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  const move = (r: Move, flag: number) => {
    recs.push(encode(r.dx, r.dy, flag));
    x += r.dx;
    y += r.dy;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const r of toRecords(pattern)) {
    if (r.cmd === 'stitch') move(r, 0);
    else if (r.cmd === 'jump') move(r, 0x80);
    else if (r.cmd === 'trim') {
      // two tiny jumps out and back, so the jumps that follow make three in a row
      move({ dx: 1, dy: 1, cmd: 'jump' }, 0x80);
      move({ dx: -1, dy: -1, cmd: 'jump' }, 0x80);
    } else if (r.cmd === 'color') {
      recs.push([0, 0, 0xc3]);
      colors++;
    }
  }
  recs.push([0, 0, 0xf3]);
  const head = [
    `LA:${pad(pattern.name.toUpperCase(), 16)}`,
    `ST:${String(recs.length).padStart(7, ' ')}`,
    `CO:${String(colors).padStart(3, ' ')}`,
    `+X:${String(maxX).padStart(5, ' ')}`,
    `-X:${String(-minX).padStart(5, ' ')}`,
    `+Y:${String(maxY).padStart(5, ' ')}`,
    `-Y:${String(-minY).padStart(5, ' ')}`,
    `AX:${String(x >= 0 ? '+' : '-').concat(String(Math.abs(x)).padStart(5, ' '))}`,
    `AY:${String(y >= 0 ? '+' : '-').concat(String(Math.abs(y)).padStart(5, ' '))}`,
    `MX:${'+'}${String(0).padStart(5, ' ')}`,
    `MY:${'+'}${String(0).padStart(5, ' ')}`,
    `PD:******`,
  ].join('\r');
  const out = new Uint8Array(512 + recs.length * 3);
  out.fill(0x20, 0, 512);
  for (let i = 0; i < head.length; i++) out[i] = head.charCodeAt(i);
  out[head.length] = 0x0d;
  out[head.length + 1] = 0x1a;
  recs.forEach((r, i) => out.set(r, 512 + i * 3));
  return out;
}

/** Reads a DST back into absolute stitches in mm (jumps and color changes included; the header counts are checked by the caller). */
export function readDst(bytes: Uint8Array): { stitches: Stitch[]; colorChanges: number; label: string; declared: { stitches: number; colors: number } } {
  const text = String.fromCharCode(...bytes.subarray(0, 512));
  const field = (k: string) => Number(new RegExp(`${k}:\\s*(\\d+)`).exec(text)?.[1] ?? NaN);
  const stitches: Stitch[] = [];
  let colorChanges = 0;
  let x = 0;
  let y = 0;
  for (let i = 512; i + 2 < bytes.length; i += 3) {
    const b = [bytes[i], bytes[i + 1], bytes[i + 2]];
    if (b[2] === 0xf3) {
      stitches.push({ x: x / 10, y: y / 10, cmd: 'end' });
      break;
    }
    if (b[2] === 0xc3) {
      colorChanges++;
      stitches.push({ x: x / 10, y: y / 10, cmd: 'color' });
      continue;
    }
    const d = [0, 0];
    WEIGHTS.forEach((axis, a) => {
      for (const [byte, plus, minus, w] of axis) d[a] += (b[byte] & plus ? w : 0) - (b[byte] & minus ? w : 0);
    });
    x += d[0];
    y += d[1];
    stitches.push({ x: x / 10, y: y / 10, cmd: b[2] & 0x80 ? 'jump' : 'stitch' });
  }
  return { stitches, colorChanges, label: text.slice(3, 19).trim(), declared: { stitches: field('ST'), colors: field('CO') } };
}
