// GMCRACK.EXE, from GMCRACK.ZIP in the BBS's Warez area: a 1995 scene-style "registration
// doctor" for Game-Maker SE on the desk PC. It registers Game-Maker (writes C:\GM\PLAYGAME.REG
// with a name and key), unregisters it (spoils the key, so CHK.EXE asks the manual again), has
// a KEYGEN that works the key out as CHK.C checks it, RESERIAL, which stamps a new serial number
// into PLAYGAME.EXE (gmcrackSerial.ts), and "cracks" shareware in C:\DOWNLOAD:
// a Game-Maker game's GAME.EXE is XFERPLAY.EXE named after the .GAM it plays (UTILITY.C's
// transfer; PLAYGAME.C under TRANSFER loads argv[0]'s name + .GAM), so the crack renames it
// GAME.BAK and puts a "patched" XFERPLAY in under the same GAME.EXE name, with the group's
// intro before the game as cracked games of the day had (uncrack puts the .BAK back). The
// game itself is not changed, and stays shareware (play only). It touches nothing but this
// pretend PC, and it only cracks this project's own shareware (the Sandbox Software and Bard
// of Bizarre games): the CD's shareware by other authors asks not to be hacked, so it keeps
// its author's notice. Its real job is debugging: switching Game-Maker and games between
// unregistered and registered to test both; the scene dress is for fun.
import type { RetroHost } from '../host';
import type { CatalogEntry } from '../../project/files';
import { attr, COLS, ROWS } from '../text/textScreen';
import { toCp437 } from '../text/cp437';
import { TOP, clearArea, frame, hint, sleep } from './cracktro';
import { pcExtras } from './pcExtras';
import { FACTORY_SERIAL, NAME_MAX, checkRegistration, regFile, registrationNumber } from '../gmReg/registration';
import { BAD_SERIAL, parseSerial, patchLine, randomSerial, regAfter, reserialCli } from './gmcrackSerial';
import { QUESTIONS } from '../gmReg/copyCheck';
import { GMCRACK_NFO, GREETINGS, GROUP, VERSION, bakName } from './gmcrackText';

/** The keygen's name field: CHK.C's fgets keeps 28 letters of a 29-letter name, so 28 is the most that works. */
const KEYGEN_MAX = NAME_MAX - 1;

/** This PC's serial number: the one in its PLAYGAME.EXE now. */
const own = (): number => pcExtras().serial;

/** A key for a name, as CHK.EXE checks it against a copy's serial number (this PC's unless given). */
const keygen = (name: string, serial = own()): string => String(registrationNumber(name.slice(0, KEYGEN_MAX), serial));

/**
 * The shareware games in C:\DOWNLOAD whose .EXE is still there: this project's own (the only
 * ones GMCRACK cracks), or with `any` every one, so a game cracked before can be uncracked.
 */
async function crackable(h: RetroHost, any = false): Promise<CatalogEntry[]> {
  const cat = await h.catalog();
  return h.downloads
    .list()
    .map((id) => cat.find((g) => g.id === id))
    .filter(
      (g): g is CatalogEntry =>
        !!g && g.kind === 'shareware' && (any || !!g.original) && !!g.exe && !!g.gam && !h.downloads.isDeleted(g.id, g.exe.toUpperCase()),
    );
}

function hash(s: string): number {
  let x = 2166136261;
  for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return x;
}

const hex = (n: number, w: number) => n.toString(16).toUpperCase().padStart(w, '0');

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
  const r = checkRegistration(pcExtras().reg, own());
  if (r.kind === 'registered') return `|10REGISTERED |07to |15${r.userName}`;
  if (r.kind === 'check') return '|12UNREGISTERED |07(the manual check at every start)';
  if (r.kind === 'missing') return '|12NO PLAYGAME.REG |07(GM will not start)';
  return "|12BAD PLAYGAME.REG |07(another copy's serial number)";
}

