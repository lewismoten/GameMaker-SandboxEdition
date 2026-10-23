// EGG.EXE's tin heart page (T from the felt egg ledger): every game that counts toward the tin
// hearts, whether its heart is found, and keys to add or take away finds by hand, or set or
// clear them all. Like the egg ledger, it only changes EGG.EXE's overrides in localStorage
// (tinHearts.ts), never a game's save. In development it also lists, dimmed, the games that
// count but hide no heart yet. Game-Maker's text UI style.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { countedOf, heartStates, pendingOf, setAllOverrides, setOverride, type HeartState } from './tinHearts';

const STATE_TEXT: Record<HeartState['status'], string> = {
  saved: 'Found in play',
  added: 'Added by hand',
  broken: 'Taken away',
  none: 'Not found',
};
const STATE_ATTR: Record<HeartState['status'], number> = {
  saved: attr(10, 1),
  added: attr(11, 1),
  broken: attr(12, 1),
  none: attr(7, 1),
};

/** Rows that fit in the window at once (it scrolls past them). */
const VISIBLE = 15;

export async function runTinHeartExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  const { loadGameList } = await import('../project/files');
  const catalog = await loadGameList().catch(() => []);
  const games = countedOf(catalog);
  const pending = import.meta.env?.DEV ? pendingOf(catalog) : [];
  const x = 9;
  const w = 62;
  let cur = 0;
  let top = 0;
  for (;;) {
    const list = await heartStates(games);
    const rows = list.length + pending.length;
    const shown = Math.max(1, Math.min(VISIBLE, rows));
    const y = Math.max(2, Math.floor((24 - (shown + 5)) / 2));
    cur = Math.max(0, Math.min(cur, rows - 1));
    if (cur < top) top = cur;
    if (cur >= top + shown) top = cur - shown + 1;
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' EGG.EXE  Egg Inspector 1.0'.padEnd(55) + 'Sandbox Software 1995 ').slice(0, 80));
    s.window(x, y, w, shown + 5, MENUATTR, SHADATTR);
    s.write(x + Math.floor((w - 17) / 2), y - 1, attr(15, 1), ' TIN HEART LEDGER ');
    s.write(x + 2, y, attr(15, 1), 'Game'.padEnd(42) + 'State');
    s.write(x + 2, y + 1, MENUATTR, 'Ä'.repeat(w - 4));
    for (let i = 0; i < shown; i++) {
      const at = top + i;
      const row = y + 2 + i;
      const on = at === cur;
      const e = list[at];
      const p = e ? undefined : pending[at - list.length];
      const a = on ? CURATTR : MENUATTR;
      s.fill(x + 1, row, x + w - 2, row, a);
      if (!e && !p) continue;
      s.write(x + 2, row, on ? a : e ? a : attr(8, 1), toCp437((e ?? p)!.title.slice(0, 40).padEnd(42)));
      s.write(x + 44, row, on ? a : e ? STATE_ATTR[e.status] : attr(8, 1), toCp437(e ? STATE_TEXT[e.status] : 'not hidden yet').padEnd(15));
    }
    // more above or below: arrows on the frame
    if (top > 0) s.write(x + w - 3, y + 2, MENUATTR, '\x18');
    if (top + shown < rows) s.write(x + w - 3, y + 1 + shown, MENUATTR, '\x19');
    const found = list.filter((h) => h.found).length;
    s.fill(x + 1, y + shown + 2, x + w - 2, y + shown + 3, MENUATTR);
    s.write(
      x + 2,
      y + shown + 2,
      MENUATTR,
      toCp437(`Found ${found} of ${list.length}.${found === list.length && list.length ? ' The trophy is on the desk.' : ''}`),
    );
    s.write(x + 2, y + shown + 3, attr(7, 1), toCp437('Changes here never touch a saved game.'));
    s.write(0, 24, BARATTR, toCp437(' ↑↓ Choose  Enter Find/Lose  S Set all  C Clear all  R Reset  Esc Back').padEnd(80).slice(0, 80));
    const k = await ui.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    const e = list[cur];
    if (key === 'ArrowDown') cur = (cur + 1) % rows;
    else if (key === 'ArrowUp') cur = (cur + rows - 1) % rows;
    else if (key === 'PageDown') cur = Math.min(rows - 1, cur + shown);
    else if (key === 'PageUp') cur = Math.max(0, cur - shown);
    else if (key === 'Home') cur = 0;
    else if (key === 'End') cur = rows - 1;
    else if ((key === 'Enter' || key === ' ') && e) setOverride(e.id, e.found ? (e.inSave ? 'broken' : undefined) : e.inSave ? undefined : 'added');
    else if (key === 'S') setAllOverrides(list, true);
    else if (key === 'C') setAllOverrides(list, false);
    else if (key === 'R') for (const h of list) setOverride(h.id, undefined);
    else if (key === 'Escape' || key === 'Q' || key === 'T') break;
  }
}
