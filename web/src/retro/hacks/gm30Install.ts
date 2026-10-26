// INSTALL.EXE in C:\DOWNLOAD\GM30, the Warez area's "rip" of Game-Maker 3.00: a 1995-style
// text-mode installer that checks the PC, asks where to install, and then finds Game-Maker in
// C:\GM already (with its registration, read as CHK.EXE reads PLAYGAME.REG) and stops, since
// plain 3.00 would undo the Sandbox Edition. Anywhere else, disk 3 of the download turns out
// to have a CRC error. Either way it changes nothing on the desk PC.
import type { RetroHost } from '../host';
import { attr, ROWS } from '../text/textScreen';
import { checkRegistration } from '../gmReg/registration';
import { pcExtras } from './pcExtras';
import { BG, BRIGHT, DIM, GREEN, HEAD, RED, TEXT, YELLOW, editLine, frame, keyBar, messageBox, num, put, statusLine } from './dosUi';
import { GM30_PARTS, GM30_SERIAL } from './gm30Text';
import { GROUP } from './gmcrackText';
import type { DosNode } from '../dos/vfs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The node at a path on C:, matching names in any case. */
async function findC(h: RetroHost, parts: string[]): Promise<DosNode | undefined> {
  let list = await h.fs.listDir('C', []);
  let node: DosNode | undefined;
  for (const p of parts) {
    node = (list ?? []).find((n) => n.name.toUpperCase() === p.toUpperCase());
    if (!node) return undefined;
    list = node.dir && node.list ? await node.list() : [];
  }
  return node;
}

/** What INSTALL says about the registration it found in C:\GM\PLAYGAME.REG. */
export function registrationLines(reg: string | null, serial: number): string[] {
  const r = checkRegistration(reg, serial);
  if (r.kind === 'registered')
    return [
      `Registered To: ${r.userName}`,
      `(serial ${num(serial)}; this release is ${num(GM30_SERIAL)}, copy #1337,`,
      'so its registration in GM30.NFO would not fit yours anyway)',
    ];
  if (r.kind === 'check') return [`Unregistered (serial ${num(serial)}): GM asks a word from`, "the manual every time. GMCRACK's KEYGEN knows the number."];
  return ['PLAYGAME.REG is missing or bad, so GM will not start!', 'GMCRACK can register it again (or GM REGISTER).'];
}

/** C:\GM, \GM, GM\ ... all mean the installed copy. */
export const isGmDir = (typed: string): boolean => /^(C:)?\\?GM\\?$/i.test(typed.trim());

export async function runWarezInstall(h: RetroHost): Promise<void> {
  const s = h.screen;
  s.resetPalette();
  s.cursorVisible = false;
  const chrome = () => {
    s.fill(0, 0, 79, ROWS - 1, BG);
    put(h, 0, 0, HEAD, '='.repeat(79));
    put(h, 21, 1, YELLOW, 'Game-Maker Version 3.00 Installation');
    put(h, 22, 2, BRIGHT, 'Recreational Software Designs');
    put(h, 26, 3, DIM, `(cracked by ${GROUP})`);
    put(h, 0, 4, HEAD, '='.repeat(79));
    keyBar(h, '~Enter~ Continue  ~Esc~ Quit');
  };
  const finish = (lines: string[]) => {
    s.resetPalette();
    s.clear();
    s.print(`${lines.join('\n')}\n`);
  };
  chrome();
  frame(h, 4, 6, 75, 15, 'Checking your system');
  const checks: [string, string][] = [
    ['Processor', '80386 or better'],
    ['Video', 'VGA'],
    ['Memory', '570K free conventional'],
    ['Sound', 'Sound Blaster (or PC speaker)'],
    ['Hard disk', 'C: has room'],
  ];
  for (const [i, [what, found]] of checks.entries()) {
    put(h, 7, 8 + i, TEXT, `${what.padEnd(12, '.')} ${found}`);
    await sleep(h.turbo() ? 60 : 250);
    put(h, 60, 8 + i, GREEN, 'OK');
  }
  // the four parts must all be unzipped here
  const missing = GM30_PARTS.map((_, i) => `GM30.00${i + 1}`);
  const here = await findC(h, ['DOWNLOAD', 'GM30']);
  const names = new Set((here?.dir && here.list ? await here.list() : []).map((n) => n.name.toUpperCase()));
  const gone = missing.filter((n) => !names.has(n));
  if (gone.length) {
    await messageBox(h, [
      `Insert disk ${missing.indexOf(gone[0]) + 1}: ${gone[0]} not found.`,
      '',
      'Unzip all four parts (GM30-1.ZIP to GM30-4.ZIP)',
      'into C:\\DOWNLOAD\\GM30 and run INSTALL again.',
      '',
      'Press any key.',
    ]);
    return finish(['INSTALL: installation cancelled. Nothing was changed.']);
  }
  statusLine(h, 'Where should Game-Maker go? Enter to accept, Esc to quit.', YELLOW);
  put(h, 7, 14, BRIGHT, 'Install to:');
  const dir = await editLine(h, 19, 14, 30, 'C:\\GM', /^[\x21-\x7e]$/);
  if (dir === null) return finish(['INSTALL: installation cancelled. Nothing was changed.']);

  if (isGmDir(dir)) {
    const gm = await findC(h, ['GM']);
    const kids = gm?.dir && gm.list ? await gm.list() : [];
    const games = kids.filter((n) => n.dir && n.name !== '.' && n.name !== '..').length;
    const store = pcExtras();
    await store.ready;
    statusLine(h, '');
    await messageBox(
      h,
      [
        'Game-Maker is already installed in C:\\GM!',
        '',
        `Found: Game-Maker: Sandbox Edition 3.00, ${games} game folder${games === 1 ? '' : 's'}.`,
        ...registrationLines(store.reg, store.serial),
        '',
        'This release is plain 3.00, older than yours. Installing',
        'over it would undo the Sandbox Edition and your games,',
        'so INSTALL stops here. Nothing was changed.',
        '',
        `${GROUP} says: you already own it, d00d. Go make a game!`,
        '',
        'Press any key.',
      ],
      attr(15, 3),
    );
    return finish(['Game-Maker is already installed in C:\\GM. Type GM to start it.', 'INSTALL: nothing was changed.']);
  }

  // anywhere else: copying, until disk 3's CRC error
  frame(h, 4, 6, 75, 15, `Installing to ${dir.toUpperCase().slice(0, 40)}`);
  for (const [i, part] of missing.entries()) {
    put(h, 7, 8 + i, TEXT, `Expanding ${part} `);
    for (let p = 0; p <= 30; p++) {
      if (i === 2 && p === 19) break;
      put(h, 26, 8 + i, GREEN, '█'.repeat(p).padEnd(30, '░'));
      await sleep(h.turbo() ? 8 : 30);
    }
    if (i === 2) {
      put(h, 58, 8 + i, RED, 'CRC ERROR');
      await messageBox(h, [
        `CRC error in ${part}!`,
        '',
        'Disk 3 of 4 is damaged. Line noise during the',
        'download? (Somebody picked up the phone.)',
        '',
        'INSTALL removed what it copied: nothing was changed.',
        'Tip: the real CD never has CRC errors. Just saying.',
        '',
        'Press any key.',
      ]);
      return finish([`INSTALL: CRC error in ${part}. Installation aborted. Nothing was changed.`]);
    }
    put(h, 58, 8 + i, GREEN, 'OK');
  }
}