async function menu(h: RetroHost): Promise<string> {
  clearArea(h);
  put(h, 4, TOP, `|07Game-Maker SE 3.00 in |15C:\\GM|07, serial number |14${own()}${own() === FACTORY_SERIAL ? '' : ' |08(reserialed)'}`);
  put(h, 4, TOP + 1, `|07Status: ${status()}`);
  const items: [string, string][] = [
    ['1', 'Register Game-Maker'],
    ['2', 'Unregister Game-Maker'],
    ['3', 'KEYGEN'],
    ['4', 'Crack a shareware game'],
    ['5', 'Uncrack a game'],
    ['6', 'Read GMCRACK.NFO'],
    ['7', 'Answer table (doc check)'],
    ['8', 'RESERIAL PLAYGAME.EXE'],
  ];
  items.forEach(([k, label], i) => put(h, i < 4 ? 6 : 42, TOP + 3 + (i % 4), `|06[|14${k}|06] |15${label}`));
  put(h, 42, TOP + 7, '|06[|14Q|06] |07Quit to DOS');
  hint(h, 'Choose 1-8, or Q to quit');
  for (;;) {
    const k = (await h.keys.next()).key.toUpperCase();
    if ('12345678Q'.includes(k) && k.length === 1) return k;
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
  pcExtras().setReg(regFile(n, own(), k));
  const ok = checkRegistration(pcExtras().reg, own()).kind === 'registered';
  put(h, 4, TOP + 7, ok ? `|10Done! |07Run |15GM|07: "Registered To: ${n}".` : '|12That key does not fit the name. |07GM will ask for the manual.');
  if (!ok) put(h, 4, TOP + 8, '|07Try |14[3] KEYGEN|07 for a key that works.');
  await anyKey(h);
}

async function unregister(h: RetroHost): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, '|14UNREGISTER |07Game-Maker');
  const r = checkRegistration(pcExtras().reg, own());
  // keep the name on the first line of PLAYGAME.REG: CHK.EXE forgets it anyway with a bad key
  const name = (pcExtras().reg ?? '').split(/\r?\n/)[0] ?? '';
  await step(h, TOP + 2, 'Reading C:\\GM\\PLAYGAME.REG', r.kind === 'missing' ? '|12MISSING' : '|10OK');
  await step(h, TOP + 3, 'Spoiling the registration number');
  pcExtras().setReg(regFile(name, own(), '0'));
  put(h, 4, TOP + 5, '|07Game-Maker is |12UNREGISTERED|07. Next time GM starts it shows the serial');
  put(h, 4, TOP + 6, "|07number and asks for a word from the |15Owner's Guide|07: see |14[7] Answer table|07.");
  put(h, 4, TOP + 8, "|08Hint: DEL C:\\GM\\PLAYGAME.REG and GM won't start at all;");
  put(h, 4, TOP + 9, '|08GM REGISTER (or [1] here) brings it back.');
  await anyKey(h);
}

/**
 * KEYGEN: a key for a name and a serial (this PC's, or with R some other copy's). Given
 * `fixed` (RESERIAL's "make a key now") it skips choosing the serial and registers straight away.
 */
async function keygenScreen(h: RetroHost, fixed?: number): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, `|14KEYGEN |07by PiXEL WiZARD/${GROUP}: a key for any name and serial`);
  // a copy's serial is a counter times 1029, plus 4: R makes up another copy's
  let serial = fixed ?? own();
  const showSerial = () =>
    put(h, 4, TOP + 2, `|07Serial: |14${String(serial).padEnd(10)}|08${serial === own() ? "(this PC's copy)    " : '(some other copy)   '}`);
  showSerial();
  if (fixed === undefined) {
    hint(h, "R: another copy's serial (counter x 1029 + 4).  Enter: go on.  Esc: back");
    for (;;) {
      const k = (await h.keys.next()).key.toUpperCase();
      if (k === 'ESCAPE') return;
      if (k === 'ENTER') break;
      if (k === 'R') serial = randomSerial(own());
      else if (k === 'T') serial = own();
      showSerial();
    }
  }
  put(h, 4, TOP + 3, '|07Name:   ');
  hint(h, 'Type the name exactly as it will be registered, then Enter.  Esc goes back.');
  const name = await field(h, 12, TOP + 3, KEYGEN_MAX);
  if (!name?.trim()) return;
  entered(h, 12, TOP + 3, KEYGEN_MAX, name);
  // a little show while it "computes"
  for (let i = 0; i < 12; i++) {
    put(h, 4, TOP + 4, `|07Key:    |08${hex(Math.floor(Math.random() * 0xffffffff), 8)}`);
    await sleep(60);
  }
  const key = keygen(name, serial);
  put(h, 4, TOP + 4, `|07Key:    |14${key.padEnd(10)}`);
  if (fixed !== undefined) {
    await sleep(500);
    return register(h, name, key);
  }
  if (serial !== own()) {
    // CHK.EXE reads the serial out of this copy's PLAYGAME.EXE: stamp this one in and the key fits
    put(h, 4, TOP + 6, `|07That key fits serial |14${serial}|07, not the |14${own()}|07 in this PC's`);
    put(h, 4, TOP + 7, `|07PLAYGAME.EXE. Stamp |14${serial}|07 into it and register? |15[y/N]`);
    hint(h, 'Y stamps the serial in (RESERIAL) and registers with the key.  N goes back.');
    if ((await h.keys.next()).key.toUpperCase() !== 'Y') return;
    await stamp(h, serial);
    await sleep(900);
    return register(h, name, key);
  }
  put(h, 4, TOP + 6, '|07Register Game-Maker with it now? |15[Y/n]');
  hint(h, 'Y registers now (or write it on the registration card for GM REGISTER)');
  const k = (await h.keys.next()).key.toUpperCase();
  if (k !== 'N' && k !== 'ESCAPE') await register(h, name, key);
}

