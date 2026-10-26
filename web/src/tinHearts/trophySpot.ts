// Where the tin heart trophy (trophy.ts) goes on the desk: watches the hearts and shows the
// trophy once every counted heart is found. Until then there is nothing at all, and the
// trophy's drawing and scene aren't fetched.
import { h, clear } from '../editor/core/ui';
import { heartStates, watchHearts } from './tinHearts';
import { setSeenReveal } from './reveal';

/** Shows the trophy once every counted heart is found; returns the function that takes it away. */
export function heartTrophy(place: (el: HTMLElement) => void): () => void {
  const btn = h('button', { type: 'button', class: 'heart-trophy', hidden: true });
  place(btn);
  let total = 0;
  let shown = false;
  let opening = false;

  const refresh = async () => {
    const states = await heartStates().catch(() => []);
    total = states.length;
    const done = total > 0 && states.every((s) => s.found);
    // a heart lost again (EGG.EXE's Clear all): the scene plays again when the set is whole
    if (total && !done) setSeenReveal(false);
    if (done === shown) return;
    shown = done;
    if (!done) {
      btn.hidden = true;
      return clear(btn);
    }
    const [art, { drawTrophy }] = await Promise.all([import('../eggs/diamondHeart'), import('./trophy')]); // with the button's styles
    if (!shown) return; // lost again meanwhile
    const W = 44;
    const H = 60;
    const k = Math.min(3, Math.max(1, window.devicePixelRatio || 1)) * 1.5;
    const c = h('canvas', { class: 'heart-trophy-art', width: W * k, height: H * k, 'aria-hidden': 'true' });
    const g = c.getContext('2d')!;
    g.scale(k, k);
    drawTrophy(art, g, W, H, 0.45, 0.3);
    btn.setAttribute('aria-label', 'A diamond heart on a riveted tin stand, presented by Mystery Robot Joe: take a closer look');
    btn.title = 'Presented by Mystery Robot Joe';
    clear(btn, c);
    btn.hidden = false;
  };

  btn.addEventListener('click', async () => {
    if (opening || !shown) return;
    opening = true;
    try {
      await (await import('./trophy')).openTrophy(total);
    } finally {
      opening = false;
      btn.focus();
    }
  });

  const onChange = () => void refresh();
  const onVisible = () => document.visibilityState === 'visible' && onChange();
  const unwatch = watchHearts(onChange);
  window.addEventListener('focus', onChange);
  document.addEventListener('visibilitychange', onVisible);
  // a heart found on the desk's PC (or in another tab) can complete the set
  const poll = setInterval(() => document.visibilityState === 'visible' && onChange(), 8000);
  void refresh();
  return () => {
    clearInterval(poll);
    unwatch();
    window.removeEventListener('focus', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    btn.remove();
  };
}
