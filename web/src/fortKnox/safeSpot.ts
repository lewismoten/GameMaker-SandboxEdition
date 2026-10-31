// Teddy's Fort Locks toy safe on the desk top beside the right speaker: it appears only once a catalog game has
// been won, and pressing it opens the close-up (safeDialog.ts).
import './safeSpot.css';
import { h } from '../editor/core/ui';
import { cover, pressable } from '../desk/props/propKit';
import { loadMoney, MONEY_CHANGED } from './money';
import { safeSvg } from './safeArt';

const NAME = 'Teddy’s Fort Locks toy safe: a green metal bank with a combination dial. Press to look closer.';

/** Shows nothing before the first catalog win, then refreshes in this or another tab. */
export function fortKnoxSafe(place: (el: HTMLElement) => void): () => void {
  const safe = h('div', { class: 'kn-safe', hidden: true });
  const art = h('span', { class: 'kn-safe-art', 'aria-hidden': 'true' });
  art.innerHTML = safeSvg(false, 0);
  safe.append(art);
  // the drawing's lettering and dial numbers are not the name: an empty button covers it (propKit cover)
  const press = cover(safe, NAME, 'Teddy’s Fort Locks toy safe');
  place(safe);
  const refresh = async () => {
    const wins = Object.keys(await loadMoney()).length > 0;
    safe.hidden = !wins;
  };
  const unpress = pressable(press, NAME, () => void import('./safeDialog').then(({ openSafe }) => openSafe()), { title: 'Teddy’s Fort Locks toy safe' });
  const changed = () => void refresh();
  window.addEventListener(MONEY_CHANGED, changed);
  window.addEventListener('focus', changed);
  void refresh();
  return () => {
    unpress();
    window.removeEventListener(MONEY_CHANGED, changed);
    window.removeEventListener('focus', changed);
    safe.remove();
  };
}
