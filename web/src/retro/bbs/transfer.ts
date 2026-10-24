// A Zmodem transfer's progress line, the terminal program's own (so it shows at once, not
// down the line): the bar fills at the line speed of the moment (lineSpeed.ts), so picking a
// faster modem speed mid-transfer speeds it up there and then. Esc aborts, Space skips ahead.
import type { RetroHost } from '../host';
import { toCp437 } from '../text/cp437';
import { commas } from '../dos/vfs';
import { modemSignal, sleep, type Term } from './term';
import { cps, slowWait, speedWords } from './lineSpeed';

/** "about 3 min 20 s at 2,400 baud", or "no wait at all" when unlimited. */
export function expectText(bytes: number, share = 1): string {
  const sec = bytes / (cps('file') * share);
  if (!Number.isFinite(sec) || sec === 0) return 'no wait at all (Unlimited)';
  return `about ${timeText(sec)} at ${speedWords()}`;
}

/** "45 s", "3 min 20 s", "1 hr 4 min". */
export function timeText(sec: number): string {
  const s = Math.max(1, Math.round(sec));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${s % 60 ? ` ${s % 60} s` : ''}`;
  return `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`;
}

/** The rate for a progress line: "1650 cps" (or "no wait" when unlimited); `share`: how much of the line the protocol gets. */
export const cpsText = (share = 1) => (Number.isFinite(cps('file')) ? `${Math.round(cps('file') * share)} cps` : 'no wait');

export interface Progress {
  /** Where it stops short, as a fraction of the file (an upload the phone cuts off). */
  stopAt?: number;
  /** Ctrl-X aborts too (uploads). */
  ctrlX?: boolean;
  send?: boolean;
  /** How much of the line the protocol gets (Xmodem's waits for ACKs), 1 by default. */
  share?: number;
}

/**
 * Moves `size` bytes of `name` at the line speed, drawing the bar on the cursor's line.
 * Returns the bytes moved and whether Esc aborted it.
 */
export async function progress(
  t: Term,
  h: Pick<RetroHost, 'screen' | 'keys'>,
  name: string,
  size: number,
  opts: Progress = {},
): Promise<{ bytes: number; aborted: boolean }> {
  await t.drain();
  const s = h.screen;
  const row = s.cursorY;
  const share = opts.share ?? 1;
  const rate = () => cps('file') * share;
  slowWait(size / rate());
  let got = 0;
  let last = performance.now();
  const draw = () => {
    const f = size ? got / size : 1;
    const bar = '█'.repeat(Math.round(f * 30)).padEnd(30, '░');
    s.cursorY = row;
    s.cursorX = 0;
    t.local(`|15${name.padEnd(12)} |10${toCp437(bar)} |14${commas(Math.round(got)).padStart(9)} |07bytes  ${cpsText(share).padEnd(8)}`);
  };
  for (;;) {
    const k = h.keys.poll();
    if (k?.key === 'Escape' || (opts.ctrlX && k?.ctrl && k.key.toUpperCase() === 'X')) return { bytes: Math.round(got), aborted: true };
    t.print(''); // a dropped call ends the transfer
    const now = performance.now();
    const end = size * (opts.stopAt ?? 1);
    // Space (or an unlimited line) gets to the end at once
    got = k?.key === ' ' || !Number.isFinite(rate()) ? end : Math.min(end, got + ((now - last) / 1000) * rate());
    last = now;
    draw();
    modemSignal(opts.send ? 'send' : 'receive');
    if (got >= end) return { bytes: Math.round(got), aborted: false };
    await sleep(120);
  }
}
