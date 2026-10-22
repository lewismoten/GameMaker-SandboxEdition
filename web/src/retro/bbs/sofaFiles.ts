// The Sofa's file library: only a few files, all the board's own, free to everyone (no
// ratio here, it's a hangout). Doc Leo uploaded his goat game, THIRD GOAT FROM THE LEFT;
// a download unzips into C:\DOWNLOAD\<GAME> like the Sandbox BBS's, FILE_ID.DIZ and all.
import type { RetroHost } from '../host';
import type { CatalogEntry } from '../../project/files';
import { commas } from '../dos/vfs';
import { toCp437 } from '../text/cp437';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { gameDiz, isSofaFile } from './fileId';
import { dizSummary, Pager, pageLabel, readNumber, uploadDate } from './pager';
import { Term, sleep } from './term';
import { dosDir } from '../../project/dosDir';

/** 14,400 bps with V.42bis, in characters per second, and how much faster than life it runs. */
const CPS = 1650;
const TIME_COMPRESSION = 25;
/** Bytes per second PKUNZIP inflates and writes to the hard disk. */
const UNZIP_RATE = { turbo: 420_000, slow: 32_000 };

export const sofaZipName = (g: CatalogEntry) => `${(g.exe ?? g.id).replace(/\.EXE$/i, '').slice(0, 8).toUpperCase()}.ZIP`;
export const sofaZipSize = (g: CatalogEntry) => Math.round((g.bytes ?? 0) * 0.58);

/** The board's own files: the games in the catalog that were uploaded to The Sofa. */
export function sofaLibrary(catalog: CatalogEntry[]): CatalogEntry[] {
  return catalog.filter((g) => g.gam && isSofaFile(g));
}

export async function sofaFiles(t: Term, h: RetroHost): Promise<void> {
  const files = sofaLibrary(await h.catalog());
  const entries = () => files.map((g, i) => {
    const got = h.downloads.has(g.id) ? '|10*' : ' ';
    const desc = gameDiz(g).filter((l) => !/^-+$/.test(l));
    return desc.map((l, j) =>
      j === 0 ? `|14${String(i + 1).padStart(2)} ${got}|15${sofaZipName(g).padEnd(12)}|14${commas(sofaZipSize(g)).padStart(9)} |07${l}` : `${' '.repeat(26)}|${j === desc.length - 1 ? '08' : '07'}${l}`,
    );
  });
  const pager = new Pager(t, {
    header: (p, n) => [
      '|13          ──────────────── |15The Sofa |13─ |15File Library |13────────────────',
      `|07  Free for every caller. Uploaded by our own regulars.${n > 1 ? `|08   ${pageLabel(p, n)}` : ''}`,
      '',
    ],
    entries: () => (files.length ? entries() : [['|08  (the library is empty tonight)']]),
    // once the Bard's uploads outrun three pages: one line a file, V# for the whole DIZ
    compact: () =>
      files.map((g, i) => `|14${String(i + 1).padStart(2)} ${h.downloads.has(g.id) ? '|10*' : ' '}|15${sofaZipName(g).padEnd(12)}|14${commas(sofaZipSize(g)).padStart(9)} |03${uploadDate(g.id, g.year)} |07${dizSummary(gameDiz(g))}`),
    footer: ['', '|10*|07 = already downloaded to C:\\DOWNLOAD'],
  });
  pager.show();
  for (;;) {
    t.print(`|11V# to view, D# to download, ${pager.keys()}|11X to exit: |15`);
    const answer = ((await readLine(h.screen, h.keys, [], 6, attr(15, 0))) ?? 'X').trim().toUpperCase();
    t.line();
    if (pager.turn(answer)) continue;
    if (!answer || answer === 'X' || answer === 'Q') return;
    const dl = answer.startsWith('D');
    const g = files[(dl ? Number(answer.slice(1)) : readNumber(answer)) - 1];
    if (!g) {
      t.line('|12No such file.');
      continue;
    }
    if (dl) await download(t, h, g);
    else {
      t.line(`|14${sofaZipName(g)} |15${g.title}`);
      for (const l of gameDiz(g)) t.line(`|07  ${l}`);
      t.line();
    }
  }
}

async function download(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const size = sofaZipSize(g);
  const seconds = size / CPS;
  t.line(`|07Protocol: |15Zmodem|07.  ${sofaZipName(g)} is |14${commas(size)}|07 bytes, about |14${Math.ceil(seconds / 60)}|07 minute(s) at 14,400 bps.`);
  t.line('|07Starting transfer... (Esc to abort)');
  const s = h.screen;
  const row = s.cursorY;
  const start = performance.now();
  const total = (seconds * 1000) / TIME_COMPRESSION;
  for (;;) {
    if (h.keys.poll()?.key === 'Escape') {
      t.line();
      t.line('|12Transfer aborted.');
      return;
    }
    const f = Math.min(1, (performance.now() - start) / total);
    const bar = '█'.repeat(Math.round(f * 30)).padEnd(30, '░');
    s.cursorY = row;
    s.cursorX = 0;
    t.print(`|15${sofaZipName(g).padEnd(12)} |10${toCp437(bar)} |14${commas(Math.round(size * f)).padStart(9)} |07bytes  ${CPS} cps`);
    if (f >= 1) break;
    await sleep(120);
  }
  t.line();
  t.line('|10Transfer complete.');
  await unzip(t, h, g);
  h.downloads.add(g.id);
  t.line(`|07Type |15CD \\DOWNLOAD\\${dosDir(g)}|07 then |15${(g.exe ?? '').replace(/\.EXE$/i, '')}|07 after you log off to play.`);
  t.line();
}

/** PKUNZIP into C:\DOWNLOAD: each file takes as long as its size needs on this PC. */
async function unzip(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const s = h.screen;
  const rate = h.turbo() ? UNZIP_RATE.turbo : UNZIP_RATE.slow;
  t.line(`|07C:\\>PKUNZIP -d ${sofaZipName(g)} C:\\DOWNLOAD\\${dosDir(g)}`);
  t.line(`|07Searching ZIP: ${sofaZipName(g)}`);
  const files: [string, number][] = [
    ...(g.exe ? [[g.exe, 60_000] as [string, number]] : []),
    ...g.files.map((f, i): [string, number] => [f.toUpperCase(), g.sizes?.[i] ?? Math.round((g.bytes ?? 0) / g.files.length)]),
    ['FILE_ID.DIZ', 450],
  ];
  for (const [name, size] of files) {
    t.print(`|07  Inflating: ${name.padEnd(13)}`);
    const x = s.cursorX;
    const ms = (size / rate) * 1000;
    const start = performance.now();
    for (let f = 0; f < 1; ) {
      f = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
      s.write(x, s.cursorY, attr(7, 0), `${Math.round(f * 100)}%`.padStart(4));
      if (f < 1) await sleep(Math.min(100, ms / 4));
    }
    s.write(x, s.cursorY, attr(7, 0), '    ');
    t.line();
  }
}
