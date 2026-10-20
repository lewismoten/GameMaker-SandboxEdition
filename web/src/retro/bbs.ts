// TERMINAL.EXE: dials a (fictional) 1994 BBS where the CD's shareware games can be read
// about and "downloaded" into C:\DOWNLOAD. Colors use BBS pipe codes: |XX = color XX.
import type { RetroHost } from './host';
import { attr, COLS, ROWS } from './textScreen';
import { readLine } from './textInput';
import { toCp437 } from './cp437';
import { commas } from './vfs';
import type { CatalogEntry } from '../project/files';
import { dialSounds } from './modem';
import { loginScreen, fadeBar } from './ansiArt';

const BBS_NAME = 'THE GAME-MAKER EXCHANGE';
const PHONE = '555-0144';
const CPS = 1650; // 14,400 bps with V.42bis, in characters per second
const TIME_COMPRESSION = 25; // nobody wants to wait ten minutes

class Term {
  private fg = 7;
  constructor(private h: RetroHost) {}

  get screenRef(): RetroHost['screen'] {
    return this.h.screen;
  }

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
            // Like a real terminal, wrap only when the next character arrives.
            if (s.cursorX >= COLS) this.newline();
            s.put(s.cursorX, s.cursorY, ch.charCodeAt(0), attr(this.fg, 0));
            s.cursorX++;
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

/** Visible width of text with |XX color codes. */
const width = (text: string) => text.replace(/\|\d\d/g, '').length;

/** ╔═══╡ Title ╞═══╗ across the screen. */
function boxTop(title: string): string {
  const left = Math.floor((COLS - 2 - title.length - 4) / 2);
  const right = COLS - 2 - title.length - 4 - left;
  return `|09╔${'═'.repeat(left)}╡ |15${title} |09╞${'═'.repeat(right)}╗`;
}

const boxBottom = () => `|09╚${'═'.repeat(COLS - 2)}╝`;
const boxRule = () => `|09╟${'─'.repeat(COLS - 2)}╢`;

/** ║ text padded to the box width ║ */
function boxRow(text: string): string {
  return `|09║${text}${' '.repeat(Math.max(0, COLS - 2 - width(text)))}|09║`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

const statusLine = (online: string) => ` TERMINAL 2.1 │ COM2 │ 14400 N81 │ ANSI │ ${online}`;

/** Dials, waits through the handshake, and prints what the modem says. */
async function dial(t: Term, h: RetroHost): Promise<void> {
  t.line('|15TERMINAL 2.1  |07Modem on COM2 ready.');
  t.line();
  await t.typeSlowly('ATZ');
  t.line();
  await sleep(300);
  t.line('OK');
  await t.typeSlowly('ATM1L2X4');
  t.line();
  await sleep(200);
  t.line('OK');
  await t.typeSlowly(`ATDT${PHONE}`);
  t.line();
  const call = dialSounds(h.audio(), PHONE);
  const start = performance.now();
  const until = (sec: number) => sleep(Math.max(0, start + sec * 1000 - performance.now()));
  for (const r of call.rings) {
    await until(r);
    t.line('RINGING');
  }
  await until(call.answer);
  t.line('|08(carrier detected, negotiating...)');
  await until(call.connect);
  t.line('|14CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS');
}

export async function runTerminal(h: RetroHost): Promise<void> {
  const t = new Term(h);
  const s = h.screen;
  s.resetPalette();
  s.clear(attr(7, 0));
  s.cursorVisible = true;
  t.status(statusLine('Offline'));
  await dial(t, h);
  const online = performance.now();
  const minutesLeft = () => Math.max(1, 60 - Math.floor((performance.now() - online) / 60000));
  t.status(statusLine('Online'));
  await sleep(700);

  // The logon screen.
  s.cursorX = 0;
  s.cursorY = loginScreen(s);
  t.print('|11Enter your handle, or |15GUEST|11: |15');
  const name = ((await readLine(s, h.keys, [], 24, attr(15, 0))) ?? '').trim().toUpperCase() || 'GUEST';
  t.line();
  if (name !== 'GUEST') {
    t.print('|11Password: |15');
    await readLine(s, h.keys, [], 16, attr(0, 0)); // typed in black: nobody sees it
    t.line();
  }
  await lastCallers(t, name);

  const catalog = (await h.catalog()).filter((g) => g.kind === 'shareware' && g.gam);
  let show = true;
  for (;;) {
    if (show) mainMenu(t, s);
    show = false;
    t.print(`|09[|15Main Menu|09] |07Time left: |14${minutesLeft()}|07 min |09: |15`);
    const k = await t.key();
    t.line(k.length === 1 ? k : '');
    if (k === 'F' || k === 'N') {
      await files(t, h, catalog);
      show = true;
    } else if (k === 'B') {
      await bulletins(t);
      show = true;
    } else if (k === 'S') await systemInfo(t, catalog.length);
    else if (k === 'Y') yourStats(t, name, h, minutesLeft());
    else if (k === 'C') await pageSysop(t, h);
    else if (k === '?' || k === 'Enter') show = true;
    else if (k === 'G' || k === 'Escape') {
      t.print('|11Log off now? |15[Y/n] ');
      const yes = (await t.key()) !== 'N';
      t.line();
      if (!yes) continue;
      t.line();
      t.line(`|07Thanks for calling ${BBS_NAME}!`);
      t.line('|07Remember to register the shareware you enjoy.');
      await sleep(1200);
      t.line();
      t.line('|12NO CARRIER');
      t.status(statusLine('Offline'));
      await sleep(900);
      s.clear();
      return;
    } else t.line('|12Unknown command. |07Press |15?|07 for the menu.');
  }
}

/** Renegade-style: the last few callers after logon. */
async function lastCallers(t: Term, name: string): Promise<void> {
  const s = t.screenRef;
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line(`|07Logon #|141,994|07 · Welcome${name === 'GUEST' ? '' : ' back'}, |15${name}|07!`);
  t.line();
  t.line(boxTop('Last Few Callers'));
  t.line(boxRow(' |11Caller  Handle               Location              Baud   Time  Did'));
  t.line(boxRule());
  const callers: [string, string, string, string, string][] = [
    ['1,989', 'PIXEL WIZARD', 'Nashua, NH', '9600', 'D'],
    ['1,990', 'MONSTER MASH', 'Concord, NH', '14400', 'U'],
    ['1,991', 'SCROLLMASTER', 'Lowell, MA', '2400', '-'],
    ['1,992', 'THE BLOCKSMITH', 'Manchester, NH', '14400', 'D'],
    ['1,993', 'GRAVITY GIRL', 'Keene, NH', '9600', 'DU'],
  ];
  callers.forEach(([n, who, where, baud, did], i) =>
    t.line(boxRow(` |14${n.padStart(6)}  |15${who.padEnd(20)} |07${where.padEnd(20)} |10${baud.padStart(5)}  |07${String(19 + i).padStart(2)}:${String((i * 17) % 60).padStart(2, '0')}  |13${did}`)),
  );
  t.line(boxBottom());
  t.line('|08   D = downloaded   U = uploaded');
  t.line();
  t.print('|07Press |15[Enter]|07 to continue');
  await t.key();
}

function mainMenu(t: Term, s: RetroHost['screen']): void {
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  fadeBar(s, 0, 1);
  s.cursorY = 1;
  t.line(boxTop('Main Menu'));
  const item = (key: string, label: string) => `|09[|14${key}|09] |07${label.padEnd(30)}`;
  const rows: [string, string, string, string][] = [
    ['F', 'File Areas', 'B', 'Bulletins'],
    ['N', 'New Files Scan', 'S', 'System Information'],
    ['Y', 'Your Statistics', 'C', 'Page the SysOp'],
    ['?', 'Redisplay this menu', 'G', 'Goodbye (log off)'],
  ];
  t.line(boxRow(''));
  for (const [a, la, b, lb] of rows) t.line(boxRow(`    ${item(a, la)}${item(b, lb)}`));
  t.line(boxRow(''));
  t.line(boxBottom());
  t.line();
}

async function systemInfo(t: Term, files: number): Promise<void> {
  t.line();
  for (const l of [
    `|15${BBS_NAME} |08─ |07a Renegade-style BBS`,
    `|07Nodes: |142|07   Modem: |1414,400 bps V.32bis|07   Files online: |14${files}`,
    '|07Callers: |141,994|07   Running since: |14March 1993',
    '|07Specialty: shareware made with |15Game-Maker|07 and tips for designers.',
  ])
    t.line(l);
  t.line();
}

function yourStats(t: Term, name: string, h: RetroHost, left: number): void {
  t.line();
  t.line(`|07Handle: |15${name}|07   Security level: |14${name === 'GUEST' ? 10 : 20}|07   Time left today: |14${left}|07 min`);
  t.line(`|07Files downloaded: |14${h.downloads.list().length}|07   Uploads: |140|07   Ratio: |14no limit`);
  t.line();
}

async function pageSysop(t: Term, h: RetroHost): Promise<void> {
  t.print('|07Paging the SysOp');
  const ctx = h.audio();
  for (let i = 0; i < 5; i++) {
    if (ctx) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.type = 'square';
      o.frequency.value = i % 2 ? 1200 : 900;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.15);
    }
    t.print('.');
    await sleep(500);
  }
  t.line();
  t.line('|12The SysOp is not available. |07Leave a message in the Bulletins next time!');
  t.line();
}

