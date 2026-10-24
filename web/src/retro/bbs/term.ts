// The terminal program's screen: BBS pipe color codes (|XX = color XX), a status bar
// on the bottom line, ANSI-style boxes, and dialing a number with the modem. Once a call is
// up, what the board sends arrives at the line speed (lineSpeed.ts) through a queue
// (pacedQueue.ts): every print, clear and ANSI picture waits its turn, and a key is read
// only once the screen has caught up, so nothing draws out of order.
import type { RetroHost } from '../host';
import { attr, COLS, ROWS, type TextScreen } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { busySounds, dialSounds } from './modem';
import { key as typed } from '../text/textInput';
import { PacedQueue, type Unit } from './pacedQueue';
import { connectLine, cps, newCall, slowWait, statusBps } from './lineSpeed';

/** What the modem's front lights show; the desk's modem listens for these (desk/pc/modem.ts). */
export type ModemSignal = 'ready' | 'offhook' | 'carrier' | 'receive' | 'send' | 'hangup' | 'off';

export function modemSignal(signal: ModemSignal): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<ModemSignal>('gm-modem', { detail: signal }));
}

/** The house's phone line, shared with the wall phone on the desk (desk/room/phone). */
export const phoneLine = { offHook: false };

/** Thrown into a board's code once the call has dropped, to stop it where it is. */
export class NoCarrier extends Error {}

/** The terminal with a call up, if any. */
let online: Term | undefined;

/**
 * Someone picked up the phone in the middle of a call: line noise fills the screen and the
 * modems lose each other. False if no call was up.
 */
export function lineInterrupted(): boolean {
  return online?.interrupt() ?? false;
}

/** Characters an ANSI escape (a color change, a clear) takes on the line: ESC[1;33m is 7, V.42bis squeezes repeats. */
const ESC_COST = 4;

type Host = Pick<RetroHost, 'screen' | 'keys' | 'audio'>;

export class Term {
  private fg = 7;
  /** Set once the line drops: the board's code stops at its next print or key. */
  private lost?: Promise<void>;
  /** A call is up: what the board sends comes at the line speed. */
  private live = false;
  /** What is still on its way down the line. */
  private line$ = new PacedQueue(
    () => cps('text'),
    () => this.h.keys.stopping,
    () => modemSignal('receive'),
  );
  constructor(private h: Host) {}

  /** A call is up (or not): lineInterrupted() can drop it, and the text is paced. */
  set connected(on: boolean) {
    online = on ? this : online === this ? undefined : online;
    if (!on) this.lost = undefined;
    if (on && !this.live) newCall();
    this.live = on;
    if (typeof window !== 'undefined') {
      removeEventListener('gm-line-speed', this.onSpeed);
      if (on) addEventListener('gm-line-speed', this.onSpeed);
    }
    if (on) this.h.keys.gate = () => (this.line$.idle ? undefined : this.line$.drain());
    else {
      this.line$.flush();
      this.h.keys.gate = undefined;
    }
  }

  /** The board is done: the rest of its text arrives, then the modem hangs up. */
  async hangUp(): Promise<void> {
    await this.line$.drain();
    this.connected = false;
  }

  /** The terminal is closing: nothing more is drawn. */
  close(): void {
    this.line$.drop();
    this.connected = false;
  }

  /** Resolves once everything sent so far is on the screen. */
  drain(): Promise<void> {
    return this.line$.drain();
  }

  /** Seconds until the screen catches up. */
  get backlog(): number {
    return this.line$.idle ? 0 : this.line$.seconds;
  }

  /** True when what is sent now goes through the queue (a call at a set speed, or a queue still emptying). */
  private get pacing(): boolean {
    return (this.live && Number.isFinite(cps('text'))) || !this.line$.idle;
  }

  /** Queues work for the screen (now, if nothing is waiting and the line is unlimited). */
  private send(units: Unit[]): void {
    if (!this.pacing) {
      for (const u of units) u.run();
      return;
    }
    if (!Number.isFinite(cps('text'))) {
      // unlimited now: whatever was waiting arrives at once, then this
      this.line$.flush();
      for (const u of units) u.run();
      return;
    }
    this.line$.push(units);
    slowWait(this.line$.seconds);
  }

  /** Runs `fn` on the screen in its turn (a clear, a cursor move). */
  op(fn: (s: TextScreen) => void, cost = ESC_COST): void {
    this.send([{ cost, run: () => fn(this.h.screen) }]);
  }

  /** Clears the screen above the status bar and homes the cursor. */
  clear(): void {
    this.op((s) => {
      s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
      s.cursorX = 0;
      s.cursorY = 0;
    });
  }

