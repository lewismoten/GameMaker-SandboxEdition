// Look at a screen through Ghost Jack: `npm run look -- [<shot>] [--out f.jpg] [--width 1280] [--crop x,y,w,h]
//   [--ocr] [--expect "text"] [--ocr-psm 11] [--ocr-scale 3]`. With no shot it takes a snapshot of the
//   CURRENT view (no move). With one it resolves a saved shot (slot 1-9 or name) with GET /api/shots, moves once with
//   POST /api/goto and saves the JPEG (default .for-lewis/progress-shots/<date>/look/<shot>-<time>.jpg, git-ignored).
//   --ocr prints the text tesseract reads (if installed); --expect exits 1 unless that text is in it.
//   Before tesseract the picture is made gray, resized (lanczos, --ocr-scale 0.5-6, default 1.5) and cut to black and
//   white at two brightness levels (170 and 210) with ffmpeg, and the words of both reads are merged,
//   (--ocr asks for a 1920-wide picture unless --width is given), which reads screen text far better than the raw camera frame (chunky fonts do worse when enlarged); --ocr-psm is tesseract's page mode (default 11,
//   sparse text; 6 suits one block). Only words with confidence 60+ are printed; --expect looks at every word.
// Saved shots must be re-saved after the camera is moved (SET + number on the Ghost Jack page).
// Snapshots and saved shots only: no say/play/ask/listen/clip, no sweeps. crop is fractions of the picture.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:8787';
const DOWN = `Ghost Jack bridge not reachable at 127.0.0.1:8787 — start it with \`cd ~/dev/ghostjack && npm start\``;

