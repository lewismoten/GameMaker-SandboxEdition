// The Utilities file area of THE -= S A N D B O X =- BBS: DOS tools uploaded by callers,
// downloaded by Zmodem and unzipped into C:\DOWNLOAD\<NAME> with their FILE_ID.DIZ, the way
// the shareware games are (bbs.ts). Each tool's files are listed here; the C: drive shows the
// downloaded ones (retro/hacks/deskFiles.ts). Another tool joins by adding an entry to UTILITIES.
import type { RetroHost } from '../host';
import type { ProgramRef } from '../dos/vfs';
import { attr, COLS, ROWS } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { toCp437 } from '../text/cp437';
import { commas } from '../dos/vfs';
import { boxBottom, boxRow, boxTop, sleep, type Term } from './term';
import { GMCRACK_DIZ, GMCRACK_NFO } from '../hacks/gmcrackText';
import { SAVEHACK_DIZ, SAVEHACK_DOC } from '../hacks/saveHackText';
import { recordDownload, updateAccount } from './ratio';

export interface UtilityFile {
  name: string;
  size: number;
  /** A text file's lines (CP437 is applied when read). */
  text?: string[];
  run?: ProgramRef;
}

export interface BbsUtility {
  /** The download's id, and its folder: C:\DOWNLOAD\<ID>. */
  id: string;
  zip: string;
  /** The archive's size on the board. */
  bytes: number;
  diz: string[];
  /** What PKUNZIP puts in the folder, besides FILE_ID.DIZ. */
  files: UtilityFile[];
}

export const UTILITIES: BbsUtility[] = [
  {
    id: 'gmcrack',
    zip: 'GMCRACK.ZIP',
    bytes: 31_377,
    diz: GMCRACK_DIZ,
    files: [
      { name: 'GMCRACK.EXE', size: 42_667, run: { kind: 'gmcrack' } },
      { name: 'GMCRACK.NFO', size: 0, text: GMCRACK_NFO },
    ],
  },
  {
    id: 'savehack',
    zip: 'SAVEHACK.ZIP',
    bytes: 24_918,
    diz: SAVEHACK_DIZ,
    files: [
      { name: 'SAVEHACK.EXE', size: 38_214, run: { kind: 'savehack' } },
      { name: 'SAVEHACK.DOC', size: 0, text: SAVEHACK_DOC },
    ],
  },
];

/** A text file's bytes: CP437, CR LF line ends. */
export function textBytes(lines: string[]): Uint8Array {
  const text = toCp437(lines.map((l) => `${l}\r\n`).join(''));
  return Uint8Array.from(text, (c) => c.charCodeAt(0) & 255);
}

export const fileSize = (f: UtilityFile): number => (f.text ? textBytes(f.text).length : f.size);

const CPS = 1650; // 14,400 bps with V.42bis

export async function utilityArea(t: Term, h: RetroHost): Promise<void> {
  const s = h.screen;
  const list = () => {
    s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
    s.cursorX = 0;
    s.cursorY = 0;
    t.line(boxTop('Utilities: DOS Tools From Our Callers'));
    t.line(boxRow('|11  #  File name        Size  Description'));
    t.line(boxBottom());
    UTILITIES.forEach((u, i) => {
      const got = h.downloads.has(u.id) ? '|10*' : ' ';
      u.diz.forEach((l, j) =>
        t.line(j === 0 ? `|11${String(i + 1).padStart(2)} ${got}|15${u.zip.padEnd(12)}|14${commas(u.bytes).padStart(8)} |07${l}` : `${' '.repeat(25)}|07${l}`),
      );
    });
    t.line('|10*|07 = already downloaded to C:\\DOWNLOAD');
  };
  list();
  for (;;) {
    t.print('|11D# to download, L to list again, Q to quit: |15');
    const answer = ((await readLine(s, h.keys, [], 6, attr(15, 0))) ?? 'Q').trim().toUpperCase();
    t.line();
    if (!answer || answer === 'Q') return;
    if (answer === 'L') {
      list();
      continue;
    }
    const u = UTILITIES[Number(answer.replace(/^D/, '')) - 1];
    if (!u) t.line('|12No such file.');
    else await download(t, h, u);
  }
}

async function download(t: Term, h: RetroHost, u: BbsUtility): Promise<void> {
  const s = h.screen;
  t.line(`|07Protocol: |15Zmodem|07.  ${u.zip} is |14${commas(u.bytes)}|07 bytes, about |14${Math.max(1, Math.round(u.bytes / CPS / 60))}|07 minute(s) at 14,400 bps.`);
  t.line('|07Starting transfer... (Esc to abort)');
  const row = s.cursorY;
  const start = performance.now();
  const total = ((u.bytes / CPS) * 1000) / 4; // a small file: a quarter of real time
  for (;;) {
    if (h.keys.poll()?.key === 'Escape') {
      t.line();
      t.line('|12Transfer aborted.');
      return;
    }
    const f = Math.min(1, (performance.now() - start) / total);
    s.cursorY = row;
    s.cursorX = 0;
    t.print(`|15${u.zip.padEnd(12)} |10${toCp437('█'.repeat(Math.round(f * 30)).padEnd(30, '░'))} |14${commas(Math.round(u.bytes * f)).padStart(9)} |07bytes  ${CPS} cps`);
    if (f >= 1) break;
    await sleep(120);
  }
  t.line();
  t.line('|10Transfer complete.');
  const dir = u.id.toUpperCase();
  t.line(`|07C:\\>PKUNZIP -d ${u.zip} C:\\DOWNLOAD\\${dir}`);
  t.line(`|07Searching ZIP: ${u.zip}`);
  for (const name of [...u.files.map((f) => f.name), 'FILE_ID.DIZ']) {
    t.line(`|07  Inflating: ${name}`);
    await sleep(h.turbo() ? 60 : 300);
  }
  h.downloads.add(u.id);
  updateAccount((a) => recordDownload(a, u.bytes, true)); // the SysOp's upload: FREE
  const exe = u.files.find((f) => f.run)?.name.replace(/\.EXE$/i, '');
  t.line(`|07Type |15CD \\DOWNLOAD\\${dir}|07${exe ? ` then |15${exe}|07` : ''} after you log off.${u.files.some((f) => /\.NFO$/i.test(f.name)) ? ' Read the |15.NFO|07 first!' : ''}`);
  t.line();
}