/** Writes serial `to` into PLAYGAME.EXE at PLAYBYTE+30, with the show, and says what it does to PLAYGAME.REG. */
async function stamp(h: RetroHost, to: number): Promise<void> {
  const from = own();
  clearArea(h);
  put(h, 4, TOP, `|14RESERIAL |07PLAYGAME.EXE: |15${from} |07-> |14${to}`);
  await step(h, TOP + 2, 'Opening C:\\GM\\PLAYGAME.EXE');
  await step(h, TOP + 3, `Patching the serial at offset ${patchLine(from, to).split(' ')[0]}`, '|10OK', 900);
  put(h, 6, TOP + 4, `|08${patchLine(from, to)}`);
  pcExtras().setSerial(to);
  put(h, 4, TOP + 6, `|10Done! |07Serial number |14${to}${to === FACTORY_SERIAL ? ' |08(the factory serial)' : ''}`);
  regAfter(pcExtras().reg, to).forEach((l, i) => put(h, 4, TOP + 7 + i, `|${checkRegistration(pcExtras().reg, to).kind === 'bad' ? '12' : '07'}${l}`));
}

/** RESERIAL: a new serial number for this PC's copy (random, typed in, or the factory one). */
async function reserialScreen(h: RetroHost): Promise<void> {
  clearArea(h);
  put(h, 4, TOP, `|14RESERIAL |07by vesuvian/${GROUP}: a new serial number in PLAYGAME.EXE`);
  put(h, 4, TOP + 2, `|07Serial now: |14${own()} |08${own() === FACTORY_SERIAL ? '(the factory serial)' : '(reserialed)'}`);
  put(h, 4, TOP + 4, `|06[|14R|06] |15a random serial   |06[|14T|06] |15type one in   |06[|14F|06] |15factory (${FACTORY_SERIAL})`);
  hint(h, 'R, T or F.  Esc goes back.');
  let to: number | undefined;
  for (;;) {
    const k = (await h.keys.next()).key.toUpperCase();
    if (k === 'ESCAPE') return;
    if (k === 'R') to = randomSerial(own());
    else if (k === 'F') to = FACTORY_SERIAL;
    else if (k === 'T') {
      put(h, 4, TOP + 6, '|07New serial: ');
      hint(h, 'A serial is a counter x 1029, plus 4.  Enter stamps it in.  Esc goes back.');
      for (;;) {
        const typed = await field(h, 16, TOP + 6, 10, true);
        if (typed === null) return;
        to = parseSerial(typed);
        if (to !== undefined) break;
        put(h, 4, TOP + 7, `|12${BAD_SERIAL}`);
      }
    } else continue;
    break;
  }
  if (to === own()) {
    put(h, 4, TOP + 8, `|07PLAYGAME.EXE has serial |14${to}|07 already.`);
    return anyKey(h);
  }
  await stamp(h, to);
  if (checkRegistration(pcExtras().reg, to).kind === 'registered') return anyKey(h);
  put(h, 4, TOP + 10, '|07Make a key for the new serial and register now? |15[Y/n]');
  hint(h, 'Y: KEYGEN for the new serial, then register.  N goes back.');
  const k = (await h.keys.next()).key.toUpperCase();
  if (k !== 'N' && k !== 'ESCAPE') await keygenScreen(h, to);
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
    put(h, 4, TOP + 3, "|08We crack only Sandbox and Sofa games. Others' shareware: REGISTER it!");
    return anyKey(h);
  }
  const g = await pickGame(h, games, '|14CRACK |07which shareware game in |15C:\\DOWNLOAD|07?');
  if (!g) return;
  const exe = g.exe!.toUpperCase();
  const at = hash(g.id);
  clearArea(h);
  put(h, 4, TOP, `|14CRACKING |15${exe} |07(${g.title.slice(0, 48)})`);
  await step(h, TOP + 2, `Renaming ${exe} to ${bakName(exe)}`);
  await step(h, TOP + 3, 'Looking for the entry point', `|10found at ${hex(at & 0xffff, 4)}:${hex((at >>> 16) & 0xfff0, 4)}`, 900);
  await step(h, TOP + 4, `Patching 75 ${hex(at & 0x7f, 2)} -> EB ${hex(at & 0x7f, 2)}`);
  await step(h, TOP + 5, `Adding the ${GROUP} intro`);
  await step(h, TOP + 6, `Writing patched XFERPLAY as ${exe}`);
  pcExtras().setCracked(g.id, true);
  put(h, 4, TOP + 8, `|10Cracked! |07${exe} starts with the ${GROUP} intro now.`);
  put(h, 4, TOP + 9, `|07Enjoy it? |14REGISTER it with its author|07${g.price && !/free/i.test(g.price) ? ` (${g.price})` : ''}!`);
  await anyKey(h);
}

