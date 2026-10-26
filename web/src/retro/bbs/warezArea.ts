// The W)arez area of THE -= S A N D B O X =- BBS: not on the main menu, behind an "elite users
// only" access code (bulletin 7 gives it away, and the SysOp breaks in with it after a couple
// of wrong tries). It holds GMCRACK, SAVEHACK, PLAYHACK and a four-ZIP "rip" of Game-Maker 3.00, each
// downloaded by Zmodem and unzipped into C:\DOWNLOAD\<ID> with its FILE_ID.DIZ, as the
// shareware games are (sandbox.ts); the C: drive shows the downloaded ones
// (retro/hacks/deskFiles.ts). Warez is not FREE: each ZIP costs a file point, and a caller out
// of points gets the SysOp's leech amnesty rather than a locked door.
import type { RetroHost } from '../host';
import type { ProgramRef } from '../dos/vfs';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { toCp437 } from '../text/cp437';
import { expectText, progress } from './transfer';
import { commas } from '../dos/vfs';
import { boxBottom, boxRow, boxTop, sleep, type Term } from './term';
import { Pager, pageLabel } from './pager';
import { DIZ_BYTES, pkunzip } from './pkunzip';
import { GMCRACK_DIZ, GMCRACK_NFO } from '../hacks/gmcrackText';
import { SAVEHACK_DIZ, SAVEHACK_DOC } from '../hacks/saveHackText';
import { PLAYHACK_DIZ, PLAYHACK_NFO } from '../hacks/playHackText';
import { GM30_DIZ, GM30_NFO, GM30_PART_BYTES, GM30_PARTS } from '../hacks/gm30Text';
import { account, filePoints, recordDownload, updateAccount } from './ratio';

interface WarezFile {
  name: string;
  size: number;
  /** A text file's lines (CP437 is applied when read). */
  text?: string[];
  run?: ProgramRef;
  /** Which of a multi-ZIP release's parts holds it (0, the first, by default). */
  part?: number;
}

interface WarezRelease {
  /** The download's id, and its folder: C:\DOWNLOAD\<ID>. */
  id: string;
  /** The name in the listing (a multi-ZIP release's set name). */
  zip: string;
  /** The ZIPs downloaded, for a release split over several. */
  parts?: string[];
  /** The archive's size on the board (all parts). */
  bytes: number;
  diz: string[];
  /** What PKUNZIP puts in the folder, besides FILE_ID.DIZ. */
  files: WarezFile[];
}

export const WAREZ: WarezRelease[] = [
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
  {
    id: 'playhack',
    zip: 'PLAYHACK.ZIP',
    bytes: 27_604,
    diz: PLAYHACK_DIZ,
    files: [
      { name: 'PLAYHACK.EXE', size: 40_118, run: { kind: 'playhack' } },
      { name: 'PLAYHACK.NFO', size: 0, text: PLAYHACK_NFO },
    ],
  },
  {
    id: 'gm30',
    zip: 'GM30.ZIP',
    parts: GM30_PARTS,
    bytes: GM30_PARTS.length * GM30_PART_BYTES,
    diz: GM30_DIZ,
    files: [
      { name: 'INSTALL.EXE', size: 61_421, run: { kind: 'install', from: 'warez' } },
      { name: 'GM30.NFO', size: 0, text: GM30_NFO },
      ...GM30_PARTS.map((_, i) => ({ name: `GM30.00${i + 1}`, size: GM30_PART_BYTES - 1_517 - i * 211, part: i })),
    ],
  },
];

/** The ZIPs a release downloads as. */
export const zipsOf = (r: WarezRelease): string[] => r.parts ?? [r.zip];

/** File points a release costs: one a ZIP. */
export const pointsFor = (r: WarezRelease): number => zipsOf(r).length;

/** The access code bulletin 7 gives (the group's name: DiGiTAL DUNE). */
export const ACCESS_CODE = 'DUNE';

/** Is the typed code the right one (any case, spaces ignored)? */
export const accessOk = (typed: string): boolean => typed.replace(/\s+/g, '').toUpperCase() === ACCESS_CODE;

/** Wrong codes before the SysOp breaks in and says it. */
const SYSOP_HELPS_AFTER = 2;

/** A text file's bytes: CP437, CR LF line ends. */
export function textBytes(lines: string[]): Uint8Array {
  const text = toCp437(lines.map((l) => `${l}\r\n`).join(''));
  return Uint8Array.from(text, (c) => c.charCodeAt(0) & 255);
}

export const fileSize = (f: WarezFile): number => (f.text ? textBytes(f.text).length : f.size);

/** Let in for this visit to the page (the code is asked once). */
let elite = false;
let wrongTries = 0;

