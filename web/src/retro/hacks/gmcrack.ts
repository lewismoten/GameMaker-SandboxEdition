// GMCRACK.EXE, from GMCRACK.ZIP in the BBS's Utilities area: a 1995 scene-style "registration
// doctor" for Game-Maker SE on the desk PC. It registers Game-Maker (writes C:\GM\PLAYGAME.REG
// with a name and key), unregisters it (spoils the key, so CHK.EXE asks the manual again), has
// a KEYGEN that works the key out as CHK.C checks it, and "cracks" shareware in C:\DOWNLOAD:
// GAME.EXE is kept as GAME.BAK and the "patched" GAME.EXE shows the group's intro before the
// game, as cracked games of the day did (uncrack puts the .BAK back). The game itself is not
// changed, and stays shareware (play only). It touches nothing but this pretend PC.
import type { RetroHost } from '../host';
import type { CatalogEntry } from '../../project/files';
import { attr, COLS, ROWS } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { bigText, bigTextWidth, centered, fadeBar } from '../bbs/ansiArt';
import { pcExtras } from './pcExtras';
import { NAME_MAX, SERIAL, checkRegistration, regFile, registrationNumber } from '../gmReg/registration';
import { GMCRACK_NFO, GREETINGS, GROUP, SCROLLER, VERSION, bakName } from './gmcrackText';

/** The keygen's name field: CHK.C's fgets keeps 28 letters of a 29-letter name, so 28 is the most that works. */
const KEYGEN_MAX = NAME_MAX - 1;
const TOP = 10; // first row under the logo
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A key for a name, as CHK.EXE will check it against this PC's serial number. */
export const keygen = (name: string): string => String(registrationNumber(name.slice(0, KEYGEN_MAX), SERIAL));

/** The shareware games in C:\DOWNLOAD whose .EXE is still there. */
export async function crackable(h: RetroHost): Promise<CatalogEntry[]> {
  const cat = await h.catalog();
  return h.downloads
    .list()
    .map((id) => cat.find((g) => g.id === id))
    .filter((g): g is CatalogEntry => !!g && g.kind === 'shareware' && !!g.exe && !!g.gam && !h.downloads.isDeleted(g.id, g.exe.toUpperCase()));
}

function hash(s: string): number {
  let x = 2166136261;
  for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return x;
}

const hex = (n: number, w: number) => n.toString(16).toUpperCase().padStart(w, '0');