async function uncrack(h: RetroHost): Promise<void> {
  const games = (await crackable(h, true)).filter((g) => pcExtras().cracked(g.id) !== undefined);
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

/** Rows of the answer table on one screen: two columns of ANSWER_ROWS. */
const ANSWER_ROWS = 9;
const ANSWER_HEAD = 'PAGE PAR WORD  ANSWER       ';
const GUTTER = '      ';

/** The doc check bypass list: every question CHK.EXE can ask with its word, two columns a screen (|NN colors). */
export function answerPages(): string[][] {
  const cell = (i: number) => {
    const q = QUESTIONS[i];
    return q ? `|07${String(q.page).padStart(4)} ${String(q.paragraph).padStart(3)} ${String(q.word).padStart(4)}  |14${q.answer.padEnd(13)}` : '';
  };
  const pages: string[][] = [];
  for (let first = 0; first < QUESTIONS.length; first += ANSWER_ROWS * 2) {
    const two = first + ANSWER_ROWS < QUESTIONS.length;
    const rows = [`|08${ANSWER_HEAD}${two ? GUTTER + ANSWER_HEAD : ''}`];
    for (let r = 0; r < ANSWER_ROWS && first + r < QUESTIONS.length; r++) rows.push(`${cell(first + r)}${GUTTER}${cell(first + ANSWER_ROWS + r)}`);
    pages.push(rows);
  }
  return pages;
}

async function answerTable(h: RetroHost): Promise<void> {
  const pages = answerPages();
  for (let p = 0; p < pages.length;) {
    clearArea(h);
    put(h, 4, TOP - 1, `|14DOC CHECK BYPASS LIST |07for the SE Owner's Guide  |08(${p + 1}/${pages.length})`);
    pages[p].forEach((row, i) => put(h, 4, TOP + 1 + i, row));
    const more = p + 1 < pages.length;
    hint(h, `${more ? 'Any key for more' : 'Any key goes back'}${p > 0 ? ', PgUp for the last screen' : ''}${more ? ', Esc goes back' : ''}`);
    const k = (await h.keys.next()).key;
    if (k === 'Escape') return;
    if (k === 'PageUp' && p > 0) p--;
    else if (more) p++;
    else return;
  }
}

function usage(h: RetroHost): void {
  const p = (t: string) => h.screen.print(`${toCp437(t)}\n`);
  p(`GMCRACK v${VERSION}  (c) 1995 ${GROUP}`);
  p('');
  p('  GMCRACK            the menu: register, unregister, KEYGEN, crack, RESERIAL');
  p('  GMCRACK /K name    prints the registration key for a name');
  p('  GMCRACK /R name    the same for a made-up serial of some other copy');
  p('  GMCRACK /S         RESERIAL: stamps a random serial into PLAYGAME.EXE');
  p('  GMCRACK /S number  stamps that serial in (a counter x 1029, plus 4)');
  p('  GMCRACK /S F       puts the factory serial back');
  p('  GMCRACK /?         this help');
}

/** GMCRACK.EXE [/K name] [/R name] [/S [serial | F]] [/?] */
export async function runGmCrack(h: RetroHost, args: string[]): Promise<void> {
  await pcExtras().ready;
  const sw = args[0]?.toUpperCase();
  if (sw === '/?' || sw === '-?' || sw === '/H') return usage(h);
  if (sw === '/K' || sw === '-K' || sw === '/R' || sw === '-R') {
    const name = args.slice(1).join(' ');
    if (!name) return usage(h);
    const serial = sw.endsWith('R') ? randomSerial(own()) : own();
    h.screen.print(`${toCp437(`Name: ${name.slice(0, KEYGEN_MAX)}\nKey:  ${keygen(name, serial)}   (serial ${serial})`)}\n`);
    return;
  }
  if (sw === '/S' || sw === '-S') {
    for (const l of reserialCli(args[1], pcExtras())) h.screen.print(`${toCp437(l)}\n`);
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
      else if (k === '7') await answerTable(h);
      else if (k === '8') await reserialScreen(h);
    }
  } finally {
    stop();
  }
  h.screen.resetPalette();
  h.screen.clear();
  h.screen.print(toCp437(`GMCRACK v${VERSION} by ${GROUP}.  ${GREETINGS}\n`));
}
