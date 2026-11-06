// Advisory: how alike the games' songs are. For every games/<id>/src/song.ts (or a list of ids) it builds each exported
// song, reads its notes back from the .CMF, and prints its tempo, length, instruments and top line, then the pairs whose
// top lines match most closely (the same intervals and rhythm, in any key) and exact byte twins. It hears nothing: two
// songs can score low and still sound alike (same instruments, same groove), so the instrument column is shown too.
//   cd web && npx vite-node scripts/songsSimilar.ts [--starters] [--json out.json] [id ...]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/kit/music';
import * as kitSong from '@lewismoten/gamemaker-sandbox-tools/kit/song';

const GAMES = resolve(__dirname, '../../games');
const args = process.argv.slice(2);
const flag = (f: string) => {
  const i = args.indexOf(f);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const starters = args.includes('--starters');
if (starters) args.splice(args.indexOf('--starters'), 1);
const jsonOut = flag('--json');

const named = new Map<string, string>();
for (const [k, v] of Object.entries(INSTRUMENTS)) named.set(Buffer.from(v).toString('hex'), k);
for (const [k, v] of Object.entries(kitSong)) if (v instanceof Uint8Array) named.set(Buffer.from(v).toString('hex'), k.toLowerCase());

function notesOf(bytes: Uint8Array) {
  const cmf = parseCmf(bytes);
  const m = cmf.music;
  let p = 0;
  let tick = 0;
  let status = 0;
  const on: { tick: number; ch: number; note: number }[] = [];
  const varLen = () => {
    let v = 0;
    let c: number;
    do {
      c = m[p++];
      v = (v << 7) | (c & 0x7f);
    } while (c & 0x80);
    return v;
  };
  while (p < m.length) {
    tick += varLen();
    if (m[p] & 0x80) status = m[p++];
    if (status === 0xff) break;
    const size = (status & 0xf0) === 0xc0 || (status & 0xf0) === 0xd0 ? 1 : 2;
    if ((status & 0xf0) === 0x90 && m[p + 1] > 0) on.push({ tick, ch: status & 15, note: m[p] });
    p += size;
  }
  return { cmf, on, end: tick };
}

/** Normalized edit similarity of two sequences (1 = same). */
function sim<T>(a: T[], b: T[]): number {
  if (!a.length && !b.length) return 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
}

const ids = args.length
  ? args
  : readdirSync(GAMES).filter((id) => {
      if (!existsSync(join(GAMES, id, 'src/song.ts'))) return false;
      if (!starters) return true;
      try {
        return JSON.parse(readFileSync(join(GAMES, id, 'about.json'), 'utf8')).series === 'starter';
      } catch {
        return false;
      }
    });

interface Row {
  id: string;
  song: string;
  title: string;
  md5: string;
  bpm: number;
  bars: number;
  seconds: number;
  bytes: number;
  instruments: string[];
  intervals: number[];
  rhythm: number[];
  low: number;
  high: number;
}
const rows: Row[] = [];
for (const id of ids) {
  const file = join(GAMES, id, 'src/song.ts');
  const src = readFileSync(file, 'utf8');
  const title = /"([^"]+)"/.exec(src.split('\n')[0])?.[1] ?? '';
  const mod = (await import(file)) as Record<string, unknown>;
  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn !== 'function' || fn.length > 0) continue;
    let bytes: unknown;
    try {
      bytes = (fn as () => unknown)();
    } catch {
      continue;
    }
    if (!(bytes instanceof Uint8Array)) continue;
    const { cmf, on, end } = notesOf(bytes);
    const used = [...new Set(on.map((n) => n.ch))].sort((a, b) => a - b);
    const instruments = used.map((c) => (c >= 11 ? 'drums' : (named.get(Buffer.from(cmf.instruments[c] ?? []).toString('hex')) ?? 'custom')));
    // The top line: the highest note at each onset.
    const byTick = new Map<number, number>();
    for (const n of on) if (n.ch < 11) byTick.set(n.tick, Math.max(byTick.get(n.tick) ?? 0, n.note));
    const top = [...byTick.entries()].sort((a, b) => a[0] - b[0]);
    const lead = on.filter((n) => n.ch === Math.min(...used));
    const line = lead.length ? lead : top.map(([tick, note]) => ({ tick, note, ch: 0 }));
    const tpb = cmf.ticksPerBeat;
    rows.push({
      id,
      song: name,
      title,
      md5: createHash('md5').update(bytes).digest('hex').slice(0, 8),
      bpm: Math.round((146 * 60) / tpb),
      bars: Math.round((end / tpb / 4) * 100) / 100,
      seconds: Math.round((end / 146) * 10) / 10,
      bytes: bytes.length,
      instruments: [...new Set(instruments)],
      intervals: line.slice(1).map((n, i) => n.note - line[i].note),
      rhythm: line.slice(1).map((n, i) => Math.round(((n.tick - line[i].tick) / tpb) * 4)),
      low: Math.min(...line.map((n) => n.note)),
      high: Math.max(...line.map((n) => n.note)),
    });
  }
}

console.log('id'.padEnd(26), 'song'.padEnd(8), 'title'.padEnd(22), 'md5     ', 'bpm', ' bars', '   sec', 'bytes', 'instruments');
for (const r of rows)
  console.log(
    r.id.padEnd(26),
    r.song.padEnd(8),
    r.title.slice(0, 22).padEnd(22),
    r.md5,
    String(r.bpm).padStart(3),
    String(r.bars).padStart(5),
    String(r.seconds).padStart(6),
    String(r.bytes).padStart(5),
    r.instruments.join('+'),
  );

const twins = new Map<string, string[]>();
for (const r of rows) twins.set(r.md5, [...(twins.get(r.md5) ?? []), r.id]);
console.log('\nByte twins:');
for (const [h, list] of twins) if (list.length > 1) console.log(' ', h, list.join(', '));

const pairs: { a: Row; b: Row; mel: number; rhy: number }[] = [];
for (let i = 0; i < rows.length; i++)
  for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i];
    const b = rows[j];
    if (a.md5 === b.md5) continue;
    pairs.push({ a, b, mel: sim(a.intervals, b.intervals), rhy: sim(a.rhythm, b.rhythm) });
  }
pairs.sort((x, y) => y.mel + y.rhy - (x.mel + x.rhy));
console.log('\nClosest top lines (melody = intervals, rhythm = note spacing; 1 = same):');
for (const p of pairs.slice(0, Number(flag('--top') ?? 40))) console.log(`  ${p.mel.toFixed(2)} ${p.rhy.toFixed(2)}  ${p.a.id} / ${p.b.id}`);
if (jsonOut)
  writeFileSync(jsonOut, JSON.stringify({ rows, pairs: pairs.slice(0, 200).map((p) => ({ a: p.a.id, b: p.b.id, mel: p.mel, rhy: p.rhy })) }, null, 1));