/** The logo, the bars and a scroller along the bottom; returns a function that stops the scroller. */
function frame(h: RetroHost): () => void {
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

function clearArea(h: RetroHost): void {
  h.screen.fill(0, TOP - 1, COLS - 1, ROWS - 4, attr(7, 0));
}

/** Writes text with |NN colors at a spot. */
function put(h: RetroHost, x: number, y: number, text: string): void {
  let fg = 7;
  toCp437(text)
    .split(/\|(\d\d)/)
    .forEach((p, i) => {
      if (i % 2) fg = Number(p) & 15;
      else for (const ch of p) h.screen.put(x++, y, ch.charCodeAt(0), attr(fg, 0));
    });
}

function hint(h: RetroHost, text: string): void {
  h.screen.fill(0, ROWS - 1, COLS - 1, ROWS - 1, attr(0, 6));
  h.screen.write(1, ROWS - 1, attr(0, 6), toCp437(text).slice(0, COLS - 2));
}

/** A typed field; null for Esc. */
async function field(h: RetroHost, x: number, y: number, len: number, digits = false): Promise<string | null> {
  const s = h.screen;
  let text = '';
  s.cursorVisible = true;
  try {
    for (;;) {
      s.write(x, y, attr(15, 1), toCp437(text).padEnd(len, ' '));
      s.cursorX = Math.min(COLS - 1, x + text.length);
      s.cursorY = y;
      const k = await h.keys.next();
      if (k.key === 'Escape') return null;
      if (k.key === 'Enter') return text;
      if (k.key === 'Backspace') text = text.slice(0, -1);
      else if (k.key.length === 1 && text.length < len && (!digits || /\d/.test(k.key))) text += k.key;
    }
  } finally {
    s.cursorVisible = false;
  }
}

/** What was typed in a field, shown plainly once it is entered. */
function entered(h: RetroHost, x: number, y: number, len: number, text: string): void {
  h.screen.fill(x, y, x + len - 1, y, attr(7, 0));
  put(h, x, y, `|15${text}`);
}

async function anyKey(h: RetroHost): Promise<void> {
  hint(h, 'Press any key to go back');
  await h.keys.next();
}

/** "Doing something ......... OK", a dot at a time. */
async function step(h: RetroHost, y: number, text: string, result = '|10OK', ms = 400): Promise<void> {
  put(h, 4, y, `|07${text}`);
  const dots = 44 - text.length;
  for (let i = 0; i < dots; i++) {
    h.screen.put(4 + text.length + i, y, 46, attr(8, 0));
    if (i % 4 === 0) await sleep(ms / (dots / 4));
  }
  put(h, 4 + text.length + dots + 1, y, result);
}

function status(): string {
  const r = checkRegistration(pcExtras().reg);
  if (r.kind === 'registered') return `|10REGISTERED |07to |15${r.userName}`;
  if (r.kind === 'check') return '|12UNREGISTERED |07(the manual check at every start)';
  if (r.kind === 'missing') return '|12NO PLAYGAME.REG |07(GM will not start)';
  return '|12BAD PLAYGAME.REG |07(another copy\'s serial number)';
}

async function menu(h: RetroHost): Promise<string> {
  clearArea(h);
  put(h, 4, TOP, `|07Game-Maker SE 3.00 in |15C:\\GM|07, serial number |14${SERIAL}`);
  put(h, 4, TOP + 1, `|07Status: ${status()}`);
  const items: [string, string][] = [
    ['1', 'Register Game-Maker'],
    ['2', 'Unregister Game-Maker'],
    ['3', 'KEYGEN'],
    ['4', 'Crack a shareware game'],
    ['5', 'Uncrack a game'],
    ['6', 'Read GMCRACK.NFO'],
  ];
  items.forEach(([k, label], i) => put(h, i < 3 ? 6 : 42, TOP + 3 + (i % 3), `|06[|14${k}|06] |15${label}`));
  put(h, 6, TOP + 7, '|06[|14Q|06] |07Quit to DOS');
  hint(h, 'Choose 1-6, or Q to quit');
  for (;;) {
    const k = (await h.keys.next()).key.toUpperCase();
    if ('123456Q'.includes(k) && k.length === 1) return k;
    if (k === 'ESCAPE') return 'Q';
  }
}

async function register(h: RetroHost, name?: string, key?: string): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, '|14REGISTER |07Game-Maker: PLAYGAME.REG gets a name and a key.');
  put(h, 4, TOP + 2, '|07Name: ');
  hint(h, 'Type, then Enter.  Esc goes back.');
  const n = name ?? (await field(h, 10, TOP + 2, KEYGEN_MAX));
  if (!n?.trim()) return;
  entered(h, 10, TOP + 2, KEYGEN_MAX, n);
  put(h, 4, TOP + 3, '|07Key:  ');
  const k = key ?? (await field(h, 10, TOP + 3, 12, true));
  if (!k) return;
  entered(h, 10, TOP + 3, 12, k);
  await step(h, TOP + 5, 'Writing C:\\GM\\PLAYGAME.REG');
  pcExtras().setReg(regFile(n, SERIAL, k));
  const ok = checkRegistration(pcExtras().reg).kind === 'registered';
  put(h, 4, TOP + 7, ok ? `|10Done! |07Run |15GM|07: "Registered To: ${n}".` : '|12That key does not fit the name. |07GM will ask for the manual.');
  if (!ok) put(h, 4, TOP + 8, '|07Try |14[3] KEYGEN|07 for a key that works.');
  await anyKey(h);
}

