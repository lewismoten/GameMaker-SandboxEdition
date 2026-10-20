// TERMINAL.EXE: dials a (fictional) 1994 BBS where the CD's shareware games can be read
// about and "downloaded" into C:\DOWNLOAD. Colors use BBS pipe codes: |XX = color XX.
import type { RetroHost } from './host';
import { attr, COLS, ROWS } from './textScreen';
import { readLine } from './textInput';
import { toCp437 } from './cp437';
import { commas } from './vfs';
import type { CatalogEntry } from '../project/files';

const BBS_NAME = 'THE GAME-MAKER EXCHANGE';
const PHONE = '555-0144';
const CPS = 1650; // 14,400 bps with V.42bis, in characters per second
const TIME_COMPRESSION = 25; // nobody wants to wait ten minutes

class Term {
  private fg = 7;
  constructor(private h: RetroHost) {}

  /** Prints with |XX color codes, keeping the bottom status line. */
  print(text: string): void {
    const s = this.h.screen;
    const parts = toCp437(text).split(/\|(\d\d)/);
    parts.forEach((p, i) => {
      if (i % 2) this.fg = Number(p) & 15;
      else
        for (const ch of p) {
          if (ch === '\n') this.newline();
          else {
            s.put(s.cursorX, s.cursorY, ch.charCodeAt(0), attr(this.fg, 0));
            s.cursorX++;
            if (s.cursorX >= COLS) this.newline();
          }
        }
    });
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

  status(text: string): void {
    this.h.screen.write(0, ROWS - 1, attr(0, 3), toCp437(text).padEnd(COLS).slice(0, COLS));
  }

  async key(): Promise<string> {
    const k = await this.h.keys.next();
    return k.key.length === 1 ? k.key.toUpperCase() : k.key;
  }

  async more(): Promise<boolean> {
    this.print('|15[|11More|15] |07Press a key, Q to stop');
    const k = await this.key();
    // Erase the prompt line and write over it.
    const s = this.h.screen;
    s.fill(0, s.cursorY, COLS - 1, s.cursorY, attr(7, 0));
    s.cursorX = 0;
    return k !== 'Q' && k !== 'Escape';
  }

  async typeSlowly(text: string, ms = 35): Promise<void> {
    for (const ch of text) {
      this.print(ch);
      await sleep(ms);
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- modem sounds -----------------------------------------------------------------

const DTMF: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477], '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477], '0': [941, 1336],
};

function tone(ctx: AudioContext, freqs: number[], start: number, dur: number, gain = 0.06, type: OscillatorType = 'sine'): void {
  const g = ctx.createGain();
  g.gain.value = gain;
  g.connect(ctx.destination);
  for (const f of freqs) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.connect(g);
    o.start(start);
    o.stop(start + dur);
  }
}

function noise(ctx: AudioContext, start: number, dur: number, gain = 0.04): void {
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(start);
}

/** Dial tone, touch-tones, then the handshake screech. Returns its length in ms. */
function modemSounds(ctx: AudioContext | undefined, number: string): number {
  if (!ctx) return 2500;
  let t = ctx.currentTime + 0.05;
  tone(ctx, [350, 440], t, 0.9);
  t += 1;
  for (const d of number.replace(/\D/g, '')) {
    tone(ctx, DTMF[d], t, 0.09);
    t += 0.13;
  }
  t += 1.2;
  tone(ctx, [2100], t, 1.2, 0.05); // answer tone
  t += 1.3;
  for (let i = 0; i < 6; i++) {
    tone(ctx, [980 + (i % 2) * 200], t, 0.25, 0.04, 'square');
    noise(ctx, t + 0.25, 0.35);
    t += 0.6;
  }
  noise(ctx, t, 1.4, 0.05);
  t += 1.5;
  return (t - ctx.currentTime) * 1000;
}

// ---- the BBS ------------------------------------------------------------------------

function zipName(g: CatalogEntry): string {
  return `${(g.exe ?? g.id).replace(/\.EXE$/i, '').slice(0, 8).toUpperCase()}.ZIP`;
}

function zipSize(g: CatalogEntry): number {
  return Math.round((g.bytes ?? 0) * 0.58);
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

export async function runTerminal(h: RetroHost): Promise<void> {
  const t = new Term(h);
  const s = h.screen;
  s.resetPalette();
  s.clear(attr(7, 0));
  s.cursorVisible = true;
  t.status(` TERMINAL 2.1 │ COM2 │ 14400 N81 │ ANSI │ Offline`);
  t.line('|15TERMINAL 2.1  |07Modem on COM2 ready.');
  t.line();
  await t.typeSlowly('ATZ');
  t.line();
  t.line('OK');
  await t.typeSlowly(`ATDT${PHONE}`);
  t.line();
  const ms = modemSounds(h.audio(), PHONE);
  await sleep(ms);
  t.line('|14CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS');
  t.status(` TERMINAL 2.1 │ COM2 │ 14400 N81 │ ANSI │ Online 00:00`);
  await sleep(500);
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line('|09╔══════════════════════════════════════════════════════════════════════════╗');
  t.line(`|09║|14              ${BBS_NAME.padEnd(36)}|11Node 1 of 2       |09║`);
  t.line('|09║|07     Shareware made with Game-Maker · Help for Game-Maker designers       |09║');
  t.line('|09╚══════════════════════════════════════════════════════════════════════════╝');
  t.line();
  t.print('|11What is your name (or GUEST)? |15');
  const name = ((await readLine(s, h.keys, [], 30, attr(15, 0))) ?? 'GUEST').trim() || 'GUEST';
  t.line();
  t.line(`|07Welcome, |15${name}|07! You are caller |14#1,994|07. Time allowed today: |1460|07 minutes.`);
  t.line();

  const catalog = (await h.catalog()).filter((g) => g.kind === 'shareware' && g.gam);
  for (;;) {
    t.line('|09── |15Main Menu |09──────────────────────────────');
    t.line('|15[|14F|15] |07Files: Game-Maker shareware games');
    t.line('|15[|14B|15] |07Bulletins');
    t.line('|15[|14G|15] |07Goodbye (log off)');
    t.print('|11Command: |15');
    const k = await t.key();
    t.line(k.length === 1 ? k : '');
    t.line();
    if (k === 'F') await files(t, h, catalog);
    else if (k === 'B') await bulletins(t);
    else if (k === 'G' || k === 'Escape') {
      t.line('|07Thanks for calling! Remember to register the shareware you enjoy.');
      await sleep(900);
      t.line('|12NO CARRIER');
      t.status(` TERMINAL 2.1 │ COM2 │ 14400 N81 │ ANSI │ Offline`);
      await sleep(900);
      s.clear();
      return;
    }
  }
}

async function bulletins(t: Term): Promise<void> {
  for (const l of [
    '|14Bulletin #1: |15About shareware',
    '|07Shareware is try-before-you-buy. Play these games for free; if you',
    '|07enjoy one, send the author the registration fee listed in its',
    '|07readme. Many authors send a full version with more levels.',
    '',
    '|14Bulletin #2: |15Made with Game-Maker',
    '|07Every game in the Files area was built with Game-Maker by',
    '|07Recreational Software Designs. No programming needed!',
  ])
    t.line(l);
  t.line();
}

async function files(t: Term, h: RetroHost, catalog: CatalogEntry[]): Promise<void> {
  t.line('|09File area 1: |15Game-Maker shareware games');
  t.line('|09 #  |15File name     Size  |07Description');
  t.line('|09─── ─────────── ─────── ───────────────────────────────────────────────────');
  let lines = 3;
  for (const [i, g] of catalog.entries()) {
    const got = h.downloads.has(g.id) ? '|10*' : ' ';
    const by = g.author ?? g.company;
    const desc = wrap(`${g.title}${by ? ` by ${by}` : ''}${g.year ? ` (${g.year})` : ''}. ${g.price ? `${g.price === 'Freeware' ? 'Freeware' : `Reg. ${g.price}`}. ` : ''}${g.blurb ?? ''}`, 52);
    t.line(`|11${String(i + 1).padStart(2)} ${got}|15${zipName(g).padEnd(12)}|14${commas(zipSize(g)).padStart(8)} |07${desc[0] ?? ''}`);
    if (desc[1]) t.line(`${' '.repeat(25)}|07${desc[1]}`);
    lines += desc[1] ? 2 : 1;
    if (lines > 18 && i < catalog.length - 1) {
      if (!(await t.more())) break;
      lines = 0;
    }
  }
  t.line('|10*|07 = already downloaded to C:\\DOWNLOAD');
  for (;;) {
    t.print('|11File # to read about, D# to download, Q to quit: |15');
    const answer = ((await readLine(h.screen, h.keys, [], 6, attr(15, 0))) ?? 'Q').trim().toUpperCase();
    t.line();
    if (!answer || answer === 'Q') return;
    const dl = answer.startsWith('D');
    const n = Number(answer.replace(/^D/, ''));
    const g = catalog[n - 1];
    if (!g) {
      t.line('|12No such file.');
      continue;
    }
    if (dl) await download(t, h, g);
    else await readAbout(t, g);
  }
}

async function readAbout(t: Term, g: CatalogEntry): Promise<void> {
  t.line(`|14${zipName(g)} |15${g.title}`);
  for (const l of wrap(g.blurb ?? '', 76)) t.line(`|07${l}`);
  t.line();
  t.line('|11Author’s notice (from the archive’s readme):');
  let n = 0;
  for (const l of (g.notice ?? 'This game is shareware.').split('\n')) {
    t.line(`|07${l.slice(0, 79)}`);
    if (++n % 18 === 0 && !(await t.more())) break;
  }
  t.line();
}

async function download(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const size = zipSize(g);
  const seconds = size / CPS;
  t.line(`|07Protocol: |15Zmodem|07.  ${zipName(g)} is |14${commas(size)}|07 bytes, about |14${Math.ceil(seconds / 60)}|07 minute(s) at 14,400 bps.`);
  t.line('|07Starting transfer... (Esc to abort)');
  const s = h.screen;
  const row = s.cursorY;
  const start = performance.now();
  const total = (seconds * 1000) / TIME_COMPRESSION;
  for (;;) {
    const k = h.keys.poll();
    if (k?.key === 'Escape') {
      t.line();
      t.line('|12Transfer aborted.');
      return;
    }
    const f = Math.min(1, (performance.now() - start) / total);
    const bar = '█'.repeat(Math.round(f * 30)).padEnd(30, '░');
    s.cursorY = row;
    s.cursorX = 0;
    t.print(`|15${zipName(g).padEnd(12)} |10${toCp437(bar)} |14${commas(Math.round(size * f)).padStart(9)} |07bytes  ${CPS} cps`);
    if (f >= 1) break;
    await sleep(120);
  }
  t.line();
  t.line('|10Transfer complete.');
  t.line(`|07PKUNZIP ${zipName(g)} C:\\DOWNLOAD\\${g.id.toUpperCase()}`);
  for (const f of [...(g.exe ? [g.exe.toLowerCase()] : []), ...g.files].slice(0, 12)) {
    t.line(`|08  Inflating: ${f.toUpperCase()}`);
    await sleep(40);
  }
  if (g.files.length > 12) t.line(`|08  ...and ${g.files.length - 11} more`);
  h.downloads.add(g.id);
  t.line(`|07Type |15CD \\DOWNLOAD\\${g.id.toUpperCase()}|07 then |15${(g.exe ?? '').replace(/\.EXE$/i, '')}|07 after you log off to play.`);
  t.line();
}
