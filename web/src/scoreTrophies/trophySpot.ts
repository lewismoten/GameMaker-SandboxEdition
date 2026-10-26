// The desk's two score trophies (tiers.ts, drawn by trophyArt.ts), standing at the back left of
// the desk under the game shelves: the best-scores trophy and the total-score trophy. Each
// shows nothing until a play of a catalog game ends with points (scores.ts), then the tier its
// sum earns, or the one EGG.EXE chose. Hovering says its tier; pressing it (click, Enter or
// Space) says its tier, its sum and what the next tier needs in a speech bubble with a closer
// look, the room's usual way (desk/props/propKit.ts). No game is ever named.
import './scoreTrophies.css';
import { h, clear } from '../editor/core/ui';
import { pressable, say } from '../desk/props/propKit';
import { bestSum, loadScores, watchScores, type ScoreRecord } from './scores';
import { drawScoreTrophy, standsIn } from './trophyArt';
import { nextTier, OVERRIDES_KEY, readTrophyOverrides, TIER_NAMES, tierOf, TOP_TIER, TROPHY_NAMES, TROPHY_OVERRIDES_CHANGED, type TrophyKind } from './tiers';

const W = 40;
const H = 92;
const KINDS: TrophyKind[] = ['best', 'total'];

const num = (n: number) => n.toLocaleString('en-US');
const tierWord = (t: number) => TIER_NAMES[t].toLowerCase();

/** What a trophy says: its tier, its sum, and what the next tier needs. */
export function trophyText(kind: TrophyKind, r: ScoreRecord, shown: number): string {
  const points = kind === 'best' ? bestSum(r) : r.total;
  const earned = tierOf(kind, points);
  const name = TROPHY_NAMES[kind];
  const head = shown === TOP_TIER ? `The gaudy ${name}, the biggest there is.` : `A ${tierWord(shown)} ${name}.`;
  const sum =
    kind === 'best'
      ? `Your best final score in each game adds up to ${num(points)}.`
      : `Every finished game’s final score adds up to ${num(points)}, over ${num(r.plays)} ${r.plays === 1 ? 'play' : 'plays'}.`;
  const next = nextTier(kind, points);
  const ahead = next ? `${TIER_NAMES[next.tier]} needs ${num(next.at)}: ${num(next.needs)} more.` : 'Nothing is bigger.';
  const chosen = shown !== earned ? ` EGG.EXE set this one; ${earned ? `${tierWord(earned)} was earned` : 'none was earned yet'}.` : '';
  return `${head} ${sum} ${ahead}${chosen}`;
}

/**
 * A trophy drawn `cw` x `ch` (CSS pixels) at `scale` device pixels each; `large` (the closer
 * look) writes its plate and keeps only the part of the canvas it stands in.
 */
function art(kind: TrophyKind, tier: number, cw: number, ch: number, scale: number, large = false): HTMLCanvasElement {
  const shown = large ? Math.round(ch * standsIn(tier)) : ch;
  const c = h('canvas', { width: Math.round(cw * scale), height: Math.round(shown * scale), 'aria-hidden': 'true' });
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  g.translate(0, shown - ch);
  drawScoreTrophy(g, cw, ch, tier, kind, large);
  return c;
}

/** Puts the trophies in the room; returns the function that takes them away. */
export function scoreTrophies(place: (el: HTMLElement) => void): () => void {
  const row = h('div', { class: 'score-trophies', hidden: true });
  const buttons = KINDS.map((kind) => {
    const b = h('button', { type: 'button', class: `score-trophy score-trophy-${kind}`, hidden: true });
    row.append(b);
    return b;
  });
  place(row);
  let record: ScoreRecord | undefined;
  let shown: number[] = [-1, -1];
  const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1)) * 1.5;

  const unpress = KINDS.map((kind, i) =>
    pressable(buttons[i], '', () => {
      if (!record) return;
      const big = art(kind, shown[i], W * 2, H * 2, Math.min(2, k), true);
      big.classList.add('score-trophy-closer');
      say(buttons[i], trophyText(kind, record, shown[i]), big);
    }),
  );

  const refresh = async () => {
    record = await loadScores();
    const o = readTrophyOverrides();
    KINDS.forEach((kind, i) => {
      const points = kind === 'best' ? bestSum(record!) : record!.total;
      const tier = o[kind] ?? tierOf(kind, points);
      const b = buttons[i];
      const label = trophyText(kind, record!, tier);
      b.setAttribute('aria-label', `${label} Press for a closer look.`);
      b.title = tier ? `${TIER_NAMES[tier]} ${TROPHY_NAMES[kind]}: ${num(points)}` : '';
      if (tier === shown[i]) return;
      shown[i] = tier;
      b.hidden = !tier;
      b.dataset.tier = String(tier);
      if (tier) clear(b, art(kind, tier, W, H, k));
      else clear(b);
    });
    row.hidden = shown.every((t) => !t);
  };

  const onChange = () => void refresh();
  const onStorage = (e: StorageEvent) => (e.key === OVERRIDES_KEY || e.key === null) && onChange();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  const unwatch = watchScores(onChange);
  window.addEventListener(TROPHY_OVERRIDES_CHANGED, onChange);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  void refresh();
  return () => {
    unwatch();
    unpress.forEach((f) => f());
    window.removeEventListener(TROPHY_OVERRIDES_CHANGED, onChange);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    shown = [-1, -1];
    row.remove();
  };
}
