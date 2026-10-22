// The GIF Gallery file area: list the pictures, and download one by Zmodem while the
// terminal's viewer paints it from the bytes received so far. A text terminal can't show
// graphics, so for the transfer the monitor switches to 320x200 256-color graphics and the
// picture fills in as it arrives (an interlaced GIF coarse then finer, a baseline JPEG top
// to bottom, a progressive JPEG blurry then sharper), the way terminal programs with
// view-while-download did it; then back to the BBS's text. Pictures go to C:\IMAGES.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { toCp437 } from '../text/cp437';
import { commas } from '../dos/vfs';
import { modeFor } from '../view/picture';
import { boxBottom, boxRow, boxTop, modemSignal, sleep, type Term } from './term';
import { Pager, pageLabel } from './pager';
import { caption, decodePicture, formatLabel, GALLERY, galleryBytes, paintPicture, type GalleryFile } from './gallery';
import { recordDownload, updateAccount } from './ratio';

/** 14,400 bps: GIFs and JPEGs are compressed already, so V.42bis can't squeeze them further. */
export const GIF_CPS = 1440;
/** Real time: a 20K picture takes 14 seconds to paint in, as it did (Space skips ahead). */
export const GIF_TIME_COMPRESSION = 1;

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
  const pager = new Pager(t, {
    header: (p, n) => [
      boxTop(`GIF Gallery: The SysOp's Snapshots${n > 1 ? ` ${pageLabel(p, n)}` : ''}`),
      boxRow(`|11#  ${'File name'.padEnd(12)}${'Size'.padStart(7)} ${'Picture'} ${'Format'.padEnd(9)} Description`),
      boxBottom(),
    ],
    entries: () =>
      GALLERY.map((f, i) => {
        const got = h.downloads.has(f.name) ? '|10*' : ' ';
        const desc = wrap(f.desc, 37);
        return [
          `|11${String(i + 1).padStart(2)} ${got}|15${f.name.padEnd(12)}|14${commas(f.bytes).padStart(7)} |03${`${f.width}x${f.height}`.padEnd(7)} |${f.format === 'GIF' ? '13' : '10'}${formatLabel(f).padEnd(9)} |07${desc[0] ?? ''}`,
          ...(desc[1] ? [`${' '.repeat(42)}|07${desc[1]}`] : []),
        ];
      }),
    footer: ['|10*|07 = already in C:\\IMAGES   |08Interlaced GIFs and JPEGs fill in as they arrive.'],
  });
  pager.show();
  for (;;) {
    t.print(`|11D# to download and view, ${pager.keys()}|15L|07 to list again, |15Q|07 to quit: |15`);
    const answer = ((await readLine(s, h.keys, [], 6, attr(15, 0))) ?? 'Q').trim().toUpperCase();
    t.line();
    if (pager.turn(answer)) continue;
    if (!answer || answer === 'Q') return;
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
  t.line('|07Starting transfer. Your viewer shows it as it comes in. |08(Esc aborts, Space skips ahead)');
  t.print('');
  await sleep(900);
  const [sw, sh] = modeFor(f.width, f.height);
  const scr = h.pictureMode(sw, sh);
  let got = 0;
  let aborted = false;
  let start = performance.now();
  try {
    for (;;) {
      t.print(''); // a dropped call ends the transfer
      got = bytesAt(performance.now() - start, bytes.length);
      const pic = decodePicture(bytes.subarray(0, got));
      if (pic) paintPicture(scr, pic);
      modemSignal('receive');
      const k = scr.poll();
      if (k === 'Escape') {
        aborted = true;
        break;
      }
      if (k === ' ') start = performance.now() - (bytes.length / GIF_CPS / GIF_TIME_COMPRESSION) * 1000; // skip to the end
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
  t.line(`|10Transfer complete. |07${f.name} saved in C:\\IMAGES.`);
  h.downloads.setDir('IMAGES', true); // made with the first picture
  h.downloads.add(f.name);
  updateAccount((a) => recordDownload(a, bytes.length, true)); // the SysOp's snapshots: FREE
  t.line(`|07After you log off, type |15VPIC \\IMAGES\\${f.name}|07 to look at it again.`);
  t.line();
}
