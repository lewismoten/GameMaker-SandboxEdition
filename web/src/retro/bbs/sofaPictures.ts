// The Sofa's GIF area: Doc Leo's pictures, 640x480 interlaced GIFs of THE CHEZ (his tomato
// red 1976 1/2 CitiCar) and The Bard of Bizarre's logo (made with DeepAI). A download paints
// in as the bytes arrive, the interlace's four passes coarse to fine (gifArea.ts), and lands
// in C:\IMAGES beside the Sandbox BBS's pictures. Free to everyone, like the rest of The Sofa.
import type { RetroHost } from '../host';
import { commas } from '../dos/vfs';
import { attr } from '../text/textScreen';
import { readLine } from '../text/textInput';
import { downloadLine } from '../../project/diskFacts';
import { pictureDiz, wrapWords } from './fileId';
import { formatLabel, SOFA_GIFS, type GalleryFile } from './gallery';
import { downloadGif } from './gifArea';
import { Pager, pageLabel, readNumber } from './pager';
import type { Term } from './term';

/** A picture's lines in the listing: name, size, picture and colors, then what it is. */
export function pictureEntry(f: GalleryFile, i: number, got: boolean): string[] {
  const desc = wrapWords(f.desc, 52);
  return [
    `|14${String(i + 1).padStart(2)} ${got ? '|10*' : ' '}|15${f.name.padEnd(12)}|14${commas(f.bytes).padStart(9)} |03${`${f.width}x${f.height}`} |13${formatLabel(f)}, interlaced`,
    ...desc.map((l) => `${' '.repeat(26)}|07${l}`),
  ];
}

export async function sofaPictures(t: Term, h: RetroHost): Promise<void> {
  const pager = new Pager(t, {
    header: (p, n) => [
      '|13          ──────────────── |15The Sofa |13─ |15GIF Pictures |13────────────────',
      `|07  640x480 interlaced GIFs: they fill in as they arrive.${n > 1 ? `|08   ${pageLabel(p, n)}` : ''}`,
      '',
    ],
    entries: () => SOFA_GIFS.map((f, i) => pictureEntry(f, i, h.downloads.has(f.name))),
    footer: ['', '|10*|07 = already in C:\\IMAGES'],
  });
  pager.show();
  for (;;) {
    t.print(`|11V# to view, D# to download, ${pager.keys()}|11X to exit: |15`);
    const answer = ((await readLine(h.screen, h.keys, [], 6, attr(15, 0))) ?? 'X').trim().toUpperCase();
    t.line();
    if (pager.turn(answer)) continue;
    if (!answer || answer === 'X' || answer === 'Q') return;
    const dl = answer.startsWith('D');
    const f = SOFA_GIFS[(dl ? Number(answer.slice(1)) : readNumber(answer)) - 1];
    if (!f) {
      t.line('|12No such file.');
      continue;
    }
    if (dl) await downloadGif(t, h, f);
    else {
      t.line(`|14${f.name}`);
      t.line(`|07  |14${commas(f.bytes)}|07 bytes: |14${downloadLine(f.bytes, '|07, |14')}|07.`);
      for (const l of pictureDiz(f)) t.line(`|07  ${l}`);
      t.line();
    }
  }
}
