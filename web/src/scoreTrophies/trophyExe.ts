// EGG.EXE's score trophy page (S from the felt egg ledger): the desk's two score trophies, the
// points behind each, the tier earned and the tier shown, with keys to show another tier
// (← → or - +, or 0 to 5) and to go back to the earned one (R, or Enter on a changed one; X for both). Like the
// egg and tin heart ledgers it only changes EGG.EXE's overrides in localStorage (tiers.ts),
// never the scores kept from play (scores.ts) or a game's save. No game is named or counted.
// Game-Maker's text UI style.
import { attr } from '../retro/text/textScreen';
import { MENUATTR, SHADATTR, TITLEATTR, BARATTR, CURATTR, type Ui } from '../retro/text/textUi';
import { toCp437 } from '../retro/text/cp437';
import { bestSum, loadScores } from './scores';
import { nextTier, readTrophyOverrides, resetTrophyOverrides, setTrophyOverride, TIER_NAMES, tierOf, TOP_TIER, type TrophyKind } from './tiers';

const ROWS: { kind: TrophyKind; title: string }[] = [
  { kind: 'best', title: 'Best scores' },
  { kind: 'total', title: 'Total score' },
];

const num = (n: number) => n.toLocaleString('en-US');

export async function runTrophyExe(ui: Ui): Promise<void> {
  const s = ui.screen;
  const x = 9;
  const w = 62;
  const y = 7;
  let cur = 0;
  for (;;) {
    const r = await loadScores();
    const o = readTrophyOverrides();
    const rows = ROWS.map(({ kind, title }) => {
      const points = kind === 'best' ? bestSum(r) : r.total;
      const earned = tierOf(kind, points);
      return { kind, title, points, earned, shown: o[kind] ?? earned, set: o[kind] !== undefined };
    });
    s.fill(0, 0, 79, 24, attr(7, 0), 176);
    s.write(0, 0, TITLEATTR, toCp437(' EGG.EXE  Egg Inspector 1.0'.padEnd(55) + 'Sandbox Software 1995 ').slice(0, 80));
    s.window(x, y, w, 9, MENUATTR, SHADATTR);
    s.write(x + Math.floor((w - 20) / 2), y - 1, attr(15, 1), ' SCORE TROPHY LEDGER ');
    s.write(x + 2, y, attr(15, 1), 'Trophy'.padEnd(16) + 'Points'.padStart(12) + '   ' + 'Earned'.padEnd(10) + 'Shown');
    s.write(x + 2, y + 1, MENUATTR, 'Ä'.repeat(w - 4));
    rows.forEach((e, i) => {
      const row = y + 2 + i;
      const on = i === cur;
      const a = on ? CURATTR : MENUATTR;
      s.fill(x + 1, row, x + w - 2, row, a);
      s.write(x + 2, row, a, toCp437(e.title.padEnd(16) + num(e.points).padStart(12) + '   ' + TIER_NAMES[e.earned].padEnd(10)));
      // a tier set by hand shows bright, with arrows
      const shown = e.set ? `\x11 ${TIER_NAMES[e.shown]} \x10` : TIER_NAMES[e.shown];
      s.write(x + 43, row, on ? a : e.set ? attr(11, 1) : attr(10, 1), toCp437(shown).padEnd(w - 45));
    });
    // the chosen trophy: what its next tier needs, and whether it shows what was earned
    const e = rows[cur];
    const next = nextTier(e.kind, e.points);
    s.fill(x + 1, y + 5, x + w - 2, y + 7, MENUATTR);
    s.write(
      x + 2,
      y + 5,
      MENUATTR,
      toCp437(next ? `${TIER_NAMES[next.tier]} needs ${num(next.at)}: ${num(next.needs)} more.` : 'Earned the top tier.').slice(0, w - 4),
    );
    s.write(
      x + 2,
      y + 6,
      e.set ? attr(11, 1) : MENUATTR,
      toCp437(e.set ? `Shown as ${TIER_NAMES[e.shown]} by hand. R puts back what was earned.` : 'Shows the tier earned.').slice(0, w - 4),
    );
    s.write(x + 2, y + 7, attr(7, 1), toCp437('Changes here never touch the scores kept from play.'));
    s.write(0, 24, BARATTR, toCp437(' ↑↓ Choose  ←→ Tier  0-5 Set tier  R Reset  X Reset all  Esc Back').padEnd(80).slice(0, 80));
    const k = await ui.keys.next();
    const key = k.key.length === 1 ? k.key.toUpperCase() : k.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') cur = (cur + 1) % rows.length;
    else if (key === 'Home') cur = 0;
    else if (key === 'End') cur = rows.length - 1;
    else if (key === 'ArrowRight' || key === '+' || key === '=') setTrophyOverride(e.kind, Math.min(TOP_TIER, e.shown + 1));
    else if (key === 'ArrowLeft' || key === '-' || key === '_') setTrophyOverride(e.kind, Math.max(0, e.shown - 1));
    else if (/^[0-5]$/.test(key)) setTrophyOverride(e.kind, Number(key));
    else if (key === 'R' || (key === 'Enter' && e.set)) setTrophyOverride(e.kind, undefined);
    else if (key === 'X') resetTrophyOverrides();
    else if (key === 'Escape' || key === 'Q' || key === 'S') break;
  }
}
