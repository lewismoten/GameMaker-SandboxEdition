// SCOOT.EXE on the desk PC (C:\COMM): the courier's mail reader, a 1995 text-mode program in
// Game-Maker's colors, reading and writing the same store as Scoot's card on the desk
// (courierStore.ts). Four sections along the top, ←→ (or Tab) to change: Mail (↑↓ a letter,
// Enter reads it, Del deletes it), Postcards, Packages and Setup (Enter switches Quiet).
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import { deleteLetter, loadCourier, loadQuiet, markRead, saveQuiet, MAX_PACKAGES } from './courierStore';
import { letterById } from './tables';
import { EMPTY, QUIET_WORDS, SECTIONS, letterDate, postcardTitle, stampText } from './courierText';

const X = 2;
const W = 76;
const TOP = 2;
const ROWS = 16;
const TEXT = attr(15, 1);
const DIM = attr(7, 1);
const IN = W - 4;

const fit = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}.` : s).padEnd(n);

/** Words wrapped to `n` columns. */
function wrap(text: string, n: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if (line && line.length + 1 + w.length > n) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

export async function runScootExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  s.cursorVisible = false;
  s.gameMakerColors();
  let tab = 0;
  let cur = 0;
  /** The letter open in Mail, if any. */
  let reading: string | undefined;
  let asking = false;

  const frame = (keys: string) => {
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' SCOOT.EXE  Courier Mail 1.0'.padEnd(57) + 'Sandbox Software 1995 ').slice(0, 80));
    s.window(X, TOP, W, ROWS + 3, MENUATTR, SHADATTR);
    s.write(X + Math.floor((W - 18) / 2), TOP - 1, attr(15, 1), toCp437(" SCOOT'S SATCHEL "));
    let tx = X + 2;
    SECTIONS.forEach((name, i) => {
      const label = ` ${name} `;
      s.write(tx, TOP, i === tab ? CURATTR : attr(15, 1), toCp437(label));
      tx += label.length + 1;
    });
    s.write(X + 2, TOP + 1, MENUATTR, 'Ä'.repeat(IN));
    s.write(0, 24, BARATTR, toCp437(keys).padEnd(80).slice(0, 80));
  };
  /** Text rows in the window, from its second row, clipped to fit. */
  const lines = (rows: [string, number?][], from = 0) => {
    let y = TOP + 2 + from;
    for (const [text, a] of rows) for (const l of text ? wrap(text, IN) : ['']) if (y < TOP + 2 + ROWS) s.write(X + 2, y++, a ?? TEXT, toCp437(l.padEnd(IN)));
  };

  try {
    for (;;) {
      const c = loadCourier();
      const section = SECTIONS[tab];
      if (section === 'Mail' && reading) {
        const l = letterById(reading);
        const item = c.mail.find((m) => m.id === reading);
        if (!l || !item) {
          reading = undefined;
          continue;
        }
        frame(asking ? ' Delete this letter? (Y/N)' : ' Esc Back to mail  Del Delete');
        lines([[`From: ${l.from}`], [`Subject: ${l.subject}`], [`Date: ${letterDate(item.day)}`, DIM]]);
        s.write(X + 2, TOP + 5, MENUATTR, 'Ä'.repeat(IN));
        lines(
          l.body.flatMap((p, i) => (i ? [[''], [p]] : [[p]]) as [string][]),
          4,
        );
      } else if (section === 'Mail') {
        cur = Math.max(0, Math.min(cur, c.mail.length - 1));
        frame(c.mail.length ? (asking ? ' Delete this letter? (Y/N)' : ' ←→ Section  ↑↓ Choose  Enter Read  Del Delete  Esc Quit') : ' ←→ Section  Esc Quit');
        if (!c.mail.length) lines([[EMPTY.Mail]]);
        c.mail.slice(0, ROWS).forEach((m, i) => {
          const l = letterById(m.id);
          const row = TOP + 2 + i;
          s.fill(X + 1, row, X + W - 2, row, i === cur ? CURATTR : MENUATTR);
          s.write(
            X + 2,
            row,
            i === cur ? CURATTR : m.read ? DIM : TEXT,
            toCp437(`${m.read ? ' ' : '*'} ${letterDate(m.day).padEnd(8)}  ${fit(l?.from ?? '', 30)} ${fit(l?.subject ?? '', IN - 44)}`),
          );
        });
        if (c.mail.some((m) => !m.read)) s.write(X + 2, TOP + 2 + ROWS - 1, DIM, toCp437(fit('* new letter', IN)));
      } else if (section === 'Postcards') {
        frame(' ←→ Section  Esc Quit');
        if (!c.postcards.length) lines([[EMPTY.Postcards]]);
        else
          lines(
            c.postcards.flatMap((p) => [[postcardTitle(p)], ...p.stamps.map((st) => [`  ${stampText(st)}`, DIM] as [string, number])] as [string, number?][]),
          );
      } else if (section === 'Packages') {
        frame(' ←→ Section  Esc Quit');
        lines(c.packages.length ? [[`In the satchel (${MAX_PACKAGES} at most):`], ...c.packages.map((p) => [`  ${p}`] as [string])] : [[EMPTY.Packages]]);
      } else {
        frame(' ←→ Section  Enter or Space Switch  Esc Quit');
        const quiet = loadQuiet();
        s.fill(X + 1, TOP + 2, X + W - 2, TOP + 2, CURATTR);
        s.write(X + 2, TOP + 2, CURATTR, toCp437(`[${quiet ? 'X' : ' '}] ${QUIET_WORDS}`));
        lines([[''], ['Scoot stands beside the PC on the desk. Quiet keeps its words in; it still waves.', DIM]], 1);
      }

      const k = await ui.keys.next();
      const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
      if (asking) {
        const id = reading ?? c.mail[cur]?.id;
        if (key === 'Y' && id) {
          deleteLetter(id);
          reading = undefined;
        }
        asking = false;
        continue;
      }
      if (section === 'Mail' && reading) {
        if (key === 'Delete' || key === 'D') asking = true;
        else if (key === 'Escape' || key === 'Enter' || key === 'Backspace') reading = undefined;
        continue;
      }
      if (key === 'ArrowRight' || key === 'Tab') ((tab = (tab + 1) % SECTIONS.length), (cur = 0));
      else if (key === 'ArrowLeft') ((tab = (tab + SECTIONS.length - 1) % SECTIONS.length), (cur = 0));
      else if (key === 'Escape' || key === 'Q') break;
      else if (section === 'Mail' && c.mail.length) {
        if (key === 'ArrowDown') cur = (cur + 1) % c.mail.length;
        else if (key === 'ArrowUp') cur = (cur + c.mail.length - 1) % c.mail.length;
        else if (key === 'Enter') {
          reading = c.mail[cur].id;
          markRead(reading);
        } else if (key === 'Delete' || key === 'D') asking = true;
      } else if (section === 'Setup' && (key === 'Enter' || key === ' ')) saveQuiet(!loadQuiet());
    }
  } finally {
    s.resetPalette();
    s.clear();
  }
}
