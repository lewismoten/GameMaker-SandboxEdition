// The Patch Lab's byte diff: for one DOS player setting, the file offset of every run of bytes it
// writes in XFERPLAY.EXE, the CD's own bytes there and the bytes the project's choice puts there.
// It runs the same writers applyPlayerPatches uses (patchRules.ts writePatch / writeStock) on two
// scratch buffers, so the strip can't disagree with the exported file (patchBytes.test.ts checks it
// against the real output for one entry of each kind). No EXE is needed to show it.
import type { PatchEntry } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';
import { writePatch, writeStock, type PatchValue } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';

/** One run of bytes a setting writes. */
export interface ByteRun {
  /** File offset of its first byte. */
  offset: number;
  stock: number[];
  now: number[];
  /** Which of the bytes differ from the CD's (same length as stock). */
  changed: boolean[];
  /** The characters, for a text setting. */
  stockText?: string;
  nowText?: string;
}

/** Offset and length of each run an entry writes, in the order the entry lists them. */
export function runsOf(e: PatchEntry): { offset: number; size: number }[] {
  switch (e.kind) {
    case 'text':
    case 'format':
      return [{ offset: e.offset, size: e.length }];
    case 'rgb':
      return e.offsets.map((offset) => ({ offset, size: 1 }));
    case 'select':
    case 'fkey':
      return [{ offset: e.offset, size: 2 }];
    case 'number':
    case 'frame':
      return e.fields.map((f) => ({ offset: f.offset, size: f.size }));
  }
}

const printable = (bytes: number[]) => bytes.map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('');

/** The bytes `entry` writes: the CD's and `value`'s (a value already checked with patchProblem). */
export function byteRuns(e: PatchEntry, value: PatchValue): ByteRun[] {
  const runs = runsOf(e);
  const end = Math.max(...runs.map((r) => r.offset + r.size));
  const stock = new Uint8Array(end);
  const now = new Uint8Array(end);
  writeStock(stock, e);
  writePatch(now, e, value);
  return runs.map(({ offset, size }) => {
    const s = Array.from(stock.subarray(offset, offset + size));
    const n = Array.from(now.subarray(offset, offset + size));
    const run: ByteRun = { offset, stock: s, now: n, changed: n.map((b, i) => b !== s[i]) };
    if (e.kind === 'text' || e.kind === 'format') {
      run.stockText = printable(s);
      run.nowText = printable(n);
    }
    return run;
  });
}

export const hex2 = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');
export const hexOffset = (o: number) => `0x${o.toString(16).padStart(5, '0')}`;
