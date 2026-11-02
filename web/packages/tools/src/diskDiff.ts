// Compare two Game-Maker disks (name -> bytes) and describe, per changed file, what changed in
// words. The format is picked from the file's contents where the engine can sniff it (GIF, FLI,
// VOC), else from its extension, else it is a byte comparison. Pure and deterministic: files and
// lines are sorted, nothing reads a clock or the disk.
import { parseBlocks, serializeBlocks, BLOCK_COUNTS, BLOCK_SIZE, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { isFli, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { MLEN, MWID, parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { PALETTE_SIZE, parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

export type DiskFiles = ReadonlyMap<string, Uint8Array>;
export interface ChangedFile {
  name: string;
  kind: string;
  before: number;
  after: number;
  summary: string[];
}
export interface DiskDiff {
  added: { name: string; kind: string; size: number }[];
  removed: { name: string; kind: string; size: number }[];
  changed: ChangedFile[];
  unchanged: number;
}

const ext = (n: string) => /\.([^./\\]+)$/.exec(n)?.[1].toLowerCase() ?? '';
const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** What a file is, by its first bytes when they say, else by its extension. */
export function sniffKind(name: string, bytes: Uint8Array): string {
  if (bytes.length) {
    if (isGif(bytes)) return 'gif';
    if (isVoc(bytes)) return 'voc';
    if (ext(name) === 'fli' && isFli(bytes)) return 'fli';
  }
  const e = ext(name);
  if (['gam', 'pal', 'map', 'bbl', 'mbl', 'cbl', 'chr', 'mon'].includes(e)) return e;
  if (['txt', 'lst', 'doc', 'bat', 'cfg', 'ini', 'md', 'json'].includes(e)) return 'text';
  return e === 'fli' || e === 'gif' || e === 'voc' ? `${e} (not that format)` : e || 'file';
}

/** Numbers as ranges: 3,4,5,9 -> "3-5, 9". Long lists are cut. */
export function ranges(nums: number[], max = 12): string {
  const out: string[] = [];
  for (let i = 0; i < nums.length;) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    out.push(j > i ? `${nums[i]}-${nums[j]}` : `${nums[i]}`);
    i = j + 1;
  }
  return out.length > max ? `${out.slice(0, max).join(', ')}, and ${out.length - max} more` : out.join(', ');
}

/** Structured values compared by content (typed arrays as arrays), keys in a fixed order. */
function stable(v: unknown): string {
  return JSON.stringify(v, (_k, x: unknown) => {
    if (ArrayBuffer.isView(x)) return Array.from(x as Uint8Array);
    if (x && typeof x === 'object' && !Array.isArray(x)) return Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)));
    return x;
  });
}

/** Lines added and removed: shared head and tail dropped, then a longest-common-subsequence. */
export function lineDiff(a: string[], b: string[]): { added: number; removed: number } {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let ea = a.length;
  let eb = b.length;
  while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) (ea--, eb--);
  const x = a.slice(s, ea);
  const y = b.slice(s, eb);
  if (x.length * y.length > 4_000_000) {
    const counts = new Map<string, number>();
    for (const l of x) counts.set(l, (counts.get(l) ?? 0) + 1);
    let common = 0;
    for (const l of y) if ((counts.get(l) ?? 0) > 0) (counts.set(l, counts.get(l)! - 1), common++);
    return { added: y.length - common, removed: x.length - common };
  }
  let prev = new Uint32Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Uint32Array(y.length + 1);
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    prev = cur;
  }
  return { added: y.length - prev[y.length], removed: x.length - prev[y.length] };
}

/** Changed map cells grouped into clusters (cells within 3 of each other), as bounding boxes. */
export function cellClusters(cells: number[], width: number): { count: number; x0: number; y0: number; x1: number; y1: number }[] {
  const set = new Set(cells);
  const seen = new Set<number>();
  const out: { count: number; x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const start of cells) {
    if (seen.has(start)) continue;
    const c = { count: 0, x0: start % width, y0: Math.floor(start / width), x1: 0, y1: 0 };
    c.x1 = c.x0;
    c.y1 = c.y0;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const k = stack.pop()!;
      const x = k % width;
      const y = Math.floor(k / width);
      c.count++;
      ((c.x0 = Math.min(c.x0, x)), (c.x1 = Math.max(c.x1, x)), (c.y0 = Math.min(c.y0, y)), (c.y1 = Math.max(c.y1, y)));
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx;
          const n = (y + dy) * width + nx;
          if (nx < 0 || nx >= width || !set.has(n) || seen.has(n)) continue;
          seen.add(n);
          stack.push(n);
        }
    }
    out.push(c);
  }
  return out.sort((p, q) => p.y0 - q.y0 || p.x0 - q.x0);
}

const text = (b: Uint8Array) => new TextDecoder('latin1').decode(b);

