// The tin heart hunt's progress, as a line of text that keeps itself current ("You have found
// 2 of 24."), for the tin heart's card on the cast page. Read from the same saves and EGG.EXE
// overrides as the desk's trophy (tinHearts.ts). Empty until the count is known.
import { h } from '../editor/core/ui';
import { heartCount, watchHearts } from './tinHearts';

export function heartProgress(className = 'cast-role cast-hearts'): HTMLElement {
  const el = h('p', { class: className, 'aria-live': 'polite' });
  const update = async () => {
    const { found, total } = await heartCount().catch(() => ({ found: 0, total: 0 }));
    el.textContent = total ? (found >= total ? `You have found all ${total}. Mystery Robot Joe left something on the shelf.` : `You have found ${found} of ${total}.`) : '';
  };
  // once the card is gone (the page left), stop listening
  const stop = watchHearts(() => (el.isConnected ? void update() : stop()));
  void update();
  return el;
}
