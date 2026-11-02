// Version storage like a git repository: a game's files as they were, kept as small differences from
// the version before. A binary file (block sets, maps, palettes, monsters, characters) is stored as
// byte-range patches: only the runs of bytes that changed, so one recolored block, one palette color
// or one map cell costs a few bytes, not the file. A text file (lst, txt, json, md...) is stored as a
// line patch. Pure: no DOM, no storage. Lossless for any bytes (text is read as one byte a character).
export type FileState = Uint8Array;

/** A file in a delta: new whole, changed by patches, or gone. */
export type FileDelta =
  | { kind: 'new'; bytes: Uint8Array }
  | { kind: 'bytes'; length: number; patches: { at: number; bytes: Uint8Array }[] }
  | { kind: 'lines'; start: number; remove: number; add: string[] }
  | { kind: 'gone' };

/** What changed between two versions of a game: only the files that differ. */
export type Delta = Record<string, FileDelta>;

const TEXT = /\.(lst|txt|json|md|csv|bat|ini|cfg|inf|doc|nfo|diz)$/i;
/** Runs of equal bytes shorter than this between two changes do not split a patch. */
const GAP = 8;

const lines = (b: Uint8Array): string[] =>
  Array.from(b, (v) => String.fromCharCode(v))
    .join('')
    .match(/[^\n]*\n|[^\n]+/g) ?? [];
const bytesOf = (parts: string[]): Uint8Array => Uint8Array.from(parts.join(''), (c) => c.charCodeAt(0));
const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

function byteDelta(a: Uint8Array, b: Uint8Array): FileDelta {
  const patches: { at: number; bytes: Uint8Array }[] = [];
  let i = 0;
  while (i < b.length) {
    if (i < a.length && a[i] === b[i]) {
      i++;
      continue;
    }
    const at = i;
    let end = i + 1;
    let same = 0;
    for (let j = end; j < b.length && same < GAP; j++) {
      if (j < a.length && a[j] === b[j]) same++;
      else ((end = j + 1), (same = 0));
    }
    patches.push({ at, bytes: b.slice(at, end) });
    i = end;
  }
  return { kind: 'bytes', length: b.length, patches };
}

function lineDelta(a: Uint8Array, b: Uint8Array): FileDelta {
  const [x, y] = [lines(a), lines(b)];
  let s = 0;
  while (s < x.length && s < y.length && x[s] === y[s]) s++;
  let e = 0;
  while (e < x.length - s && e < y.length - s && x[x.length - 1 - e] === y[y.length - 1 - e]) e++;
  return { kind: 'lines', start: s, remove: x.length - s - e, add: y.slice(s, y.length - e) };
}

/** The difference that turns `from` (undefined: no such file) into `to` (undefined: removed); undefined when they are the same. */
export function diffFile(name: string, from: FileState | undefined, to: FileState | undefined): FileDelta | undefined {
  if (!to) return from ? { kind: 'gone' } : undefined;
  if (!from) return { kind: 'new', bytes: to };
  if (equal(from, to)) return undefined;
  return TEXT.test(name) ? lineDelta(from, to) : byteDelta(from, to);
}

/** The file after a delta; undefined when it is gone. */
export function patchFile(from: FileState | undefined, d: FileDelta): FileState | undefined {
  if (d.kind === 'gone') return undefined;
  if (d.kind === 'new') return d.bytes;
  if (!from) throw new Error('A patch has no file to change');
  if (d.kind === 'bytes') {
    const out = new Uint8Array(d.length);
    out.set(from.subarray(0, Math.min(from.length, d.length)));
    for (const p of d.patches) out.set(p.bytes, p.at);
    return out;
  }
  const x = lines(from);
  x.splice(d.start, d.remove, ...d.add);
  return bytesOf(x);
}

/** The delta between two whole versions (file name to bytes). */
export function diffVersions(from: ReadonlyMap<string, FileState>, to: ReadonlyMap<string, FileState>): Delta {
  const out: Delta = {};
  for (const [n, b] of to) {
    const d = diffFile(n, from.get(n), b);
    if (d) out[n] = d;
  }
  for (const n of from.keys()) if (!to.has(n)) out[n] = { kind: 'gone' };
  return out;
}

/** A version with a delta applied. */
export function applyDelta(from: ReadonlyMap<string, FileState>, delta: Delta): Map<string, FileState> {
  const out = new Map(from);
  for (const [n, d] of Object.entries(delta)) {
    const b = patchFile(out.get(n), d);
    if (b) out.set(n, b);
    else out.delete(n);
  }
  return out;
}

/** Bytes a delta takes to store (patch bytes, new files, added lines), to show what a version costs. */
export function deltaSize(delta: Delta): number {
  let n = 0;
  for (const d of Object.values(delta)) {
    if (d.kind === 'new') n += d.bytes.length;
    else if (d.kind === 'bytes') n += d.patches.reduce((a, p) => a + p.bytes.length + 4, 0);
    else if (d.kind === 'lines') n += d.add.reduce((a, l) => a + l.length, 0) + 4;
  }
  return n;
}