async function unregister(h: RetroHost): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, '|14UNREGISTER |07Game-Maker');
  const r = checkRegistration(pcExtras().reg);
  // keep the name on the first line of PLAYGAME.REG: CHK.EXE forgets it anyway with a bad key
  const name = (pcExtras().reg ?? '').split(/\r?\n/)[0] ?? '';
  await step(h, TOP + 2, 'Reading C:\\GM\\PLAYGAME.REG', r.kind === 'missing' ? '|12MISSING' : '|10OK');
  await step(h, TOP + 3, 'Spoiling the registration number');
  pcExtras().setReg(regFile(name, SERIAL, '0'));
  put(h, 4, TOP + 5, '|07Game-Maker is |12UNREGISTERED|07. Next time GM starts it shows the serial');
  put(h, 4, TOP + 6, '|07number and asks for a word from the |15Owner\'s Guide|07 (in the Game-Maker box).');
  put(h, 4, TOP + 8, '|08Hint: DEL C:\\GM\\PLAYGAME.REG and GM won\'t start at all;');
  put(h, 4, TOP + 9, '|08GM REGISTER (or [1] here) brings it back.');
  await anyKey(h);
}

async function keygenScreen(h: RetroHost): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, `|14KEYGEN |07by PiXEL WiZARD/${GROUP}: a key for any name, serial |14${SERIAL}`);
  put(h, 4, TOP + 2, '|07Name: ');
  hint(h, 'Type your name exactly as you will register it, then Enter.  Esc goes back.');
  const name = await field(h, 10, TOP + 2, KEYGEN_MAX);
  if (!name?.trim()) return;
  entered(h, 10, TOP + 2, KEYGEN_MAX, name);
  // a little show while it "computes"
  for (let i = 0; i < 12; i++) {
    put(h, 4, TOP + 3, `|07Key:  |08${hex(Math.floor(Math.random() * 0xffffffff), 8)}`);
    await sleep(60);
  }
  const key = keygen(name);
  put(h, 4, TOP + 3, `|07Key:  |14${key.padEnd(10)}`);
  put(h, 4, TOP + 5, '|07Register Game-Maker with it now? |15[Y/n]');
  hint(h, 'Y registers now (or write it on the registration card for GM REGISTER)');
  const k = (await h.keys.next()).key.toUpperCase();
  if (k !== 'N' && k !== 'ESCAPE') await register(h, name, key);
}

async function pickGame(h: RetroHost, games: CatalogEntry[], title: string): Promise<CatalogEntry | undefined> {
  clearArea(h);
  put(h, 4, TOP, title);
  const shown = games.slice(0, 9);
  shown.forEach((g, i) => put(h, 6, TOP + 2 + i, `|06[|14${i + 1}|06] |15${g.exe!.toUpperCase().padEnd(13)}|07${g.title.slice(0, 50)}`));
  hint(h, `Choose 1-${shown.length}.  Esc goes back.`);
  for (;;) {
    const k = (await h.keys.next()).key;
    if (k === 'Escape') return undefined;
    const g = shown[Number(k) - 1];
    if (g) return g;
  }
}

async function crack(h: RetroHost): Promise<void> {
  const games = (await crackable(h)).filter((g) => pcExtras().cracked(g.id) === undefined);
  if (!games.length) {
    clearArea(h);
    put(h, 4, TOP, '|14CRACK |07a shareware game');
    put(h, 4, TOP + 2, '|07No uncracked shareware in |15C:\\DOWNLOAD|07. Download some from the BBS first!');
    return anyKey(h);
  }
  const g = await pickGame(h, games, '|14CRACK |07which shareware game in |15C:\\DOWNLOAD|07?');
  if (!g) return;
  const exe = g.exe!.toUpperCase();
  const at = hash(g.id);
  clearArea(h);
  put(h, 4, TOP, `|14CRACKING |15${exe} |07(${g.title.slice(0, 48)})`);
  await step(h, TOP + 2, `Copying ${exe} to ${bakName(exe)}`);
  await step(h, TOP + 3, 'Looking for the entry point', `|10found at ${hex(at & 0xffff, 4)}:${hex((at >>> 16) & 0xfff0, 4)}`, 900);
  await step(h, TOP + 4, `Patching 75 ${hex(at & 0x7f, 2)} -> EB ${hex(at & 0x7f, 2)}`);
  await step(h, TOP + 5, `Adding the ${GROUP} intro`);
  pcExtras().setCracked(g.id, true);
  put(h, 4, TOP + 7, `|10Cracked! |07${exe} starts with the ${GROUP} intro now.`);
  put(h, 4, TOP + 8, `|07Enjoy it? |14REGISTER it with its author|07${g.price && !/free/i.test(g.price) ? ` (${g.price})` : ''}!`);
  await anyKey(h);
}

