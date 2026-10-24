// Calling a TTY from TERMINAL. In its normal data mode the modem dials, a TTY answers in
// silence and types its greeting in Baudot, and the modem, listening for an answer tone that
// never comes, gives up with NO CARRIER. In TDD mode (as a TTY modem had) the call goes
// through: a typed, half-duplex conversation at Baudot's 45.45 baud, about 6 characters a
// second (baudot.ts), with Mrs. Novak next door (ttyTalk.ts). The modem's "Unlimited" speed,
// or the slow-line hint's trip through time, gets the waiting text there at once.
import type { RetroHost } from '../host';
import { attr, COLS, ROWS } from '../text/textScreen';
import { DTMF, keypadDigits, Line } from './modem';
import { encodeBaudot, baudotSeconds, LEAD_SECONDS, CHAR_SECONDS, playBaudot, ttyText } from './baudot';
import { endsTurn, GREETING, newTalk, reply } from './ttyTalk';
import { TTY_INFO } from './ttyInfo';
import { modemSignal, phoneLine, sleep, statusLine, type Term } from './term';
import { baudotCall, lineSpeed, newCall, slowWait } from './lineSpeed';

type Host = Pick<RetroHost, 'screen' | 'keys' | 'audio'>;

let tdd = false;

/** TERMINAL's modem mode: DATA (a BBS) or TDD (a TTY: Baudot). */
export const tddMode = () => tdd;
export const toggleTddMode = () => (tdd = !tdd);

/** The status bar while a TTY call is up. */
const ttyStatus = (state: string) => ` TERMINAL 2.1 │ COM2 │ TDD 45.45 BAUDOT │ ${state}`;

/** The TTY / TDD help page; returns once a key is pressed. */
export async function ttyInfoPage(t: Term, h: Host): Promise<void> {
  h.screen.clear(attr(7, 0));
  TTY_INFO.forEach((l, i) => t.line(i ? `|07${l}` : `|15${l}`));
  t.print('|08Press a key… ');
  await t.key();
}

/** Seconds from the start of the text until character `i` has arrived. */
function arrivals(text: string): number[] {
  const at: number[] = [];
  for (let i = 0; i < text.length; i++) at.push(LEAD_SECONDS + encodeBaudot(text.slice(0, i + 1)).length * CHAR_SECONDS);
  return at;
}

/** `text` broken at spaces to fit the screen (same length: a space becomes a new line). */
function wrapped(text: string, width = COLS - 2): string {
  const out = [...text];
  let col = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i] === ' ') {
      const next = text.indexOf(' ', i + 1);
      const word = (next < 0 ? text.length : next) - i - 1;
      if (col + 1 + word > width) {
        out[i] = '\n';
        col = 0;
        continue;
      }
    }
    col++;
  }
  return out.join('');
}

/** The line: Baudot on it at the TTY's own pace, until it is all there (or a trip through time). */
class TtyLine {
  private line?: Line;
  private stopTones?: () => void;
  private warped = false;
  private onWarp = () => {
    this.warped = true;
    this.stopTones?.();
  };

  constructor(h: Host) {
    const ctx = h.audio();
    if (ctx) this.line = new Line(ctx);
    addEventListener('gm-line-warp', this.onWarp);
  }

  close(): void {
    this.stopTones?.();
    removeEventListener('gm-line-warp', this.onWarp);
    baudotCall(false);
  }

  /** Plays `text` as tones and calls `show(i)` as each character arrives. */
  async send(text: string, show: (i: number) => void, level: number): Promise<void> {
    const codes = encodeBaudot(text);
    const unlimited = lineSpeed() === 'unlimited';
    this.warped = false;
    if (this.line) {
      const ctx = this.line.ctx;
      // at today's speed only the first moment of it is heard
      this.stopTones = playBaudot(this.line, unlimited ? codes.slice(0, 6) : codes, ctx.currentTime + 0.03, level);
    }
    const at = arrivals(text);
    if (!unlimited) slowWait(baudotSeconds(codes));
    const start = performance.now();
    for (let i = 0; i < text.length; i++) {
      if (!unlimited && !this.warped) await sleep(Math.max(0, start + at[i] * 1000 - performance.now()));
      show(i);
      if (i % 3 === 0) modemSignal(level > 0.08 ? 'receive' : 'send');
    }
    if (unlimited || this.warped) this.stopTones?.();
    else await sleep(Math.max(0, start + baudotSeconds(codes) * 1000 - performance.now()));
  }
}

/** Dial tone, the number, and the ring (the screen follows along); returns at the answer. */
async function dialAndRing(t: Term, h: Host, number: string): Promise<void> {
  const ctx = h.audio();
  const digits = keypadDigits(number);
  if (ctx) {
    const line = new Line(ctx);
    const t0 = ctx.currentTime + 0.05;
    line.tones([350, 440], t0, 1.0, 0.1);
    digits.split('').forEach((d, i) => line.tones(DTMF[d], t0 + 1.1 + i * 0.17, 0.1, 0.12));
    line.tones([440, 480], t0 + 2 + digits.length * 0.17, 2.0, 0.07);
  }
  await sleep((2 + digits.length * 0.17) * 1000);
  t.line('RINGING');
  await sleep(3300);
}

