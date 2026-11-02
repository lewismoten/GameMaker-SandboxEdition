// .his files: top ten { long score; char name[30]; } (see code/GM/HISCOREL.C).
import { Reader, Writer } from './binary';

export interface HighScore {
  score: number;
  name: string;
}

export const HIGH_SCORES = 10;

export function parseHighScores(bytes: Uint8Array): HighScore[] {
  const r = new Reader(bytes);
  return Array.from({ length: HIGH_SCORES }, () => ({ score: r.i32(), name: r.cstr(30) }));
}

export function serializeHighScores(list: HighScore[]): Uint8Array {
  const w = new Writer(HIGH_SCORES * 34);
  for (let i = 0; i < HIGH_SCORES; i++) {
    const e = list[i] ?? { score: 0, name: '' };
    w.i32(e.score).cstr(e.name, 30);
  }
  return w.toBytes();
}

/** Port of CheckHighScores' ranking: returns the 0-based place, or -1 if not in the top ten. */
export function placeFor(list: HighScore[], score: number): number {
  for (let j = 0; j < HIGH_SCORES; j++) if (score > (list[j]?.score ?? 0)) return j;
  return -1;
}

export function insertHighScore(list: HighScore[], place: number, entry: HighScore): HighScore[] {
  const next = list.slice(0, HIGH_SCORES);
  while (next.length < HIGH_SCORES) next.push({ score: 0, name: '' });
  next.splice(place, 0, entry);
  return next.slice(0, HIGH_SCORES);
}
