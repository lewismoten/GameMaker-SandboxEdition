// PKUNZIP on this PC after a download: "Inflating:" each file in the ZIP with its percent
// counting up, each taking as long as its size needs at this PC's speed (TURBO or not), so a
// big file takes a while and a tiny one flashes past. Its words show at once: it runs here,
// not over the modem.
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { sleep, type Term } from './term';

/** Bytes per second PKUNZIP inflates and writes to the hard disk. */
const UNZIP_RATE = { turbo: 420_000, slow: 32_000 };

/** FILE_ID.DIZ's size, for the ZIPs that carry one. */
export const DIZ_BYTES = 450;

/** Unzips `zip` into C:\DOWNLOAD\`dir`: `files` are each one's name and unpacked size in bytes. */
export async function pkunzip(t: Term, h: RetroHost, zip: string, dir: string, files: readonly (readonly [name: string, size: number])[]): Promise<void> {
  const s = h.screen;
  t.local(`|07C:\\>PKUNZIP -d ${zip} C:\\DOWNLOAD\\${dir}\n`);
  t.local(`|07Searching ZIP: ${zip}\n`);
  const width = Math.max(13, ...files.map(([name]) => name.length + 1));
  for (const [name, size] of files) {
    t.local(`|07  Inflating: ${name.padEnd(width)}`);
    const x = s.cursorX;
    // the speed is read per file: TURBO pressed mid-unzip speeds up the rest
    const ms = (size / (h.turbo() ? UNZIP_RATE.turbo : UNZIP_RATE.slow)) * 1000;
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