/** The modem's own words before the call: the reset and the dial command. */
async function modemSetup(t: Term, number: string): Promise<boolean> {
  t.line(`|15TERMINAL 2.1  |07Modem on COM2 ready.${tdd ? '  |14TDD mode (Baudot 45.45)' : ''}`);
  t.line();
  modemSignal('ready');
  await t.typeSlowly('ATZ');
  t.line();
  await sleep(300);
  t.line('OK');
  await t.typeSlowly(`ATDT${number}`);
  t.line();
  modemSignal('offhook');
  if (!phoneLine.offHook) return true;
  await sleep(2500);
  t.line('|12NO DIALTONE');
  t.line('|07Someone is on the phone. Hang it up and try again.');
  modemSignal('hangup');
  t.print('|07Press a key… ');
  await t.key();
  return false;
}

/** Calls the TTY at `number`, in the modem's current mode. */
export async function ttyCall(t: Term, h: Host, number: string): Promise<void> {
  const s = h.screen;
  s.clear(attr(7, 0));
  t.status(statusLine('Offline'));
  const tty = new TtyLine(h);
  const her = (text: string) => {
    const shown = wrapped(text);
    return tty.send(text, (i) => t.print(`|14${shown[i]}`), 0.1);
  };
  try {
    if (!(await modemSetup(t, number))) return;
    await dialAndRing(t, h, number);
    if (!tdd) {
      // a TTY answers in silence, then types: the modem hears no answer tone and gives up
      await sleep(1200);
      await tty.send(GREETING, () => undefined, 0.1);
      await sleep(3500);
      await tty.send('HELLO Q GA', () => undefined, 0.1);
      await sleep(3000);
      t.line('|12NO CARRIER');
      modemSignal('hangup');
      t.line();
      t.line("|07(A TTY answered in Baudot, which a data modem can't speak. |15M|07: TDD mode.)");
      t.print('|07Press a key… ');
      await t.key();
      return;
    }
    newCall();
    baudotCall(true);
    t.status(ttyStatus('Online'));
    t.line('|08(No answer tone: a TTY answers in silence. Listening for Baudot…)');
    await sleep(1200);
    t.line('|08Hers: yellow. Yours: white. End a turn with |15GA|08, bye with |15SK|08. |15Esc|08: hang up.');
    t.line();
    await her(GREETING);
    t.line();
    const talk = newTalk();
    let turn = '';
    let hinted = false;
    for (;;) {
      h.keys.clear(); // one side types at a time: keys pressed while she typed are gone
      const typed = await typeLine(h);
      if (typed === undefined) break;
      const sent = typed.trim();
      // it goes out a letter at a time (a space after it, as a TTY's return key sends): gray turns white
      if (sent) await tty.send(`${sent} `, (i) => i < sent.length && s.put(i, s.cursorY, sent.charCodeAt(i), attr(15, 0)), 0.05);
      t.line();
      turn += ` ${sent}`;
      if (!endsTurn(turn)) {
        if (!hinted) t.line('|08(She waits for GA, so she knows your turn is over.)');
        hinted = true;
        continue;
      }
      const r = reply(talk, turn);
      turn = '';
      await sleep(900); // she reads it, then starts typing
      await her(r.text);
      t.line();
      if (r.end) {
        await sleep(1500);
        t.line('|08(She hung up. TERMINAL hangs up the line.)');
        break;
      }
    }
  } finally {
    tty.close();
    modemSignal('hangup');
  }
  t.status(statusLine('Offline'));
  await sleep(1200);
}

/** TDD mode calling a BBS: a data modem answers with its tones, and Baudot can't meet them. */
export async function bbsInTdd(t: Term, h: Host, number: string): Promise<void> {
  h.screen.clear(attr(7, 0));
  t.status(statusLine('Offline'));
  try {
    if (!(await modemSetup(t, number))) return;
    await dialAndRing(t, h, number);
    const ctx = h.audio();
    if (ctx) new Line(ctx).answerTone(ctx.currentTime + 0.05, 3.5, false);
    await sleep(5000);
    t.line('|12NO CARRIER');
    t.line();
    t.line('|07(A data modem answered: it needs DATA mode. |15M|07 switches back.)');
  } finally {
    modemSignal('hangup');
  }
  t.print('|07Press a key… ');
  await t.key();
}

/**
 * Your line, typed in gray (capitals only, as a TTY has): Enter sends it, Backspace takes
 * a letter back, Esc hangs up (undefined).
 */
async function typeLine(h: Host): Promise<string | undefined> {
  const s = h.screen;
  const y = s.cursorY;
  let text = '';
  const draw = () => {
    s.fill(0, y, COLS - 1, y, attr(7, 0));
    s.write(0, y, attr(8, 0), text);
    s.cursorX = text.length;
    s.cursorY = Math.min(y, ROWS - 2);
  };
  draw();
  for (;;) {
    const k = await h.keys.next();
    if (k.key === 'Escape') return undefined;
    if (k.key === 'Enter') return text;
    if (k.key === 'Backspace') text = text.slice(0, -1);
    else if (k.key.length === 1 && text.length < COLS - 2) {
      const c = k.key.toUpperCase();
      if (ttyText(c) === c) text += c;
    }
    draw();
  }
}
