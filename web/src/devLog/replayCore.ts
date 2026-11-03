// The pure parts of the game replay log, shared by the page (gameLog.ts) and the replay tool
// (scripts/replayLog.ts): the compact input stream, the per-play random numbers and the snapshot
// comparison. No DOM and no Node here.

/** The input stream: flat [clock, scan, clock, scan, ...]; a scan with bit 7 set is a key release. */
export type InputStream = number[];

/** Adds one applied key event (the game clock of the tick that applied it, and its scan code). */
export function pushInput(stream: InputStream, clock: number, scan: number): void {
  stream.push(clock, scan);
}

/** The events of several batches, in order, as [clock, scan] pairs. */
export function decodeInput(batches: InputStream[]): { clock: number; scan: number }[] {
  const out: { clock: number; scan: number }[] = [];
  for (const b of batches) for (let i = 0; i + 1 < b.length; i += 2) out.push({ clock: b[i], scan: b[i + 1] });
  return out;
}

/** Scan codes held after each event, as changes only: [clock, sorted held list] (a run-length mask). */
export function heldRuns(events: { clock: number; scan: number }[]): [number, number[]][] {
  const held = new Set<number>();
  const out: [number, number[]][] = [];
  for (const e of events) {
    if (e.scan & 0x80) held.delete(e.scan & 0x7f);
    else held.add(e.scan);
    const list = [...held].sort((a, b) => a - b);
    const last = out[out.length - 1];
    if (last && last[0] === e.clock) last[1] = list;
    else out.push([e.clock, list]);
  }
  return out;
}

/** A small seeded generator (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The generator for the nth scene load of a play with this seed (what Session.rand hands each level). */
export function sceneRand(seed: number, load: number): () => number {
  return seeded((seed ^ Math.imul(load + 1, 0x9e3779b1)) >>> 0);
}

/** A 32-bit FNV-1a hash as hex, to say which game or save a log belongs to. */
export function hash32(bytes: Uint8Array | string): string {
  let h = 0x811c9dc5;
  const n = typeof bytes === 'string' ? bytes.length : bytes.length;
  for (let i = 0; i < n; i++) {
    h ^= typeof bytes === 'string' ? bytes.charCodeAt(i) & 0xff : bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** What a snapshot says about the game, to read the log and to check a replay against. */
export interface Snap {
  clock: number;
  scene: number;
  mx: number;
  my: number;
  x: number;
  y: number;
  hp: number;
  lives: number;
  score: number;
}

const FIELDS: (keyof Snap)[] = ['scene', 'mx', 'my', 'x', 'y', 'hp', 'lives', 'score'];

/** The fields that differ between a recorded snapshot and the replay's, by name (empty = match). */
export function snapDiff(recorded: Snap, replayed: Snap): string[] {
  return FIELDS.filter((f) => recorded[f] !== replayed[f]).map((f) => `${f} ${recorded[f]} -> ${replayed[f]}`);
}