/** "ELITE USERS ONLY": true when the caller may come in. */
async function accessCheck(t: Term, h: RetroHost): Promise<boolean> {
  if (elite) return true;
  t.line();
  t.line('|12▄▄▄▄▄▄▄▄ |15ELiTE USERS ONLY |12▄▄▄▄▄▄▄▄');
  t.line("|07This area isn't on the menu. If you found it, you're halfway there.");
  if (wrongTries >= SYSOP_HELPS_AFTER) {
    t.line(`|13<SysOp breaks into chat>|07 Oh, fine. It's |15${ACCESS_CODE}|07. Don't tell my mom.`);
  }
  t.print('|11Access code: |15');
  const typed = (await readLine(h.screen, h.keys, [], 12, attr(0, 0))) ?? ''; // typed in black, like a password
  t.line();
  if (accessOk(typed)) {
    elite = true;
    t.line('|10Access granted.|07 Welcome, elite d00d. Leeches will be fed to the corgi.');
    await sleep(700);
    return true;
  }
  wrongTries++;
  t.line("|12Access denied.|08 (SysOp's note: lamers skip the bulletins. Elite users read them twice.)");
  t.line();
  return false;
}

export async function warezArea(t: Term, h: RetroHost): Promise<void> {
  if (!(await accessCheck(t, h))) return;
  const s = h.screen;
  const pager = new Pager(t, {
    header: (p, n) => [
      boxTop(`W)arez: 0-Day Elite Releases (shhh)${n > 1 ? ` ${pageLabel(p, n)}` : ''}`),
      boxRow('|11  #  File name        Size  Description'),
      boxBottom(),
    ],
    entries: () =>
      WAREZ.map((u, i) => {
        const got = h.downloads.has(u.id) ? '|10*' : ' ';
        const desc = u.diz.filter((l) => !/^-+$/.test(l)); // as Renegade listed a DIZ, without its rules
        return desc.map((l, j) =>
          j === 0
            ? `|11${String(i + 1).padStart(2)} ${got}|15${u.zip.padEnd(12)}|14${commas(u.bytes).padStart(9)} |07${l}`
            : `${' '.repeat(26)}|${j === desc.length - 1 ? '08' : '07'}${l}`,
        );
      }),
    footer: () => [`|10*|07 = already in C:\\DOWNLOAD   |12Not FREE:|07 a file point a ZIP. You have |14${filePoints(account())}|07.`],
  });
  pager.show();
  for (;;) {
    t.print(`|11D# to download, ${pager.keys()}|15L|07 to list again, |15Q|07 to quit: |15`);
    const answer = ((await readLine(s, h.keys, [], 6, attr(15, 0))) ?? 'Q').trim().toUpperCase();
    t.line();
    if (pager.turn(answer)) continue;
    if (!answer || answer === 'Q') return;
    const u = WAREZ[Number(answer.replace(/^D/, '')) - 1];
    if (!u) t.line('|12No such file.');
    else await download(t, h, u);
  }
}

/** One ZIP's Zmodem transfer; false when aborted. */
async function transfer(t: Term, h: RetroHost, zip: string, bytes: number, label: string): Promise<boolean> {
  t.line(`|07${label}|15${zip}|07: |14${commas(bytes)}|07 bytes, ${expectText(bytes)}.`);
  if ((await progress(t, h, zip, bytes)).aborted) {
    t.line();
    t.line('|12Transfer aborted.');
    return false;
  }
  t.line();
  return true;
}

async function download(t: Term, h: RetroHost, u: WarezRelease): Promise<void> {
  const zips = zipsOf(u);
  const cost = pointsFor(u);
  // not FREE, but nobody gets locked out: short of points, the SysOp lets it slide
  const amnesty = filePoints(account()) < cost;
  if (amnesty) {
    t.line(`|12LEECH ALERT!|07 ${u.zip} costs |14${cost}|07 file point${cost === 1 ? '' : 's'}; you have |14${filePoints(account())}|07.`);
    t.line("|13<SysOp>|07 Eh, it's a slow night. This one's on the house. Upload something, ya leech!");
  }
  t.line(`|07Protocol: |15Zmodem|07${zips.length > 1 ? `, batch of |14${zips.length}|07 files` : ''}.  |08(Esc aborts, Space skips ahead)`);
  for (const [i, zip] of zips.entries()) {
    const label = zips.length > 1 ? `[${i + 1}/${zips.length}] ` : '';
    if (!(await transfer(t, h, zip, Math.round(u.bytes / zips.length), label))) return;
  }
  t.line(`|10Transfer complete.${zips.length > 1 ? ` All ${zips.length} parts received.` : ''}`);
  const dir = u.id.toUpperCase();
  for (const [p, zip] of zips.entries()) {
    const files = u.files.filter((f) => (f.part ?? 0) === p).map((f) => [f.name, fileSize(f)] as const);
    await pkunzip(t, h, zip, dir, p === 0 ? [...files, ['FILE_ID.DIZ', DIZ_BYTES] as const] : files);
  }
  h.downloads.add(u.id);
  updateAccount((a) => zips.reduce((acc) => recordDownload(acc, Math.round(u.bytes / zips.length), amnesty), a));
  const exe = u.files.find((f) => f.run)?.name.replace(/\.EXE$/i, '');
  t.line(
    `|07Type |15CD \\DOWNLOAD\\${dir}|07${exe ? ` then |15${exe}|07` : ''} after you log off.${u.files.some((f) => /\.NFO$/i.test(f.name)) ? ' Read the |15.NFO|07 first!' : ''}`,
  );
  t.line();
}