function byteSummary(a: Uint8Array, b: Uint8Array): string[] {
  const n = Math.min(a.length, b.length);
  let diff = 0;
  let first = -1;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) (diff++, first < 0 && (first = i));
  const out = [a.length === b.length ? `same size (${a.length} bytes)` : `${a.length} -> ${b.length} bytes`];
  if (diff || first >= 0) out.push(`${plural(diff, 'byte')} differ${diff === 1 ? 's' : ''}, the first at offset ${first}`);
  else out.push(`the first ${n} bytes are the same`);
  return out;
}

function describeBlocks(kind: BlockKind, a: Uint8Array, b: Uint8Array): string[] {
  const count = BLOCK_COUNTS[kind];
  if (a.length < count * BLOCK_SIZE || b.length < count * BLOCK_SIZE) return byteSummary(a, b);
  const pa = parseBlocks(a, count);
  const pb = parseBlocks(b, count);
  const changed: number[] = [];
  const added: number[] = [];
  const cleared: number[] = [];
  const blank = (i: number, p: typeof pa) => p[i].pixels.every((v) => v === p[i].pixels[0]) && (p[i].pixels[0] === 255 || p[i].pixels[0] === 0);
  for (let i = 0; i < count; i++) {
    if (same(serializeBlocks([pa[i]]), serializeBlocks([pb[i]]))) continue;
    if (blank(i, pa)) added.push(i);
    else if (blank(i, pb)) cleared.push(i);
    else changed.push(i);
  }
  const out: string[] = [];
  if (added.length) out.push(`${plural(added.length, 'block')} new (were empty): ${ranges(added)}`);
  if (changed.length) out.push(`${plural(changed.length, 'block')} changed: ${ranges(changed)}`);
  if (cleared.length) out.push(`${plural(cleared.length, 'block')} emptied: ${ranges(cleared)}`);
  return out.length ? out : ['block data differs (no block pixels or settings changed in the first ' + count + ')'];
}

function describeMap(a: Uint8Array, b: Uint8Array): string[] {
  const ma = parseMap(a);
  const mb = parseMap(b);
  const cells: number[] = [];
  for (let i = 0; i < MLEN * MWID; i++) if (ma.blocks[i] !== mb.blocks[i]) cells.push(i);
  const out = [
    cells.length ? `${plural(cells.length, 'cell')} changed in ${plural(cellClusters(cells, MWID).length, 'cluster')}` : 'no background cells changed',
  ];
  for (const c of cellClusters(cells, MWID).slice(0, 12)) out.push(`  cluster at (${c.x0},${c.y0})-(${c.x1},${c.y1}): ${plural(c.count, 'cell')}`);
  const moved = ma.mons.reduce((n, v, i) => n + (v !== mb.mons[i] ? 1 : 0), 0);
  if (moved || stable(ma.monsters) !== stable(mb.monsters))
    out.push(`monsters: ${plural(moved, 'cell')} with a different placement; ${ma.monsters.length} -> ${mb.monsters.length} placed`);
  return out;
}