/** Command line to options; throws a message for a bad one. */
export function parseArgs(argv) {
  const o = { shot: null, out: null, width: 1280, crop: null, ocr: false, expect: null, ocrPsm: 11, ocrScale: 1.5, widthSet: false };
  const need = (i, name) => {
    if (i + 1 >= argv.length) throw new Error(`${name} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = need(i++, a);
    else if (a === '--width') {
      o.width = Number(need(i++, a));
      o.widthSet = true;
      if (!Number.isInteger(o.width) || o.width < 64 || o.width > 1920) throw new Error('--width is 64 to 1920');
    } else if (a === '--crop') {
      const p = need(i++, a).split(',').map(Number);
      if (p.length !== 4 || p.some((n) => !Number.isFinite(n) || n < 0 || n > 1)) throw new Error('--crop is x,y,w,h as fractions 0 to 1');
      o.crop = p;
    } else if (a === '--ocr-psm') {
      o.ocrPsm = Number(need(i++, a));
      if (!Number.isInteger(o.ocrPsm) || o.ocrPsm < 3 || o.ocrPsm > 13) throw new Error('--ocr-psm is 3 to 13');
    } else if (a === '--ocr-scale') {
      o.ocrScale = Number(need(i++, a));
      if (!(o.ocrScale >= 0.5 && o.ocrScale <= 6)) throw new Error('--ocr-scale is 0.5 to 6');
    } else if (a === '--ocr') o.ocr = true;
    else if (a === '--wait-settle')
      o.waitSettle = true; // the bridge always waits for the picture to settle
    else if (a === '--expect') {
      o.expect = need(i++, a);
      o.ocr = true;
    } else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else if (o.shot === null) o.shot = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

/** Slot number (1-9) for a number or a saved name (case-insensitive, exact first, then a unique prefix). */
export function resolveShot(shots, want) {
  if (/^[1-9]$/.test(want)) {
    if (!shots[Number(want) - 1]) throw new Error(`slot ${want} is empty`);
    return Number(want);
  }
  const named = shots.map((s, i) => (s ? { name: String(s.name ?? ''), slot: i + 1 } : null)).filter(Boolean);
  const w = want.toLowerCase();
  const exact = named.filter((s) => s.name.toLowerCase() === w);
  const hits = exact.length ? exact : named.filter((s) => s.name.toLowerCase().startsWith(w));
  if (hits.length === 1) return hits[0].slot;
  const list = named.map((s) => `${s.slot} ${s.name}`).join(', ');
  throw new Error(hits.length ? `"${want}" matches several shots (${list})` : `no shot "${want}" (saved: ${list})`);
}

/** Brightness cut-offs (0-255) tried one after the other: dim infrared pictures read best low, a bright color one high. */
export const OCR_THRESHOLDS = [170, 210];

/** ffmpeg arguments that make a camera frame readable for tesseract: gray, resized, then black text on white by `threshold`. */
export function preprocessArgs(inPath, outPath, scale = 1.5, threshold = 170) {
  const vf = `format=gray,scale=iw*${scale}:ih*${scale}:flags=lanczos,lutyuv=y='if(gt(val,${threshold}),255,0)'`;
  return ['-v', 'error', '-y', '-i', inPath, '-vf', vf, outPath];
}

/** tesseract arguments for a picture; TSV output carries each word's confidence. */
export function tesseractArgs(file, psm = 11) {
  return [file, 'stdout', '--psm', String(psm), 'tsv'];
}

/** Words from tesseract TSV: `all` is every word, `text` only those with confidence `minConf`+ and 3+ letters or digits. */
export function parseTsv(tsv, minConf = 60) {
  const all = [];
  const good = [];
  for (const line of tsv.split('\n').slice(1)) {
    const c = line.split('\t');
    if (c.length < 12 || !c[11].trim()) continue;
    all.push(c[11]);
    if (Number(c[10]) >= minConf && /[A-Za-z0-9]{3,}/.test(c[11])) good.push(c[11]);
  }
  return { all: all.join(' '), text: good.join(' ') };
}

/** Two parse results as one, keeping each word once (case-insensitive) in the order first seen. */
export function mergeWords(a, b) {
  const one = (x, y) => {
    const seen = new Set(
      x
        .split(' ')
        .filter(Boolean)
        .map((w) => w.toLowerCase()),
    );
    const add = y.split(' ').filter((w) => w && !seen.has(w.toLowerCase()) && seen.add(w.toLowerCase()));
    return [...x.split(' ').filter(Boolean), ...add].join(' ');
  };
  return { all: one(a.all, b.all), text: one(a.text, b.text) };
}

/** Whether the OCR text holds `want`, ignoring case and runs of white space. */
export function textHas(text, want) {
  const n = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return n(text).includes(n(want));
}

/** Fetch a bridge route; a refused connection becomes the "start it" message. */
async function call(fetchFn, path, token, init = {}) {
  let res;
  try {
    res = await fetchFn(BASE + path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  } catch {
    throw new Error(DOWN);
  }
  if (res.status === 429) throw new Error('the camera was moved a moment ago (429): wait a second and try again');
  if (!res.ok) throw new Error(`bridge answered ${res.status} for ${path}`);
  return res;
}

/** Go to the shot and return { jpeg, slot, settled }. */
export async function look(opts, token, fetchFn = fetch) {
  if (opts.shot == null) {
    // No shot: the camera's current view, no move.
    const q = new URLSearchParams({ width: String(opts.width) });
    if (opts.crop) q.set('crop', opts.crop.join(','));
    const res = await call(fetchFn, `/api/snapshot.jpg?${q}`, token);
    return { jpeg: Buffer.from(await res.arrayBuffer()), slot: null, settled: null };
  }
  const shots = await (await call(fetchFn, '/api/shots', token)).json();
  const slot = resolveShot(Array.isArray(shots) ? shots : shots.shots, opts.shot);
  const body = { shot: slot, width: opts.width };
  if (opts.crop) body.crop = opts.crop;
  const res = await call(fetchFn, '/api/goto', token, { method: 'POST', body: JSON.stringify(body) });
  return { jpeg: Buffer.from(await res.arrayBuffer()), slot, settled: res.headers.get('x-gj-settled') };
}

function defaultOut(shot) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const time = `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return join(root, '.for-lewis', 'progress-shots', day, 'look', `${shot.replace(/[^\w-]+/g, '_')}-${time}.jpg`);
}

/** Reads the words in a picture file: preprocess with ffmpeg at each threshold, tesseract on each, merged. */
export function ocrFile(out, opts) {
  let words = { all: '', text: '' };
  let tmp = null;
  try {
    tmp = mkdtempSync(join(tmpdir(), 'look-ocr-'));
    for (const t of OCR_THRESHOLDS) {
      let img = join(tmp, `ocr-${t}.png`);
      try {
        execFileSync('ffmpeg', preprocessArgs(out, img, opts.ocrScale, t), { stdio: 'ignore' });
      } catch {
        img = out;
        console.error('ffmpeg is not installed (or failed); reading the raw picture, which works poorly.');
      }
      const tsv = execFileSync('tesseract', tesseractArgs(img, opts.ocrPsm), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      words = mergeWords(words, parseTsv(tsv));
    }
  } catch {
    console.error('tesseract is not installed (or failed); --ocr skipped. Install it yourself, e.g. `brew install tesseract`.');
    process.exit(opts.expect ? 1 : 0);
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
  return words;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  let token;
  try {
    token = readFileSync(join(homedir(), '.config', 'ghostjack', 'token'), 'utf8').trim();
  } catch {
    throw new Error('no token at ~/.config/ghostjack/token (is Ghost Jack set up?)');
  }
  if (o.ocr && !o.widthSet) o.width = 1920; // small text needs the full picture
  const { jpeg, slot, settled } = await look(o, token);
  const out = resolve(o.out ?? defaultOut(o.shot ?? 'view'));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, jpeg);
  console.log(`${slot == null ? 'current view' : `shot ${slot}`}${settled === '0' ? ' (did not settle; look again)' : ''}: ${out}`);
  if (!o.ocr) return;
  const words = ocrFile(out, o);
  console.log(words.text);
  const text = words.all;
  if (o.expect && !textHas(text, o.expect)) {
    console.error(`expected text not found: "${o.expect}"`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
