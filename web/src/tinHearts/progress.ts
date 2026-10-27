// The tin heart hunt's progress, as a line of text that keeps itself current ("You have found
// 2 of 26."), for the tin heart's card on the cast page: the games' hearts and the room's. Read
// from the same saves and EGG.EXE overrides as the desk's trophy (tinHearts.ts). Empty until the
// count is known.
import { h } from '../editor/core/ui';
import { heartCount, watchHearts } from './tinHearts';

export function heartProgress(className = 'cast-role cast-hearts'): HTMLElement {
  const el = h('p', { class: className, 'aria-live': 'polite' });
  const update = async () => {
    const { found, total, complete } = await heartCount().catch(() => ({ found: 0, total: 0, complete: false }));
    el.textContent = total
      ? found >= total
        ? `You have found all ${total}. Mystery Robot Joe left something on the shelf.`
        : complete
          ? // every game's heart, found before the room's joined the hunt
            `You have found ${found} of ${total}. Joe’s shelf is set, but one more is ticking somewhere.`
          : `You have found ${found} of ${total}.`
      : '';
  };
  // once the card is gone (the page left), stop listening
  const stop = watchHearts(() => (el.isConnected ? void update() : stop()));
  void update();
  return el;
}

/** One more line for Mystery Robot Joe's card, shown only once the hunt is won. */
export function joeAllAlong(className = 'cast-role cast-joe-heart'): HTMLElement {
  const el = h('p', { class: className, hidden: true }, 'Turns out he had a golden heart all along.');
  const update = async () => {
    const { complete } = await heartCount().catch(() => ({ complete: false }));
    el.hidden = !complete;
  };
  const stop = watchHearts(() => (el.isConnected ? void update() : stop()));
  void update();
  return el;
}
