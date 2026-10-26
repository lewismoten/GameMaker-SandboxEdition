// EGG.EXE: an unlisted program on the desk PC (not in HELP, not in any folder) for testing the
// felt eggs. Lists all thirteen (and, once all of them are in, the two kept apart in bonus.ts),
// where each stands, and adds or breaks them (Enter, A and B: keys its bar never shows, told only in
// SAVEHACK.DOC in the BBS's Warez area, retro/hacks/saveHackText.ts); a line under the list says when Teddy's special
// egg is in the shadow box (all three Teddy eggs found, teddyEgg.ts; never a row of its own). On the rotten egg's row, ← → (or - +) crack it a
// tap at a time, O crumbles it open and 0 makes it whole (bonus.ts eggTaps). R puts the chosen egg
// back to what the saves say; X (Reset all) puts every egg back, the rotten egg whole again too. T opens the tin
// heart ledger (tinHearts/tinHeartExe.ts), a page of its own, and S the score trophies' (scoreTrophies/trophyExe.ts). It only changes what is kept in localStorage (eggState.ts, bonus.ts), never a game's save.
// Game-Maker's text UI style.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { eggStates, resetAllOverrides, setOverride, type EggState } from './eggState';
import { hasTeddyEgg } from './teddyEgg';
import { tally } from '../achievements';

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

/** One line of the ledger: a felt egg, or (once they are all in) one kept apart (bonus.ts). */
interface Row {
  key: string;
  gameTitle: string;
  name: string;
  status: EggState['status'];
  inSave: boolean;
  found: boolean;
  hidden: boolean;
  /** The rotten egg's row only: how far it is tapped (0 whole .. 13 crumbled open). */
  taps?: number;
}

type Bonus = typeof import('./bonus');
let bonus: Bonus | undefined;