/** Items of two arrays that differ, by index. */
function indexDiff<T>(a: T[], b: T[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (stable(a[i]) !== stable(b[i])) out.push(i);
  return out;
}

function describe(kind: string, a: Uint8Array, b: Uint8Array): string[] {
  switch (kind) {
    case 'gam': {
      const ga = parseGame(a);
      const gb = parseGame(b);
      const out = [`scenes ${ga.scenes.length} -> ${gb.scenes.length}`];
      const ch = indexDiff(ga.scenes, gb.scenes);
      if (ch.length) out.push(`scenes changed: ${ranges(ch)}`);
      for (const i of ch.slice(0, 20)) {
        const sa = ga.scenes[i];
        const sb = gb.scenes[i];
        const what: string[] = [];
        if (!sa || !sb) what.push(sa ? 'removed' : 'added');
        else {
          if (sa.desc !== sb.desc) what.push(`description "${sa.desc}" -> "${sb.desc}"`);
          const fl = indexDiff(sa.files, sb.files);
          if (fl.length) what.push(`files ${fl.map((k) => `${sa.files[k] || '-'} -> ${sb.files[k] || '-'}`).join(', ')}`);
          if (stable(sa.links) !== stable(sb.links)) what.push(`links ${sa.numLinks} -> ${sb.numLinks} (changed)`);
          if (!what.length) what.push('other settings');
        }
        out.push(`  scene ${i}: ${what.join('; ')}`);
      }
      if (stable(ga.header) !== stable(gb.header)) out.push('header changed');
      return out;
    }
    case 'pal': {
      if (a.length < PALETTE_SIZE || b.length < PALETTE_SIZE) return byteSummary(a, b);
      const pa = parsePalette(a);
      const pb = parsePalette(b);
      const idx: number[] = [];
      for (let i = 0; i < 256; i++) if (pa[i * 3] !== pb[i * 3] || pa[i * 3 + 1] !== pb[i * 3 + 1] || pa[i * 3 + 2] !== pb[i * 3 + 2]) idx.push(i);
      return [`${plural(idx.length, 'color')} changed: ${ranges(idx)}`];
    }
    case 'bbl':
    case 'mbl':
    case 'cbl':
      return describeBlocks(kind, a, b);
    case 'map':
      return describeMap(a, b);
    case 'chr': {
      const ca = parseCharacter(a);
      const cb = parseCharacter(b);
      const seqs = indexDiff(ca.sequences, cb.sequences);
      const rest = Object.keys(ca).filter(
        (k) => k !== 'sequences' && stable((ca as unknown as Record<string, unknown>)[k]) !== stable((cb as unknown as Record<string, unknown>)[k]),
      );
      return [
        seqs.length ? `sequences changed: ${ranges(seqs)}` : 'no sequences changed',
        ...(rest.length ? [`other settings changed: ${rest.sort().join(', ')}`] : []),
      ];
    }
    case 'mon': {
      const ma = parseMonsters(a);
      const mb = parseMonsters(b);
      const ch = indexDiff(ma, mb);
      return [`${plural(ch.length, 'monster')} changed: ${ranges(ch)}`];
    }
    case 'text': {
      const { added, removed } = lineDiff(text(a).split(/\r?\n/), text(b).split(/\r?\n/));
      return [`${plural(added, 'line')} added, ${plural(removed, 'line')} removed`];
    }
    case 'gif': {
      const ia = decodeGif(a);
      const ib = decodeGif(b);
      const out = [ia.width === ib.width && ia.height === ib.height ? `${ia.width}x${ia.height}` : `${ia.width}x${ia.height} -> ${ib.width}x${ib.height}`];
      if (ia.width === ib.width && ia.height === ib.height)
        out.push(
          `${plural(
            ia.pixels.reduce((n, v, i) => n + (v !== ib.pixels[i] ? 1 : 0), 0),
            'pixel',
          )} changed`,
        );
      out.push(stable(ia.palette) === stable(ib.palette) ? 'palette same' : 'palette changed');
      return out;
    }
    case 'fli': {
      const fa = parseFli(a);
      const fb = parseFli(b);
      return [
        `${fa.width}x${fa.height}, ${plural(fa.frames.length, 'frame')} -> ${fb.width}x${fb.height}, ${plural(fb.frames.length, 'frame')}`,
        `speed ${fa.speed} -> ${fb.speed}`,
        ...(fa.frames.length === fb.frames.length
          ? [
              ((n) => `${plural(n, 'frame')} ${n === 1 ? 'differs' : 'differ'}`)(
                fa.frames.filter((o, i) => !same(a.subarray(o, fa.frames[i + 1] ?? a.length), b.subarray(fb.frames[i], fb.frames[i + 1] ?? b.length))).length,
              ),
            ]
          : []),
      ];
    }
    case 'voc': {
      const va = decodeVoc(a);
      const vb = decodeVoc(b);
      const sec = (v: typeof va) => `${(v.samples.length / v.sampleRate).toFixed(2)} s at ${v.sampleRate} Hz`;
      return [`${sec(va)} -> ${sec(vb)}`];
    }
    default:
      return byteSummary(a, b);
  }
}

/** A short plain-text summary of how one file changed; a parse failure falls back to bytes. */
export function summarizeChange(name: string, a: Uint8Array, b: Uint8Array): { kind: string; summary: string[] } {
  const ka = sniffKind(name, a);
  const kb = sniffKind(name, b);
  if (ka !== kb) return { kind: `${ka} -> ${kb}`, summary: ['contents changed type', ...byteSummary(a, b)] };
  try {
    return { kind: ka, summary: describe(ka, a, b) };
  } catch {
    return { kind: ka, summary: ['could not be read as that format', ...byteSummary(a, b)] };
  }
}

export function diffDisks(a: DiskFiles, b: DiskFiles): DiskDiff {
  const names = [...new Set([...a.keys(), ...b.keys()])].sort();
  const out: DiskDiff = { added: [], removed: [], changed: [], unchanged: 0 };
  for (const name of names) {
    const x = a.get(name);
    const y = b.get(name);
    if (!x && y) out.added.push({ name, kind: sniffKind(name, y), size: y.length });
    else if (x && !y) out.removed.push({ name, kind: sniffKind(name, x), size: x.length });
    else if (x && y) {
      if (same(x, y)) out.unchanged++;
      else out.changed.push({ name, before: x.length, after: y.length, ...summarizeChange(name, x, y) });
    }
  }
  return out;
}

/** The plain-text report: counts, then added, removed, and changed files with their summaries. */
export function formatDiff(d: DiskDiff): string {
  const lines = [
    `${plural(d.changed.length, 'file')} changed, ${plural(d.added.length, 'file')} added, ${plural(d.removed.length, 'file')} removed, ${d.unchanged} unchanged`,
  ];
  for (const f of d.added) lines.push(`+ ${f.name} (${f.kind}, ${f.size} bytes)`);
  for (const f of d.removed) lines.push(`- ${f.name} (${f.kind}, ${f.size} bytes)`);
  for (const f of d.changed) {
    lines.push(`~ ${f.name} (${f.kind}, ${f.before} -> ${f.after} bytes)`);
    for (const s of f.summary) lines.push(`    ${s.replace(/^ +/, (m) => m + '  ')}`);
  }
  return lines.join('\n') + '\n';
}
