// .rec demo recordings: { uint DeltaTime; uchar key; } records, where key is a PC
// scan code (bit 7 set = key released) and DeltaTime counts game clock ticks
// (18.2 Hz) since the previous key event. See Recording in code/GM/PLAYGAME.C.
import { Reader, Writer } from './binary';

export const RECLEN = 1000;

export interface RecordedKey {
  delta: number;
  key: number;
}

export function parseRecording(bytes: Uint8Array): RecordedKey[] {
  const r = new Reader(bytes);
  const out: RecordedKey[] = [];
  const count = Math.min(RECLEN, Math.floor(bytes.length / 3));
  for (let i = 0; i < count; i++) out.push({ delta: r.u16(), key: r.u8() });
  return out;
}

export function serializeRecording(keys: RecordedKey[]): Uint8Array {
  const w = new Writer(keys.length * 3);
  for (const k of keys.slice(0, RECLEN)) w.u16(k.delta).u8(k.key);
  return w.toBytes();
}
