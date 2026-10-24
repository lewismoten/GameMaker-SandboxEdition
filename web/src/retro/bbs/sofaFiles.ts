// The Sofa's file library: only a few files, all the board's own, free to everyone (no
// ratio here, it's a hangout). Doc Leo uploaded his goat game, THIRD GOAT FROM THE LEFT;
// a download unzips into C:\DOWNLOAD\<GAME> like the Sandbox BBS's, FILE_ID.DIZ and all.
import type { RetroHost } from '../host';
import type { CatalogEntry } from '../../project/files';
import { commas } from '../dos/vfs';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { gameDiz, isSofaFile } from './fileId';
import { dizSummary, Pager, pageLabel, readNumber, uploadDate } from './pager';
import { Term, sleep } from './term';
import { expectText, progress } from './transfer';
import { dosDir } from '../../project/dosDir';
import { PLAYER_EXE_BYTES, downloadLine, sizeText, installedBytes, zipBytes, zipName } from '../../project/diskFacts';

/** Bytes per second PKUNZIP inflates and writes to the hard disk. */
const UNZIP_RATE = { turbo: 420_000, slow: 32_000 };

/** The board's own files: the games in the catalog that were uploaded to The Sofa. */
export function sofaLibrary(catalog: CatalogEntry[]): CatalogEntry[] {
  return catalog.filter((g) => g.gam && isSofaFile(g));
}

export async function sofaFiles(t: Term, h: RetroHost): Promise<void> {
  const files = sofaLibrary(await h.catalog());
  const entries = () =>
    files.map((g, i) => {
      const got = h.downloads.has(g.id) ? '|10*' : ' ';
      const desc = gameDiz(g).filter((l) => !/^-+$/.test(l));
      return desc.map((l, j) =>
        j === 0
          ? `|14${String(i + 1).padStart(2)} ${got}|15${zipName(g).padEnd(12)}|14${commas(zipBytes(g)).padStart(9)} |07${l}`
          : `${' '.repeat(26)}|${j === desc.length - 1 ? '08' : '07'}${l}`,
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
      files.map(
        (g, i) =>
          `|14${String(i + 1).padStart(2)} ${h.downloads.has(g.id) ? '|10*' : ' '}|15${zipName(g).padEnd(12)}|14${commas(zipBytes(g)).padStart(9)} |03${uploadDate(g.id, g.year)} |07${dizSummary(gameDiz(g))}`,
      ),
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
      t.line(`|14${zipName(g)} |15${g.title}`);
      t.line(sizeAbout(g));
      for (const l of gameDiz(g)) t.line(`|07  ${l}`);
      t.line();
    }
  }
}

/** The V# view's size line: the ZIP, its time on the phone line, and the room it takes unzipped. */
export function sizeAbout(g: CatalogEntry): string {
  return `|07  |14${commas(zipBytes(g))}|07 bytes: |14${downloadLine(zipBytes(g), '|07, |14')}|07. Unzipped: |14${sizeText(installedBytes(g))}|07.`;
}

async function download(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const size = zipBytes(g);
  t.line(`|15Zmodem|07.  ${zipName(g)}, |14${commas(size)}|07 bytes: |14${downloadLine(size, '|07, |14')}|07.`);
  t.line(`|07Starting transfer: ${expectText(size)}. |08(Esc aborts, Space skips ahead)`);
  if ((await progress(t, h, zipName(g), size)).aborted) {
    t.line();
    t.line('|12Transfer aborted.');
    return;
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
  // PKUNZIP runs on this PC: its words show at once
  t.local(`|07C:\\>PKUNZIP -d ${zipName(g)} C:\\DOWNLOAD\\${dosDir(g)}\n`);
  t.local(`|07Searching ZIP: ${zipName(g)}\n`);
  const files: [string, number][] = [
    ...(g.exe ? [[g.exe, PLAYER_EXE_BYTES] as [string, number]] : []),
    ...g.files.map((f, i): [string, number] => [f.toUpperCase(), g.sizes?.[i] ?? Math.round((g.bytes ?? 0) / g.files.length)]),
    ['FILE_ID.DIZ', 450],
  ];
  for (const [name, size] of files) {
    t.local(`|07  Inflating: ${name.padEnd(13)}`);
    const x = s.cursorX;
    const ms = (size / rate) * 1000;
    const start = performance.now();
    for (let f = 0; f < 1;) {
      f = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
      s.write(x, s.cursorY, attr(7, 0), `${Math.round(f * 100)}%`.padStart(4));
      if (f < 1) await sleep(Math.min(100, ms / 4));
    }
    s.write(x, s.cursorY, attr(7, 0), '    ');
    t.local('\n');
  }
}