async function ledger(): Promise<Row[]> {
  const list = await eggStates();
  const rows: Row[] = list.map((e) => ({
    key: e.egg.game,
    gameTitle: e.egg.gameTitle,
    name: e.egg.name,
    status: e.status,
    inSave: e.inSave,
    found: e.found,
    hidden: !!e.egg.detect,
  }));
  if (!list.length || !list.every((e) => e.found)) return rows;
  bonus ??= await import('./bonus');
  const { bonusStates, bonusKey, eggTaps } = bonus;
  for (const e of await bonusStates())
    rows.push({
      key: bonusKey(e.egg),
      gameTitle: e.egg.gameTitle,
      name: e.egg.name,
      status: e.status,
      inSave: e.inSave,
      found: e.found,
      hidden: !!e.egg.detect,
      taps: e.egg.id === 'rotten' ? eggTaps() : undefined,
    });
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
  // one more line under the note while Teddy's special egg is in the shadow box
  let special = false;
  const frame = () => {
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' EGG.EXE  Egg Inspector 1.0'.padEnd(55) + 'Sandbox Software 1995 ').slice(0, 80));
    const rows = n + 4 + (special ? 1 : 0);
    y = Math.max(2, Math.floor((24 - rows) / 2));
    s.window(x, y, w, rows, MENUATTR, SHADATTR);
    s.write(x + Math.floor((w - 16) / 2), y - 1, attr(15, 1), ' FELT EGG LEDGER ');
    s.write(x + 2, y, attr(15, 1), 'Game'.padEnd(29) + 'Egg'.padEnd(24) + 'State');
    s.write(x + 2, y + 1, MENUATTR, 'Ä'.repeat(w - 4));
    s.write(x + 2, y + n + 3, attr(7, 1), toCp437('Changes here never touch a saved game.'));
    if (special) s.write(x + 2, y + n + 4, attr(14, 1), toCp437('All three Teddy eggs: he laid one of his own for the box.'));
  };
  let cur = 0;
  for (;;) {
    const list = await ledger();
    const hasSpecial = hasTeddyEgg(list.filter((e) => e.found).map((e) => e.key));
    // every egg found (or one broken) here: the ledger grows (or shrinks) to fit
    if (list.length !== n || hasSpecial !== special) {
      n = list.length;
      special = hasSpecial;
      cur = Math.min(cur, n - 1);
      frame();
    }
    list.forEach((e, i) => {
      const row = y + 2 + i;
      const a = i === cur ? CURATTR : MENUATTR;
      s.fill(x + 1, row, x + w - 2, row, a);
      s.write(x + 2, row, a, toCp437(e.gameTitle.slice(0, 28).padEnd(29) + e.name.slice(0, 23).padEnd(24)));
      // a found rotten egg shows how cracked it is; otherwise where it stands
      const t = e.found && e.taps !== undefined && bonus ? e.taps : undefined;
      const text = t !== undefined ? bonus!.tapsText(t) : STATE_TEXT[e.status];
      const ta = t === undefined || !t ? STATE_ATTR[e.status] : t >= bonus!.TAPS ? attr(13, 1) : attr(14, 1);
      s.write(x + 55, row, i === cur ? CURATTR : ta, toCp437(text).padEnd(15));
    });
    // the full state of the chosen egg, under the list
    const e = list[cur];
    const cracks = e.taps !== undefined && bonus ? `, ${bonus.tapsText(e.taps)}` : '';
    s.fill(x + 1, y + n + 2, x + w - 2, y + n + 2, MENUATTR);
    s.write(
      x + 2,
      y + n + 2,
      MENUATTR,
      toCp437(`${e.name}: ${STATE_TEXT[e.status]}${e.inSave ? '' : e.hidden ? ', not in any save' : ', not hidden in the game yet'}${cracks}`).slice(0, w - 4),
    );
    // the keys, with the cracking ones on the rotten egg's row
    const bar =
      e.taps !== undefined
        ? ' ↑↓ ←→ Crack O Open 0 Whole R Reset X Reset all T Hearts S Trophies Esc Quit'
        : ' ↑↓ Choose  R Reset  X Reset all  T Tin hearts  S Trophies  Esc Quit';
    s.write(0, 24, BARATTR, toCp437(bar).padEnd(80).slice(0, 80));
    const k = await ui.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    if (key === 'ArrowDown') cur = (cur + 1) % list.length;
    else if (key === 'ArrowUp') cur = (cur + list.length - 1) % list.length;
    else if (key === 'Home') cur = 0;
    else if (key === 'End') cur = list.length - 1;
    else if (key === 'Enter' || key === ' ') setOverride(e.key, e.found ? 'broken' : e.inSave ? undefined : 'added');
    else if (key === 'A') setOverride(e.key, e.inSave ? undefined : 'added');
    else if (key === 'B') setOverride(e.key, 'broken');
    else if (key === 'R') {
      // the rotten egg goes back to whole, too
      if (e.taps !== undefined && e.taps) bonus?.setEggTaps(0);
      setOverride(e.key, undefined);
    } else if (key === 'X') {
      // every egg back to what the saves say, and the rotten egg whole again
      const b = (bonus ??= await import('./bonus'));
      if (b.eggTaps()) b.setEggTaps(0);
      resetAllOverrides();
    } else if (key === 'T') {
      // the tin heart ledger, a page of its own; back here after
      tally('desk-egg-pages', 'hearts');
      await (await import('../tinHearts/tinHeartExe')).runTinHeartExe(ui);
      n = -1;
    } else if (key === 'S') {
      // the score trophies' page, likewise
      tally('desk-egg-pages', 'trophies');
      await (await import('../scoreTrophies/trophyExe')).runTrophyExe(ui);
      n = -1;
    } else if (key === 'Escape' || key === 'Q') break;
    else if (e.taps !== undefined && bonus) {
      if (key === 'ArrowRight' || key === '+' || key === '=') bonus.setEggTaps(e.taps + 1);
      else if (key === 'ArrowLeft' || key === '-' || key === '_') bonus.setEggTaps(e.taps - 1);
      else if (key === 'O' || key === 'H') bonus.setEggTaps(bonus.TAPS);
      else if (key === '0') bonus.setEggTaps(0);
    }
  }
  s.resetPalette();
  s.clear();
}
