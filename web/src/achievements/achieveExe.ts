// ACHIEVE.EXE on the desk PC (C:\DOS): the same achievements as the web's "What you've done"
// page (achievements/page.ts), as a 1995 text-mode merit badge log in Game-Maker's colors.
// ←→ (or Tab) pick a part, ↑↓ an entry (a long part scrolls); the line under the list says what
// earned it, and when.
// Hidden ones read "???" with their hint until they are unlocked.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { ACHIEVEMENTS, CATEGORIES, progressOf, shownText } from './catalog';
import { loadAchievements, unlockAchievement } from './store';

const X = 2;
const W = 76;
const TOP = 2;
const ROWS = 13;

/** MM-DD-YY, as DOS's DIR showed dates. */
const dosDate = (t: number) => {
  const d = new Date(t);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getFullYear() % 100).padStart(2, '0')}`;
};

const fit = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}.` : s).padEnd(n);

/** The tabs' short names. */
const TAB: Record<string, string> = { making: 'Making', playing: 'Playing', watching: 'Watching', desk: 'Desk', fun: 'Site', found: 'Found it' };

export async function runAchieveExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  s.cursorVisible = false;
  s.gameMakerColors();
  unlockAchievement('desk-achieve');
  let cat = 0;
  let cur = 0;
  let first = 0; // the top row shown, when a part is longer than the window
  try {
    for (;;) {
      const r = await loadAchievements();
      const done = ACHIEVEMENTS.filter((a) => r.unlocked[a.id]).length;
      s.fill(0, 0, 79, 24, attr(7, 0), 176);
      s.write(0, 0, TITLEATTR, toCp437(' ACHIEVE.EXE  Merit Badge Log 1.0'.padEnd(57) + 'Sandbox Software 1995 ').slice(0, 80));
      s.window(X, TOP, W, ROWS + 6, MENUATTR, SHADATTR);
      s.write(X + Math.floor((W - 18) / 2), TOP - 1, attr(15, 1), " WHAT YOU'VE DONE ");
      // the parts, as tabs along the top of the window
      let tx = X + 2;
      CATEGORIES.forEach((c, i) => {
        const label = ` ${TAB[c.id] ?? c.title} `;
        s.write(tx, TOP, i === cat ? CURATTR : attr(15, 1), toCp437(label));
        tx += label.length + 1;
      });
      s.write(X + 2, TOP + 1, MENUATTR, 'Ä'.repeat(W - 4));
      const list = ACHIEVEMENTS.filter((a) => a.category === CATEGORIES[cat].id);
      cur = Math.min(cur, list.length - 1);
      first = Math.max(0, Math.min(first, cur, list.length - ROWS), cur - ROWS + 1);
      for (let r0 = 0; r0 < ROWS; r0++) {
        const i = first + r0;
        const a = list[i];
        const row = TOP + 2 + r0;
        const at = i === cur ? CURATTR : MENUATTR;
        s.fill(X + 1, row, X + W - 2, row, i === cur && a ? CURATTR : MENUATTR);
        if (!a) continue;
        const when = r.unlocked[a.id];
        const t = shownText(a, !!when);
        const p = progressOf(a, r);
        const right = when ? dosDate(when) : p ? `${p.n}/${p.of}` : '';
        s.write(
          X + 2,
          row,
          i === cur ? at : when ? attr(15, 1) : attr(7, 1),
          toCp437(`${when ? '√' : '·'} ${fit(t.title, 30)} ${fit(t.desc, 30)} ${right.padStart(8)}`),
        );
      }
      // more above or below
      if (first > 0) s.write(X + W - 2, TOP + 2, attr(14, 1), toCp437('↑'));
      if (first + ROWS < list.length) s.write(X + W - 2, TOP + 1 + ROWS, attr(14, 1), toCp437('↓'));
      // the chosen one in full
      const a = list[cur];
      const when = r.unlocked[a.id];
      const t = shownText(a, !!when);
      const p = progressOf(a, r);
      s.write(X + 2, TOP + ROWS + 2, MENUATTR, 'Ä'.repeat(W - 4));
      s.fill(X + 1, TOP + ROWS + 3, X + W - 2, TOP + ROWS + 4, MENUATTR);
      s.write(X + 2, TOP + ROWS + 3, attr(15, 1), toCp437(fit(t.desc, W - 4)));
      const state = when
        ? `Unlocked ${dosDate(when)}`
        : a.hidden
          ? 'Hidden. Keep looking.'
          : p
            ? `${p.n} of ${p.of}${a.unit ? ` ${a.unit}` : ''} so far`
            : 'Not yet.';
      const inPart = list.filter((x) => r.unlocked[x.id]).length;
      s.write(
        X + 2,
        TOP + ROWS + 4,
        attr(7, 1),
        toCp437(fit(`${state}   ${CATEGORIES[cat].title}: ${inPart} of ${list.length}   In all: ${done} of ${ACHIEVEMENTS.length}`, W - 4)),
      );
      s.write(0, 24, BARATTR, toCp437(' ←→ Part  ↑↓ Choose  PgUp PgDn Page  Esc Quit').padEnd(80).slice(0, 80));

      const k = await ui.keys.next();
      const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
      if (key === 'ArrowDown') cur = (cur + 1) % list.length;
      else if (key === 'ArrowUp') cur = (cur + list.length - 1) % list.length;
      else if (key === 'Home') cur = 0;
      else if (key === 'End') cur = list.length - 1;
      else if (key === 'PageDown') cur = Math.min(list.length - 1, cur + ROWS);
      else if (key === 'PageUp') cur = Math.max(0, cur - ROWS);
      else if (key === 'ArrowRight' || key === 'Tab') ((cat = (cat + 1) % CATEGORIES.length), (cur = first = 0));
      else if (key === 'ArrowLeft') ((cat = (cat + CATEGORIES.length - 1) % CATEGORIES.length), (cur = first = 0));
      else if (key === 'Escape' || key === 'Q') break;
    }
  } finally {
    s.resetPalette();
    s.clear();
  }
}