async function uncrack(h: RetroHost): Promise<void> {
  const games = (await crackable(h)).filter((g) => pcExtras().cracked(g.id) !== undefined);
  if (!games.length) {
    clearArea(h);
    put(h, 4, TOP, '|14UNCRACK |07a game');
    put(h, 4, TOP + 2, '|07Nothing in |15C:\\DOWNLOAD|07 is cracked.');
    return anyKey(h);
  }
  const g = await pickGame(h, games, '|14UNCRACK |07which game?');
  if (!g) return;
  const exe = g.exe!.toUpperCase();
  clearArea(h);
  put(h, 4, TOP, `|14UNCRACKING |15${exe}`);
  if (h.downloads.isDeleted(g.id, bakName(exe))) {
    put(h, 4, TOP + 2, `|12${bakName(exe)} is gone! |07Download the game again from the BBS.`);
    return anyKey(h);
  }
  await step(h, TOP + 2, `Deleting the patched ${exe}`);
  await step(h, TOP + 3, `Renaming ${bakName(exe)} to ${exe}`);
  pcExtras().setCracked(g.id, false);
  put(h, 4, TOP + 5, `|10Done. |07${exe} is as its author made it.`);
  await anyKey(h);
}

async function readNfo(h: RetroHost): Promise<void> {
  const rows = ROWS - 4 - TOP + 2;
  for (let top = 0; top < GMCRACK_NFO.length; top += rows) {
    clearArea(h);
    GMCRACK_NFO.slice(top, top + rows).forEach((l, i) => h.screen.write(0, TOP - 1 + i, attr(top === 0 && i < 6 ? 14 : 7, 0), toCp437(l).slice(0, COLS)));
    hint(h, top + rows < GMCRACK_NFO.length ? 'Any key for more, Esc goes back' : 'Press any key to go back');
    if ((await h.keys.next()).key === 'Escape') return;
  }
}

function usage(h: RetroHost): void {
  const p = (t: string) => h.screen.print(`${toCp437(t)}\n`);
  p(`GMCRACK v${VERSION}  (c) 1995 ${GROUP}`);
  p('');
  p('  GMCRACK            the menu: register, unregister, KEYGEN, crack, uncrack');
  p('  GMCRACK /K name    prints the registration key for a name');
  p('  GMCRACK /?         this help');
}

/** GMCRACK.EXE [/K name] [/?] */
export async function runGmCrack(h: RetroHost, args: string[]): Promise<void> {
  await pcExtras().ready;
  const sw = args[0]?.toUpperCase();
  if (sw === '/?' || sw === '-?' || sw === '/H') return usage(h);
  if (sw === '/K' || sw === '-K') {
    const name = args.slice(1).join(' ');
    if (!name) return usage(h);
    h.screen.print(`${toCp437(`Name: ${name.slice(0, KEYGEN_MAX)}\nKey:  ${keygen(name)}   (serial ${SERIAL})`)}\n`);
    return;
  }
  const stop = frame(h);
  try {
    for (;;) {
      const k = await menu(h);
      if (k === 'Q') break;
      if (k === '1') await register(h);
      else if (k === '2') await unregister(h);
      else if (k === '3') await keygenScreen(h);
      else if (k === '4') await crack(h);
      else if (k === '5') await uncrack(h);
      else if (k === '6') await readNfo(h);
    }
  } finally {
    stop();
  }
  h.screen.resetPalette();
  h.screen.clear();
  h.screen.print(toCp437(`GMCRACK v${VERSION} by ${GROUP}.  ${GREETINGS}\n`));
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
    await Promise.race([h.keys.next(), sleep(8000)]);
  } finally {
    stop();
  }
  s.clear();
}
