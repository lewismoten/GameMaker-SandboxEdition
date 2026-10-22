// GMCRACK's look (the logo, the bars and the scroller) and the intro a cracked game shows
// before it starts. Kept apart from gmcrack.ts so running a cracked game loads only this,
// not GMCRACK's registration tools.
import type { RetroHost } from '../host';
import { attr, COLS, ROWS } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { bigText, bigTextWidth, centered, fadeBar } from '../bbs/ansiArt';
import { GROUP, SCROLLER, VERSION } from './gmcrackText';

export const TOP = 10; // first row under the logo
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The logo, the bars and a scroller along the bottom; returns a function that stops the scroller. */
export function frame(h: RetroHost): () => void {
  const s = h.screen;
  s.resetPalette();
  s.clear(attr(7, 0));
  s.cursorVisible = false;
  fadeBar(s, 0, 6);
  bigText(s, Math.floor((COLS - bigTextWidth('GMCRACK')) / 2), 1, 'GMCRACK', [15, 14, 14, 6, 6]);
  centered(s, 7, `|08-=|07*|08=- |14${GROUP} |07presents |15GMCRACK v${VERSION} |07for |11Game-Maker SE 3.00 |08-=|07*|08=-`);
  fadeBar(s, 8, 6);
  fadeBar(s, ROWS - 3, 4);
  let at = 0;
  const colors = [14, 14, 15, 14, 6];
  const tick = () => {
    const text = SCROLLER.repeat(2);
    for (let x = 0; x < COLS; x++) {
      const ch = text[(at + x) % SCROLLER.length];
      s.put(x, ROWS - 2, toCp437(ch).charCodeAt(0), attr(colors[Math.floor((x + at) / 4) % colors.length], 0));
    }
    at = (at + 1) % SCROLLER.length;
  };
  tick();
  const timer = setInterval(tick, 110);
  return () => clearInterval(timer);
}

export function clearArea(h: RetroHost): void {
  h.screen.fill(0, TOP - 1, COLS - 1, ROWS - 4, attr(7, 0));
}

export function hint(h: RetroHost, text: string): void {
  h.screen.fill(0, ROWS - 1, COLS - 1, ROWS - 1, attr(0, 6));
  h.screen.write(1, ROWS - 1, attr(0, 6), toCp437(text).slice(0, COLS - 2));
}

/** A key, or undefined after `ms`; leaves no wait behind to swallow a later key. */
async function keyWithin(h: RetroHost, ms: number): Promise<void> {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(50)) if (h.keys.poll()) return;
}

/** A cracked game's intro before it starts: who cracked it, the greetings, and a reminder to pay. */
export async function cracktro(h: RetroHost, title: string, exe: string): Promise<void> {
  const s = h.screen;
  const stop = frame(h);
  try {
    clearArea(h);
    centered(s, TOP + 1, `|15${toCp437(title).slice(0, 60)}`);
    centered(s, TOP + 3, `|07${exe.toUpperCase()} cracked by |14${GROUP}|07 with GMCRACK v${VERSION}`);
    centered(s, TOP + 5, '|11Cracked for fun on this desk PC. The author still needs you:');
    centered(s, TOP + 6, '|15REGISTER the shareware you enjoy!');
    centered(s, TOP + 8, '|08(GMCRACK [5] puts the original back)');
    hint(h, 'Press any key to play');
    await keyWithin(h, 8000);
  } finally {
    stop();
  }
  s.resetPalette();
  s.clear();
}
