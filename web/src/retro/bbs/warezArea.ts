// The W)arez area of THE -= S A N D B O X =- BBS: not on the main menu, behind an "elite users
// only" access code (bulletin 7 gives it away, and the SysOp breaks in with it after a couple
// of wrong tries). It holds GMCRACK, SAVEHACK, PLAYHACK, PATCHING.TXT and a four-ZIP "rip" of Game-Maker 3.00, each
// downloaded by Zmodem and unzipped into C:\DOWNLOAD\<ID> with its FILE_ID.DIZ, as the
// shareware games are (sandbox.ts); the C: drive shows the downloaded ones
// (retro/hacks/deskFiles.ts). Warez is not FREE: each ZIP costs a file point, and a caller out
// of points gets the SysOp's leech amnesty rather than a locked door.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { expectText, progress } from './transfer';
import { commas } from '../dos/vfs';
import { boxBottom, boxRow, boxTop, sleep, type Term } from './term';
import { Pager, pageLabel } from './pager';
import { DIZ_BYTES, pkunzip } from './pkunzip';
import { account, filePoints, recordDownload, updateAccount } from './ratio';
import { ACCESS_CODE, accessOk, fileSize, pointsFor, WAREZ, zipsOf, type WarezRelease } from './warezList';

export { WAREZ, zipsOf } from './warezList';

/** Wrong codes before the SysOp breaks in and says it. */
const SYSOP_HELPS_AFTER = 2;

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
    // one line a release first, so all of them show at once; E shows each whole FILE_ID.DIZ
    opensCompact: true,
    compact: () =>
      WAREZ.map(
        (u, i) =>
          `|11${String(i + 1).padStart(2)} ${h.downloads.has(u.id) ? '|10*' : ' '}|15${u.zip.padEnd(12)}|14${commas(u.bytes).padStart(9)} |07${u.diz[0].replace(/\s*\[\d+\/\d+\]\s*$/, '')}`,
      ),
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
