// The GIF Gallery file area: list the pictures, and download one by Zmodem while the
// terminal's viewer paints it from the bytes received so far. A text terminal can't show
// graphics, so for the transfer the monitor switches to 320x200 256-color graphics and the
// picture fills in as it arrives (an interlaced GIF coarse then finer, a baseline JPEG top
// to bottom, a progressive JPEG blurry then sharper), the way terminal programs with
// view-while-download did it; then back to the BBS's text. Pictures go to C:\IMAGES.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { readLine } from '../text/textInput';
import { commas } from '../dos/vfs';
import { modeFor } from '../view/picture';
import { boxBottom, boxRow, boxTop, modemSignal, sleep, type Term } from './term';
import { Pager, pageLabel } from './pager';
import { caption, decodePicture, formatLabel, GALLERY, galleryBytes, paintPicture, type GalleryFile } from './gallery';
import { recordDownload, updateAccount } from './ratio';
import { downloadLine } from '../../project/diskFacts';
import { cps, slowWait } from './lineSpeed';
import { cpsText, expectText } from './transfer';
import { words } from '../../keepTogether';

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of words(text)) {
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

/** Downloads a picture (from the Sandbox BBS's GIF Gallery or The Sofa's GIF area) into C:\IMAGES, painting it as it arrives. */
/**
 * Line noise in a picture coming in: what arrives is garbage, so the viewer paints streaks of
 * random colors from where the picture had got to downward, for as long as the noise lasts on
 * a text screen (Term.interrupt), about two and a half seconds.
 */
async function lineNoise(scr: ReturnType<RetroHost['pictureMode']>, done: number): Promise<void> {
  const from = Math.min(scr.height - 1, Math.floor(done * scr.height));
  for (let i = 0; i < 40; i++) {
    for (let n = 1 + Math.floor(Math.random() * 4); n > 0; n--) {
      const y = from + Math.floor(Math.random() * (scr.height - from));
      const x = Math.floor(Math.random() * scr.width);
      const run = Math.min(scr.width * (scr.height - y) - x, 8 + Math.floor(Math.random() * 400));
      const color = Math.floor(Math.random() * 256);
      // a run of one color, or of noise, wrapping onto the next row as a decoder's output would
      if (Math.random() < 0.5) scr.mem.fill(color, y * scr.width + x, y * scr.width + x + run);
      else for (let k = 0; k < run; k++) scr.mem[y * scr.width + x + k] = Math.floor(Math.random() * 256);
    }
    scr.invalidate();
    modemSignal('receive');
    await sleep(60);
  }
}

/** The bottom line while a picture comes in: a bar, the percent and the bytes so far (40 columns at most). */
export function progressLine(got: number, total: number): string {
  const f = total ? Math.min(1, got / total) : 1;
  const bar = '█'.repeat(Math.round(f * 12)).padEnd(12, '░');
  return toCp437(`${bar} ${Math.floor(f * 100)}%  ${commas(Math.floor(got))} of ${commas(total)}`);
}

export async function downloadGif(t: Term, h: RetroHost, f: GalleryFile): Promise<void> {
  if (f.board === 'sofa') t.line(`|15Zmodem|07.  ${f.name}, |14${commas(f.bytes)}|07 bytes: |14${downloadLine(f.bytes, '|07, |14')}|07.`);
  else t.line(`|07Protocol: |15Zmodem|07.  ${f.name} is |14${commas(f.bytes)}|07 bytes, ${expectText(f.bytes)}.`);
  let bytes: Uint8Array;
  try {
    bytes = await galleryBytes(f.name);
  } catch {
    t.line('|12The file is not on line right now. Try again later.');
    return;
  }
  t.line('|07Starting transfer. Your viewer shows it as it comes in. |08(Esc aborts, Space skips ahead)');
  await t.drain(); // the words above, before the screen turns to the picture
  await sleep(900);
  t.print(''); // a dropped call ends it here
  const [sw, sh] = modeFor(f.width, f.height);
  const scr = h.pictureMode(sw, sh);
  slowWait(bytes.length / cps('file'));
  let got = 0;
  let aborted = false;
  let last = performance.now();
  try {
    for (;;) {
      // someone picked up the phone: the noise lands in the picture, then the call is gone
      if (t.dropping) await lineNoise(scr, got / bytes.length);
      t.print(''); // a dropped call ends the transfer
      const now = performance.now();
      // at the line speed of the moment (Unlimited: all at once)
      got = Number.isFinite(cps('file')) ? Math.min(bytes.length, got + ((now - last) / 1000) * cps('file')) : bytes.length;
      last = now;
      const pic = decodePicture(bytes.subarray(0, Math.floor(got)));
      if (pic) paintPicture(scr, pic);
      // until the first of the picture arrives the palette is all black: one white to write in
      else scr.dac.set([63, 63, 63], 15 * 3);
      // how far along, on the bottom line, as a terminal's status line showed it
      caption(scr, progressLine(got, bytes.length));
      scr.invalidate();
      modemSignal('receive');
      const k = scr.poll();
      if (k === 'Escape') {
        aborted = true;
        break;
      }
      if (k === ' ') got = bytes.length; // skip to the end (painted on the next round)
      if (got >= bytes.length && k !== ' ') break;
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
  t.line(`|15${f.name.padEnd(12)} |10${bar} |14${commas(Math.floor(got)).padStart(9)} |07bytes  ${cpsText()}`);
  if (aborted) {
    t.line('|12Transfer aborted.');
    return;
  }
  t.line(`|10Transfer complete. |07${f.name} saved in C:\\IMAGES.`);
  h.downloads.setDir('IMAGES', true); // made with the first picture
  h.downloads.add(f.name);
  if (!f.board) updateAccount((a) => recordDownload(a, bytes.length, true)); // the SysOp's snapshots: FREE (The Sofa keeps no ratio)
  t.line(`|07After you log off, type |15VPIC \\IMAGES\\${f.name}|07 to look at it again.`);
  t.line();
}