  /** Erases the cursor's line and goes to its start (to write over a prompt). */
  eraseLine(): void {
    this.op((s) => {
      s.fill(0, s.cursorY, COLS - 1, s.cursorY, attr(7, 0));
      s.cursorX = 0;
    });
  }

  /**
   * An ANSI picture painted by `paint` (which may move the cursor too). Paced, it arrives
   * cell by cell, top to bottom, as the art's characters did: only the cells it changes
   * count, and each change of color costs an escape.
   */
  art(paint: (s: TextScreen) => void): void {
    const s = this.h.screen;
    if (!this.pacing) {
      paint(s);
      return;
    }
    this.op(() => {
      const chars = s.chars.slice();
      const attrs = s.attrs.slice();
      const [cx, cy] = [s.cursorX, s.cursorY];
      paint(s);
      const [ex, ey] = [s.cursorX, s.cursorY];
      const units: Unit[] = [];
      let prev = -1;
      for (let i = 0; i < chars.length; i++) {
        const ch = s.chars[i];
        const a = s.attrs[i];
        if (ch === chars[i] && a === attrs[i]) continue;
        const cost = a === prev ? 1 : 1 + ESC_COST;
        prev = a;
        units.push({ cost, run: () => s.put(i % COLS, Math.floor(i / COLS), ch, a) });
      }
      // back as it was, to arrive in turn
      s.chars.set(chars);
      s.attrs.set(attrs);
      s.cursorX = cx;
      s.cursorY = cy;
      s.markDirty();
      units.push({
        cost: 0,
        run: () => {
          s.cursorX = ex;
          s.cursorY = ey;
        },
      });
      this.line$.pushFront(units);
      slowWait(this.line$.seconds);
    }, 0);
  }

  /**
   * Text from the terminal program itself (its transfer progress, PKUNZIP): not sent over
   * the line, so it shows at once, after what the board sent.
   */
  local(text: string): void {
    this.line$.flush();
    this.write(text);
  }

  /** Garbage on the screen for a couple of seconds, then the call is gone. */
  interrupt(): boolean {
    if (online !== this || this.lost) return false;
    this.line$.drop(); // what was on its way never arrives
    this.lost = (async () => {
      const junk =
        // only characters the terminal's font draws (ASCII and CP437's graphics), as on a real screen
        '}{~`^@#$%&*+=<>/\\[]_;:!?\'"░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼►◄↕↑↓→←▲▼';
      for (let i = 0; i < 40; i++) {
        let line = '';
        for (let n = 2 + Math.floor(Math.random() * 9); n > 0; n--) line += junk[Math.floor(Math.random() * junk.length)];
        this.write(`|${String(8 + Math.floor(Math.random() * 8)).padStart(2, '0')}${line}`);
        modemSignal('receive');
        await sleep(60);
      }
      // wake a board waiting for a key (Enter ends a line being typed, too), so it runs
      // into the dropped line
      this.h.keys.push(typed('Enter'));
    })();
    return true;
  }

  /** Waits out the line noise after a dropped call. */
  async dropped(): Promise<void> {
    await this.lost;
    this.h.keys.clear();
    this.lost = undefined;
  }

  get screenRef(): RetroHost['screen'] {
    return this.h.screen;
  }

  /** Prints with |XX color codes, keeping the bottom status line. */
  print(text: string): void {
    if (this.lost) throw new NoCarrier();
    if (!this.pacing) this.write(text);
    else this.send(this.units(text));
  }

  /** Text as screen jobs: a color change costs an escape, a new line CR and LF. */
  private units(text: string): Unit[] {
    const out: Unit[] = [];
    toCp437(text)
      .split(/\|(\d\d)/)
      .forEach((p, i) => {
        if (i % 2) {
          const fg = Number(p) & 15;
          out.push({ cost: ESC_COST, run: () => (this.fg = fg) });
        } else for (const ch of p) out.push(ch === '\n' ? { cost: 2, run: () => this.newline() } : { cost: 1, run: () => this.putChar(ch) });
      });
    return out;
  }

  private write(text: string): void {
    if (text.length > 1) modemSignal('receive');
    const parts = toCp437(text).split(/\|(\d\d)/);
    parts.forEach((p, i) => {
      if (i % 2) this.fg = Number(p) & 15;
      else
        for (const ch of p)
          if (ch === '\n') this.newline();
          else this.putChar(ch);
    });
  }

  private putChar(ch: string): void {
    const s = this.h.screen;
    // Like a real terminal, wrap only when the next character arrives.
    if (s.cursorX >= COLS) this.newline();
    s.put(s.cursorX, s.cursorY, ch.charCodeAt(0), attr(this.fg, 0));
    s.cursorX++;
  }

