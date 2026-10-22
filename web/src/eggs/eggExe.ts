// EGG.EXE: an unlisted program on the desk PC (not in HELP, not in any folder) for testing the
// felt eggs. Lists all twelve (and, once all twelve are in, the two kept apart in bonus.ts),
// where each stands, and adds or breaks them. It only changes the
// overrides in localStorage (eggState.ts), never a game's save. Game-Maker's text UI style.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { eggStates, setOverride, type EggState } from './eggState';

const STATE_TEXT: Record<EggState['status'], string> = {
  saved: 'Found in a save',
  added: 'Added by hand',
  broken: 'Broken',
  none: 'Not found',
};
const STATE_ATTR: Record<EggState['status'], number> = {
  saved: attr(10, 1),
  added: attr(11, 1),
  broken: attr(12, 1),
  none: attr(7, 1),
};

/** One line of the ledger: a dozen egg, or (once the dozen is in) one kept apart (bonus.ts). */
interface Row {
  key: string;
  gameTitle: string;
  name: string;
  status: EggState['status'];
  inSave: boolean;
  found: boolean;
  hidden: boolean;
}

async function ledger(): Promise<Row[]> {
  const list = await eggStates();
  const rows: Row[] = list.map((e) => ({ key: e.egg.game, gameTitle: e.egg.gameTitle, name: e.egg.name, status: e.status, inSave: e.inSave, found: e.found, hidden: !!e.egg.detect }));
  if (!list.length || !list.every((e) => e.found)) return rows;
  const { bonusStates, bonusKey } = await import('./bonus');
  for (const e of await bonusStates()) rows.push({ key: bonusKey(e.egg), gameTitle: e.egg.gameTitle, name: e.egg.name, status: e.status, inSave: e.inSave, found: e.found, hidden: !!e.egg.detect });
  return rows;
}

export async function runEggExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  s.cursorVisible = false;
  s.gameMakerColors();
  // the window holds the column heads, a line, one row an egg, the chosen egg's state and a note
  const x = 4;
  const w = 72;
  let n = -1;
  let y = 0;
  const frame = () => {
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' EGG.EXE  Egg Inspector 1.0'.padEnd(55) + 'Sandbox Software 1995 ').slice(0, 80));
    s.write(0, 24, BARATTR, toCp437(' ↑↓ Choose   Enter Add/Break   A Add   B Break   R Reset   Esc Quit').padEnd(80));
    y = Math.max(2, Math.floor((24 - (n + 4)) / 2));
    s.window(x, y, w, n + 4, MENUATTR, SHADATTR);
    s.write(x + Math.floor((w - 16) / 2), y - 1, attr(15, 1), ' FELT EGG LEDGER ');
    s.write(x + 2, y, attr(15, 1), 'Game'.padEnd(29) + 'Egg'.padEnd(24) + 'State');
    s.write(x + 2, y + 1, MENUATTR, 'Ä'.repeat(w - 4));
    s.write(x + 2, y + n + 3, attr(7, 1), toCp437('Changes here never touch a saved game.'));
  };
  let cur = 0;
  for (;;) {
    const list = await ledger();
    // the dozen completed (or broken) here: the ledger grows (or shrinks) to fit
    if (list.length !== n) {
      n = list.length;
      cur = Math.min(cur, n - 1);
      frame();
    }
    list.forEach((e, i) => {
      const row = y + 2 + i;
      const a = i === cur ? CURATTR : MENUATTR;
      s.fill(x + 1, row, x + w - 2, row, a);
      s.write(x + 2, row, a, toCp437(e.gameTitle.slice(0, 28).padEnd(29) + e.name.slice(0, 23).padEnd(24)));
      s.write(x + 55, row, i === cur ? CURATTR : STATE_ATTR[e.status], toCp437(STATE_TEXT[e.status]).padEnd(15));
    });
    // the full state of the chosen egg, under the list
    const e = list[cur];
    s.fill(x + 1, y + n + 2, x + w - 2, y + n + 2, MENUATTR);
    s.write(x + 2, y + n + 2, MENUATTR, toCp437(`${e.name}: ${STATE_TEXT[e.status]}${e.inSave ? '' : e.hidden ? ', not in any save' : ', not hidden in the game yet'}`).slice(0, w - 4));
    const k = await ui.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    if (key === 'ArrowDown') cur = (cur + 1) % list.length;
    else if (key === 'ArrowUp') cur = (cur + list.length - 1) % list.length;
    else if (key === 'Home') cur = 0;
    else if (key === 'End') cur = list.length - 1;
    else if (key === 'Enter' || key === ' ') setOverride(e.key, e.found ? 'broken' : e.inSave ? undefined : 'added');
    else if (key === 'A') setOverride(e.key, e.inSave ? undefined : 'added');
    else if (key === 'B') setOverride(e.key, 'broken');
    else if (key === 'R') setOverride(e.key, undefined);
    else if (key === 'Escape' || key === 'Q') break;
  }
  s.resetPalette();
  s.clear();
}
