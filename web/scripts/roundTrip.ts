// Round-trips every original file: the engine's reader, then the matching serializer, then a
// byte compare. `npm run roundtrip -- [<folder|zip>...] [--type gam,map,...] [--out base]`.
// Zips are read in memory with the archives package (never extracted, nothing run from them).
// Types with no byte-faithful serializer (gif, voc, fli, txt, lst...) are counted as skipped.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { forLewis, mainCheckout } from './mainCheckout';
import { readZip, isZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseMonsters, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { BLOCK_COUNTS, parseBlocks, serializeBlocks, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parsePalette, serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { parseHighScores, serializeHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';
import { parseSoundSet, serializeSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { parseRecording, serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { parseBackdrop, serializeBackdrop } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { readSong, writeSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';

type Trip = (b: Uint8Array) => Uint8Array;
const blocks =
  (k: BlockKind): Trip =>
  (b) =>
    serializeBlocks(parseBlocks(b, BLOCK_COUNTS[k]));
const TRIPS: Record<string, Trip> = {
  gam: (b) => serializeGame(parseGame(b)),
  map: (b) => serializeMap(parseMap(b)),
  mon: (b) => serializeMonsters(parseMonsters(b)),
  chr: (b) => serializeCharacter(parseCharacter(b)),
  bbl: blocks('bbl'),
  mbl: blocks('mbl'),
  cbl: blocks('cbl'),
  pal: (b) => serializePalette(parsePalette(b)),
  his: (b) => serializeHighScores(parseHighScores(b)),
  snd: (b) => serializeSoundSet(parseSoundSet(b)),
  rec: (b) => serializeRecording(parseRecording(b)),
  bkd: (b) => serializeBackdrop(parseBackdrop(b)),
  cmf: (b) => writeSong(readSong(b)),
};

interface Stat {
  files: number;
  same: number;
  diff: number;
  bad: number;
  rows: string[][];
}
const stats = new Map<string, Stat>();
const skipped = new Map<string, number>();

const args = process.argv.slice(2);
const inputs: string[] = [];
let only: string[] | undefined;
const date = new Date().toISOString().slice(0, 10);
let outBase = join(forLewis, 'research/roundtrip', date);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type') only = (args[++i] ?? '').toLowerCase().split(',');
  else if (args[i] === '--out') outBase = args[++i] ?? outBase;
  else inputs.push(args[i]);
}
if (!inputs.length) {
  const archive = join(forLewis, 'reference/archive');
  if (existsSync(archive)) inputs.push(archive);
  inputs.push(join(mainCheckout, 'cd'));
}

function hex(b: Uint8Array, at: number): string {
  return Array.from(b.subarray(Math.max(0, at - 4), at + 12), (v) => v.toString(16).padStart(2, '0')).join(' ');
}

function check(label: string, name: string, data: Uint8Array): void {
  const ext = extname(name).slice(1).toLowerCase();
  const trip = TRIPS[ext];
  if (!trip || (only && !only.includes(ext))) {
    if (!trip) skipped.set(ext || '(none)', (skipped.get(ext || '(none)') ?? 0) + 1);
    return;
  }
  const s = stats.get(ext) ?? { files: 0, same: 0, diff: 0, bad: 0, rows: [] };
  stats.set(ext, s);
  s.files++;
  let out: Uint8Array;
  try {
    out = trip(data);
  } catch (e) {
    s.bad++;
    s.rows.push([label, 'unreadable', String((e as Error).message).slice(0, 80)]);
    return;
  }
  let at = 0;
  const n = Math.min(out.length, data.length);
  while (at < n && out[at] === data[at]) at++;
  if (at === n && out.length === data.length) {
    s.same++;
    return;
  }
  s.diff++;
  s.rows.push([label, `size ${data.length}->${out.length}`, `offset ${at}`, `orig ${hex(data, at)}`, `back ${hex(out, at)}`]);
}

function* walk(p: string): Generator<string> {
  if (statSync(p).isDirectory()) for (const f of readdirSync(p).sort()) yield* walk(join(p, f));
  else yield p;
}

async function main(): Promise<void> {
  let zips = 0;
  const unreadableZips: string[][] = [];
  for (const input of inputs) {
    for (const path of walk(input)) {
      const bytes = new Uint8Array(readFileSync(path));
      if (/\.zip$/i.test(path) && isZip(bytes)) {
        try {
          const entries = await readZip(bytes);
          zips++;
          for (const e of entries) check(`${path.split('/').slice(-2).join('/')}!${e.name}`, e.name, e.data);
        } catch (e) {
          const reason = (e as Error).message;
          unreadableZips.push([path, 'unreadable', reason]);
          console.error(`zip ${path}: ${reason}`);
        }
      } else check(path, path, bytes);
    }
  }
  const tsv: string[] = ['type\tfile\tresult\tdetail'];
  const md: string[] = [
    `# Round-trip of original files (${date})`,
    '',
    `Inputs: ${inputs.join(', ')} (${zips} ${zips === 1 ? 'zip' : 'zips'} read in memory).`,
    '',
  ];
  const table = ['| type | files | identical | different | unreadable |', '|---|---|---|---|---|'];
  for (const [ext, s] of [...stats].sort()) {
    table.push(`| ${ext} | ${s.files} | ${s.same} | ${s.diff} | ${s.bad} |`);
    for (const r of s.rows) tsv.push([ext, ...r].join('\t'));
  }
  md.push(
    ...table,
    '',
    `Skipped (no byte-faithful serializer): ${[...skipped]
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')}`,
    '',
  );
  for (const [ext, s] of [...stats].sort()) {
    if (!s.rows.length) continue;
    md.push(`## ${ext}: first ${Math.min(3, s.rows.length)} of ${s.rows.length} failures`, '');
    for (const r of s.rows.slice(0, 3)) md.push(`- ${r.join(' | ')}`);
    md.push('');
  }
  if (unreadableZips.length) {
    md.push('## Unreadable archives', '');
    for (const row of unreadableZips) {
      md.push(`- ${row.join(' | ')}`);
      tsv.push(['zip', ...row].join('\t'));
    }
    md.push('');
  }
  console.log(table.join('\n'));
  console.log(
    `skipped: ${[...skipped]
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')}`,
  );
  for (const [ext, s] of [...stats].sort()) for (const r of s.rows.slice(0, 3)) console.log(`${ext}: ${r.join(' | ')}`);
  mkdirSync(dirname(outBase), { recursive: true });
  writeFileSync(`${outBase}.md`, md.join('\n'));
  writeFileSync(`${outBase}.tsv`, tsv.join('\n') + '\n');
}
void main();