  line(text = ''): void {
    this.print(text + '\n');
  }

  private newline(): void {
    const s = this.h.screen;
    s.cursorX = 0;
    s.cursorY++;
    if (s.cursorY >= ROWS - 1) {
      // Scroll rows 0..23, leaving the status bar alone.
      s.chars.copyWithin(0, COLS, (ROWS - 1) * COLS);
      s.attrs.copyWithin(0, COLS, (ROWS - 1) * COLS);
      s.fill(0, ROWS - 2, COLS - 1, ROWS - 2, attr(7, 0));
      s.cursorY = ROWS - 2;
    }
  }

  /** The status bar's words, to show a new line speed in. */
  private statusText = '';

  /** The speed changed (on the modem, or the DOS page's menu): the status bar says so. */
  private onSpeed = () => {
    if (this.statusText) this.status(this.statusText.replace(/│ \d+ N81 │/, `│ ${statusBps()} N81 │`));
  };

  status(text: string): void {
    this.statusText = text;
    this.h.screen.write(0, ROWS - 1, attr(0, 3), toCp437(text).padEnd(COLS).slice(0, COLS));
  }

  async key(): Promise<string> {
    const k = await this.h.keys.next();
    if (this.lost) throw new NoCarrier();
    modemSignal('send');
    return k.key.length === 1 ? k.key.toUpperCase() : k.key;
  }

  async more(): Promise<boolean> {
    this.print('|15[|11More|15] |07Press a key, Q to stop');
    const k = await this.key();
    // Erase the prompt line and write over it.
    this.eraseLine();
    return k !== 'Q' && k !== 'Escape';
  }

  async typeSlowly(text: string, ms = 35): Promise<void> {
    for (const ch of text) {
      this.print(ch);
      await sleep(ms);
    }
  }
}

/** Visible width of text with |XX color codes. */
export const width = (text: string) => text.replace(/\|\d\d/g, '').length;

/** ╔═══╡ Title ╞═══╗ across the screen, in a frame color (pipe code digits). */
export function boxTop(title: string, frame = '06', text = '14'): string {
  const left = Math.floor((COLS - 2 - title.length - 4) / 2);
  const right = COLS - 2 - title.length - 4 - left;
  return `|${frame}╔${'═'.repeat(left)}╡ |${text}${title} |${frame}╞${'═'.repeat(right)}╗`;
}

export const boxBottom = (frame = '06') => `|${frame}╚${'═'.repeat(COLS - 2)}╝`;
export const boxRule = (frame = '06') => `|${frame}╟${'─'.repeat(COLS - 2)}╢`;

/** ║ text padded to the box width ║ */
export function boxRow(text: string, frame = '06'): string {
  return `|${frame}║${text}${' '.repeat(Math.max(0, COLS - 2 - width(text)))}|${frame}║`;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const statusLine = (online: string) => ` TERMINAL 2.1 │ COM2 │ ${statusBps()} N81 │ ANSI │ ${online}`;

/** Dials, waits through the handshake, and prints what the modem says. */
export async function dial(t: Term, h: Host, number: string, busy = false): Promise<'connect' | 'busy' | 'no-dialtone'> {
  t.line('|15TERMINAL 2.1  |07Modem on COM2 ready.');
  t.line();
  modemSignal('ready');
  await t.typeSlowly('ATZ');
  t.line();
  await sleep(300);
  t.line('OK');
  await t.typeSlowly('ATM1L2X4');
  t.line();
  await sleep(200);
  t.line('OK');
  await t.typeSlowly(`ATDT${number}`);
  t.line();
  modemSignal('offhook');
  if (phoneLine.offHook) {
    // someone's on the phone: the modem hears them, not a dial tone
    await sleep(2500);
    t.line('|12NO DIALTONE');
    modemSignal('hangup');
    return 'no-dialtone';
  }
  if (busy) {
    await sleep(busySounds(h.audio(), number) * 1000);
    t.line('|12BUSY');
    modemSignal('hangup');
    return 'busy';
  }
  const call = dialSounds(h.audio(), number);
  const start = performance.now();
  const until = (sec: number) => sleep(Math.max(0, start + sec * 1000 - performance.now()));
  for (const r of call.rings) {
    await until(r);
    t.line('RINGING');
  }
  await until(call.answer);
  t.line('|08(carrier detected, negotiating...)');
  await until(call.connect);
  t.line(`|14${connectLine()}`);
  modemSignal('carrier');
  return 'connect';
}
