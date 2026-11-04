// `npm run fuzz:files -- [--seed n] [--rounds n] [--type gam,map,zip,...] [--limit ms] [--save dir] [--out report.txt]`
// Malformed-file test: starts from real files (the CD's games, a few zips from .for-lewis/reference/archive), makes
// truncated, bit-flipped, huge-count, padded and wrong-type copies, and feeds each to every engine reader and to the
// archive importer. Each case runs in a child process with a time limit and a heap cap, so a hang or a runaway
// allocation is caught and the run goes on. Seeded: the same --seed gives the same cases.
// Verdicts: clear (threw a plain Error), ok (returned), bad (TypeError/RangeError or a native message from deep inside),
// hang (over the limit), memory (heap cap or large allocation). Exit 1 if anything is bad, hang or memory.
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseCmf } from '@lewismoten/gamemaker-sandbox-engine/formats/cmf';
import { readSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { buildPreview } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfPreview';
import { parseFli, newFliCanvas, applyFliFrame } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeFliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { decodePartialGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gifProgressive';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { parseHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';
import { decodePartialJpeg } from '@lewismoten/gamemaker-sandbox-engine/formats/jpeg';
import { parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { parseSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { listZip, readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { unpackGames } from '@lewismoten/gamemaker-sandbox-archives';

const REPO = resolve(fileURLToPath(import.meta.url), '../../..');
const CD = process.env.FUZZ_CD ?? '/Users/lewismoten/dev/GameMaker/cd';
const ARCHIVE = process.env.FUZZ_ARCHIVE ?? '/Users/lewismoten/dev/GameMaker/.for-lewis/reference/archive';

type Run = (b: Uint8Array) => unknown;
const stepFli = (b: Uint8Array) => {
  const a = parseFli(b);
  const c = newFliCanvas(a);
  for (let i = 0; i < Math.min(a.frames.length, 20); i++) applyFliFrame(a, i, c);
};
// reader name -> [source types it is meant for, how to call it]
const READERS: Record<string, [string[], Run]> = {
  parseGame: [['gam'], parseGame],
  parseMap: [['map'], parseMap],
  parseBlocks: [['mbl', 'bbl', 'cbl'], (b) => parseBlocks(b, 64)],
  parseBlocksHuge: [['mbl', 'bbl', 'cbl'], (b) => parseBlocks(b, 65535)],
  parseCharacter: [['chr'], parseCharacter],
  parseMonsters: [['mon'], parseMonsters],
  parseSoundSet: [['snd'], parseSoundSet],
  parsePalette: [['pal'], parsePalette],
  parseCmf: [['cmf'], parseCmf],
  readSong: [['cmf'], readSong],
  buildPreview: [['cmf'], (b) => buildPreview(readSong(b))],
  parseFli: [['fli'], parseFli],
  playFli: [['fli'], stepFli],
  decodeFliFrames: [['fli'], decodeFliFrames],
  decodeGif: [['gif'], decodeGif],
  decodePartialGif: [['gif'], decodePartialGif],
  decodePartialJpeg: [['jpg'], decodePartialJpeg],
  decodeVoc: [['voc'], decodeVoc],
  parseSlideList: [['lst'], parseSlideList],
  parseBackdrop: [['gif', 'lst'], parseBackdrop],
  parseHighScores: [['hi'], parseHighScores],
  parseRecording: [['rec'], parseRecording],
  listZip: [['zip'], (b) => listZip(b)],
  readZip: [['zip'], (b) => readZip(b)],
  unpackGames: [['zip'], (b) => unpackGames(b, { name: 'fuzz.zip' })],
  importFolder: [['folder'], () => undefined], // the child swaps one file of a game folder
};

// ---- seeded randomness and mutation ----
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

interface Source {
  type: string;
  name: string;
  bytes: Uint8Array;
}
const MUTATIONS = [
  'trunc0',
  'trunc1',
  'trunc2',
  'trunc4',
  'trunc16',
  'trunc64',
  'truncHalf',
  'truncLast',
  'truncRand',
  'flip1',
  'flip8',
  'flip64',
  'bigHeader16',
  'bigHeader32',
  'bigHeaderMax',
  'bigRandom',
  'pad4M',
  'padRandom1M',
  'wrongType',
  'noise',
  'ff',
  'zeros',
  'untouched',
];
function mutate(kind: string, src: Uint8Array, other: Uint8Array, r: () => number): Uint8Array {
  const n = src.length;
  const pick = (m: number) => Math.floor(r() * m);
  const copy = () => Uint8Array.from(src);
  switch (kind) {
    case 'trunc0':
      return src.slice(0, 0);
    case 'trunc1':
      return src.slice(0, 1);
    case 'trunc2':
      return src.slice(0, 2);
    case 'trunc4':
      return src.slice(0, 4);
    case 'trunc16':
      return src.slice(0, 16);
    case 'trunc64':
      return src.slice(0, 64);
    case 'truncHalf':
      return src.slice(0, n >> 1);
    case 'truncLast':
      return src.slice(0, Math.max(0, n - 1));
    case 'truncRand':
      return src.slice(0, pick(n + 1));
    case 'flip1':
    case 'flip8':
    case 'flip64': {
      const c = copy();
      const k = kind === 'flip1' ? 1 : kind === 'flip8' ? 8 : 64;
      for (let i = 0; i < k && n; i++) c[pick(n)] ^= 1 << pick(8);
      return c;
    }
    case 'bigHeader16':
    case 'bigHeader32':
    case 'bigHeaderMax':
    case 'bigRandom': {
      const c = copy();
      const w = kind === 'bigHeader16' ? 2 : 4;
      const span = kind === 'bigRandom' ? n : Math.min(n, 64);
      for (let k = 0; k < (kind === 'bigRandom' ? 3 : 1) && span >= w; k++) {
        const at = pick(span - w + 1);
        const v = kind === 'bigHeaderMax' ? 0xffffffff : kind === 'bigHeader16' ? 0xffff : [0x7fffffff, 0x80000000, 0x01000000, 0xffff][pick(4)];
        for (let i = 0; i < w; i++) c[at + i] = (v >>> (8 * i)) & 255;
      }
      return c;
    }
    case 'pad4M': {
      const c = new Uint8Array(n + (4 << 20));
      c.set(src);
      return c;
    }
    case 'padRandom1M': {
      const c = new Uint8Array(n + (1 << 20));
      c.set(src);
      for (let i = n; i < c.length; i++) c[i] = pick(256);
      return c;
    }
    case 'wrongType':
      return other;
    case 'noise': {
      const c = new Uint8Array(pick(4096));
      for (let i = 0; i < c.length; i++) c[i] = pick(256);
      return c;
    }
    case 'ff':
      return new Uint8Array(pick(2048)).fill(255);
    case 'zeros':
      return new Uint8Array(pick(2048));
    default:
      return src;
  }
}

// ---- real sources ----
function walk(dir: string, out: string[], depth = 0) {
  if (depth > 6) return;
  let names: string[];
  try {
    names = readdirSync(dir).sort();
  } catch {
    return;
  }
  for (const n of names) {
    const p = join(dir, n);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out, depth + 1);
    else out.push(p);
  }
}
const TYPES = ['gam', 'map', 'mbl', 'bbl', 'cbl', 'chr', 'mon', 'snd', 'pal', 'cmf', 'fli', 'gif', 'jpg', 'voc', 'lst', 'hi', 'rec', 'zip'];
function loadSources(want: Set<string>, seed: number): Source[] {
  const r = rng(seed);
  const files: string[] = [];
  walk(CD, files);
  const byType = new Map<string, string[]>();
  for (const f of files) {
    const t = extname(f).slice(1).toLowerCase();
    if (!TYPES.includes(t) || statSync(f).size > 1 << 20) continue;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(f);
  }
  const zips: string[] = [];
  walk(ARCHIVE, zips);
  byType.set(
    'zip',
    zips.filter((z) => extname(z).toLowerCase() === '.zip' && statSync(z).size < 1500000),
  );
  const out: Source[] = [];
  for (const [t, list] of byType) {
    if (!want.has(t)) continue;
    const chosen = [...list].sort(() => r() - 0.5).slice(0, t === 'zip' ? 3 : 4);
    for (const f of chosen) out.push({ type: t, name: f.replace(CD, 'cd').replace(ARCHIVE, 'archive'), bytes: new Uint8Array(readFileSync(f)) });
  }
  return out;
}
function folderFiles(): Source[] {
  const dir = join(CD, 'gameware/donut');
  return readdirSync(dir).map((n) => ({ type: 'folder', name: 'cd/gameware/donut/' + n, bytes: new Uint8Array(readFileSync(join(dir, n))) }));
}

// ---- child: runs cases on request ----
interface Req {
  id: number;
  reader: string;
  src: number;
  kind: string;
  round: number;
}
function caseBytes(list: Source[], req: Req, seed: number) {
  const s = list[req.src];
  const r = rng(seed ^ hash(req.reader + s.name + req.kind) ^ (req.round * 7919));
  const others = list.filter((o) => o.type !== s.type);
  const other = others.length ? others[Math.floor(r() * others.length)] : s;
  return mutate(req.kind, s.bytes, other.bytes, r);
}
const NATIVE =
  /bounds of the DataView|typed array|Cannot read|not iterable|is not a function|undefined|null|Invalid array length|allocation failed|Offset is outside|out of range|Maximum call stack/i;
function child(seed: number, want: Set<string>) {
  const sources = loadSources(want, seed);
  const folder = folderFiles();
  process.on('message', async (m: Req | 'bye') => {
    if (m === 'bye') process.exit(0);
    const req = m;
    const list = req.reader === 'importFolder' ? folder : sources;
    const bytes = caseBytes(list, req, seed);
    const before = process.memoryUsage();
    const t0 = performance.now();
    let verdict = 'ok',
      msg = '';
    try {
      if (req.reader === 'importFolder') {
        const files = folder.map((f, i) => {
          const data = i === req.src ? bytes : f.bytes;
          return { path: f.name.replace('cd/gameware/', ''), size: data.length, read: () => Promise.resolve(data) };
        });
        await unpackGames(files);
      } else await READERS[req.reader][1](bytes);
    } catch (e) {
      const err = e as Error;
      msg = `${err?.name}: ${String(err?.message ?? e).slice(0, 160)}`;
      verdict = err instanceof Error && err.constructor === Error && !NATIVE.test(err.message) ? 'clear' : 'bad';
    }
    const after = process.memoryUsage();
    const grew = Math.max(after.heapUsed - before.heapUsed, after.arrayBuffers - before.arrayBuffers);
    if (grew > 256 << 20) verdict = 'memory';
    process.send!({ id: req.id, verdict, msg, ms: Math.round(performance.now() - t0), grew, size: bytes.length });
  });
  process.send!({ ready: true });
}

// ---- parent ----
function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
async function parent() {
  const seed = Number(arg('seed', '1'));
  const rounds = Number(arg('rounds', '1'));
  const limit = Number(arg('limit', '8000'));
  const typeArg = arg('type');
  const want = new Set(typeArg ? typeArg.split(',') : [...TYPES, 'folder']);
  const saveDir = arg('save');
  const out = arg('out');
  const readers = Object.keys(READERS).filter((n) => READERS[n][0].some((t) => want.has(t)));
  const sources = loadSources(want, seed);
  const folder = want.has('folder') ? folderFiles() : [];
  console.log(`seed ${seed}, rounds ${rounds}, ${sources.length} source files, ${readers.length} readers`);

  let proc: ReturnType<typeof spawn> | undefined;
  let waiting: ((m: Record<string, unknown>) => void) | undefined;
  const start = () =>
    new Promise<void>((ok) => {
      proc = spawn(
        resolve(REPO, 'node_modules/.bin/vite-node'),
        [fileURLToPath(import.meta.url), '--', '--child', '--seed', String(seed), ...(typeArg ? ['--type', typeArg] : [])],
        {
          stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
          env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1536' },
        },
      );
      proc.on('message', (m: Record<string, unknown>) => (m.ready ? ok() : waiting?.(m)));
      proc.on('exit', (code, sig) => waiting?.({ died: `${sig ?? code}` }));
    });
  await start();

  interface Row {
    reader: string;
    verdict: string;
    source: string;
    kind: string;
    msg: string;
    ms: number;
    size: number;
    round: number;
  }
  const rows: Row[] = [];
  const bad: Row[] = [];
  let id = 0;
  for (const reader of readers) {
    const list = reader === 'importFolder' ? folder : sources;
    const idxs = list.map((s, i) => [s, i] as const).filter(([s]) => READERS[reader][0].includes(s.type));
    for (const [s, i] of idxs) {
      for (let round = 0; round < rounds; round++) {
        for (const kind of MUTATIONS) {
          if (kind.startsWith('trunc') && kind !== 'truncRand' && round > 0) continue;
          if (['noise', 'ff', 'zeros'].includes(kind) && s !== idxs[0][0]) continue;
          const req: Req = { id: ++id, reader, src: i, kind, round };
          const reply = await new Promise<Record<string, unknown>>((done) => {
            const timer = setTimeout(() => done({ verdict: 'hang', msg: `no answer in ${limit} ms`, ms: limit, size: 0 }), limit);
            waiting = (m) => {
              clearTimeout(timer);
              done(m);
            };
            proc!.send(req);
          });
          let verdict = reply.verdict as string,
            msg = (reply.msg as string) ?? '';
          if (reply.died) {
            verdict = 'memory';
            msg = `child died (${reply.died as string}), likely out of memory`;
          }
          if (verdict === 'hang' || reply.died) {
            proc!.removeAllListeners('exit');
            proc!.kill('SIGKILL');
            await start();
          }
          const row: Row = { reader, verdict, source: s.name, kind, msg, ms: (reply.ms as number) ?? 0, size: (reply.size as number) ?? 0, round };
          rows.push(row);
          if (!['ok', 'clear'].includes(verdict)) {
            bad.push(row);
            if (saveDir) {
              mkdirSync(saveDir, { recursive: true });
              writeFileSync(join(saveDir, `${reader}-${basename(s.name)}-${kind}-r${round}.bin`), caseBytes(list, req, seed));
            }
          }
        }
      }
    }
  }
  proc?.send('bye');

  const per = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const c = per.get(r.reader) ?? {};
    c[r.verdict] = (c[r.verdict] ?? 0) + 1;
    per.set(r.reader, c);
  }
  const cols = ['ok', 'clear', 'bad', 'hang', 'memory'];
  const lines = [`| reader | cases | ${cols.join(' | ')} |`, `|---|---|${cols.map(() => '---').join('|')}|`];
  for (const [k, c] of per) lines.push(`| ${k} | ${Object.values(c).reduce((a, b) => a + b, 0)} | ${cols.map((x) => c[x] ?? 0).join(' | ')} |`);
  const groups = new Map<string, Row[]>();
  for (const b of bad) {
    const k = `${b.reader} | ${b.verdict} | ${b.msg}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(b);
  }
  const detail = [...groups].map(([k, v]) => `- ${k}  (${v.length} cases; e.g. ${v[0].source} ${v[0].kind} round ${v[0].round}, ${v[0].size} bytes)`);
  const report = [`seed ${seed}, rounds ${rounds}`, '', ...lines, '', bad.length ? 'Problems:' : 'No problems.', ...detail].join('\n');
  console.log(report);
  if (out) writeFileSync(out, report + '\n');
  process.exit(bad.length ? 1 : 0);
}

if (process.argv.includes('--child')) child(Number(arg('seed', '1')), new Set(arg('type') ? arg('type')!.split(',') : [...TYPES, 'folder']));
else void parent();