async function bulletins(t: Term): Promise<void> {
  t.line();
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
  t.print('|07Press |15[Enter]|07 to continue');
  await t.key();
}

async function files(t: Term, h: RetroHost, catalog: CatalogEntry[]): Promise<void> {
  const s = h.screen;
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line(boxTop('File Area 1: Game-Maker Shareware'));
  t.line(boxRow('|11  #  File name        Size  Description'));
  t.line(boxBottom());
  let lines = 4;
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
  await unzip(t, h, g);
  h.downloads.add(g.id);
  t.line(`|07Type |15CD \\DOWNLOAD\\${g.id.toUpperCase()}|07 then |15${(g.exe ?? '').replace(/\.EXE$/i, '')}|07 after you log off to play.`);
  t.line();
}

/** Bytes per second PKUNZIP inflates and writes to the hard disk. */
const UNZIP_RATE = { turbo: 420_000, slow: 32_000 };

/** PKUNZIP into C:\DOWNLOAD: each file takes as long as its size needs on this PC. */
async function unzip(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const s = h.screen;
  const rate = h.turbo() ? UNZIP_RATE.turbo : UNZIP_RATE.slow;
  t.line(`|07C:\\>PKUNZIP -d ${zipName(g)} C:\\DOWNLOAD\\${g.id.toUpperCase()}`);
  t.line(`|07Searching ZIP: ${zipName(g)}`);
  const files: [string, number][] = [
    ...(g.exe ? [[g.exe, 60_000] as [string, number]] : []),
    ...g.files.map((f, i): [string, number] => [f.toUpperCase(), g.sizes?.[i] ?? Math.round((g.bytes ?? 0) / g.files.length)]),
  ];
  for (const [name, size] of files) {
    t.print(`|07  Inflating: ${name.padEnd(13)}`);
    const x = s.cursorX;
    const ms = (size / rate) * 1000;
    const start = performance.now();
    for (let f = 0; f < 1; ) {
      f = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
      s.write(x, s.cursorY, attr(7, 0), `${Math.round(f * 100)}%`.padStart(4));
      if (f < 1) await sleep(Math.min(100, ms / 4));
    }
    s.write(x, s.cursorY, attr(7, 0), '    ');
    t.line();
  }
}
