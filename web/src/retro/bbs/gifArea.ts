// The GIF Gallery file area: list the pictures, and download one by Zmodem while the
// terminal's GIF viewer paints it from the bytes received so far. A text terminal can't
// show graphics, so for the transfer the monitor switches to a 256-color graphics mode and
// the picture fills in (interlaced: coarse, then finer) as it arrives, the way terminal
// programs with view-while-download did it; then back to the BBS's text.
import type { RetroHost } from '../host';
import { attr, COLS, ROWS } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { toCp437 } from '../text/cp437';
import { commas } from '../dos/vfs';
import { decodePartialGif } from '../../formats/gifProgressive';
import { modeFor } from '../view/picture';
import { boxBottom, boxRow, boxTop, modemSignal, sleep, type Term } from './term';
import { caption, GALLERY, galleryBytes, paintGif, type GalleryFile } from './gallery';

/** 14,400 bps: GIFs are compressed already, so V.42bis can't squeeze them further. */
export const GIF_CPS = 1440;
/** A 250K picture takes three minutes at 14,400; here it takes about 17 seconds. */
export const GIF_TIME_COMPRESSION = 10;

/** How many bytes have arrived `ms` after the transfer started (at the board's sped-up rate). */
export function bytesAt(ms: number, size: number, cps = GIF_CPS * GIF_TIME_COMPRESSION): number {
  return Math.max(0, Math.min(size, Math.floor((ms / 1000) * cps)));
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width) {
      out.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) out.push(line);
  return out;
}

export async function gifGallery(t: Term, h: RetroHost): Promise<void> {
  const s = h.screen;
  const list = () => {
    s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
    s.cursorX = 0;
    s.cursorY = 0;
    t.line(boxTop('GIF Gallery: The SysOp\'s Snapshots'));
    t.line(boxRow(`|11#  ${'File name'.padEnd(12)}${'Size'.padStart(8)} ${'Picture'.padEnd(12)} Description`));
    t.line(boxBottom());
    for (const [i, f] of GALLERY.entries()) {
      const got = h.downloads.has(f.name) ? '|10*' : ' ';
      const desc = wrap(f.desc, 41);
      t.line(
        `|11${String(i + 1).padStart(2)} ${got}|15${f.name.padEnd(12)}|14${commas(f.bytes).padStart(8)} |03${`${f.width}x${f.height}`.padEnd(7)} |03${String(f.colors).padStart(3)}c |07${desc[0] ?? ''}`,
      );
      if (desc[1]) t.line(`${' '.repeat(38)}|07${desc[1]}`);
    }
    t.line('|10*|07 = already in C:\\DOWNLOAD   |08Interlaced GIFs: they fill in as they arrive.');
  };
  list();
  for (;;) {
    t.print('|11D# to download and view, L to list again, Q to quit: |15');
    const answer = ((await readLine(s, h.keys, [], 6, attr(15, 0))) ?? 'Q').trim().toUpperCase();
    t.line();
    if (!answer || answer === 'Q') return;
    if (answer === 'L') {
      list();
      continue;
    }
    const f = GALLERY[Number(answer.replace(/^D/, '')) - 1];
    if (!f) t.line('|12No such file.');
    else await downloadGif(t, h, f);
  }
}

async function downloadGif(t: Term, h: RetroHost, f: GalleryFile): Promise<void> {
  const real = f.bytes / GIF_CPS;
  t.line(`|07Protocol: |15Zmodem|07.  ${f.name} is |14${commas(f.bytes)}|07 bytes, about |14${Math.max(1, Math.round(real / 60))}|07 minute(s) at 14,400 bps.`);
  let bytes: Uint8Array;
  try {
    bytes = await galleryBytes(f.name);
  } catch {
    t.line('|12The file is not on line right now. Try again later.');
    return;
  }
  t.line('|07Starting transfer. Your GIF viewer will show it as it comes in. |08(Esc aborts)');
  t.print('');
  await sleep(900);
  const [sw, sh] = modeFor(f.width, f.height);
  const scr = h.pictureMode(sw, sh);
  let got = 0;
  let aborted = false;
  const start = performance.now();
  try {
    for (;;) {
      t.print(''); // a dropped call ends the transfer
      got = bytesAt(performance.now() - start, bytes.length);
      const g = decodePartialGif(bytes.subarray(0, got));
      if (g) paintGif(scr, g);
      modemSignal('receive');
      if (scr.poll() === 'Escape') {
        aborted = true;
        break;
      }
      if (got >= bytes.length) break;
      await sleep(80);
    }
    if (!aborted) {
      caption(scr, 'Download complete - press a key');
      await scr.key();
    }
  } finally {
    h.leavePictureMode();
  }
  const bar = '█'.repeat(Math.round((got / bytes.length) * 30)).padEnd(30, '░');
  t.line(`|15${f.name.padEnd(12)} |10${toCp437(bar)} |14${commas(got).padStart(9)} |07bytes  ${GIF_CPS} cps`);
  if (aborted) {
    t.line('|12Transfer aborted.');
    return;
  }
  t.line(`|10Transfer complete. |07${f.name} saved in C:\\DOWNLOAD.`);
  h.downloads.add(f.name);
  t.line(`|07After you log off, type |15VPIC \\DOWNLOAD\\${f.name}|07 to look at it again.`);
  t.line();
}
