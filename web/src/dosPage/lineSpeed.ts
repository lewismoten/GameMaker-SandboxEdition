// The DOS page's modem speed (dos.html): there is no desk modem to click, so the speed is a
// select in the ⋯ menu, and the "speed it up" hint (retro/bbs/lineSpeed.ts) is a small button
// in the footer row that opens the menu at it. Shown once a call, gone after a while.
import { h } from '../editor/core/ui';
import { speedSelect } from '../retro/bbs/lineSpeedControls';
import { hintText } from '../retro/bbs/lineSpeed';

const HINT_MS = 14_000;

/** The ⋯ menu's row: "Modem speed [14,400 baud ▾]". */
export function speedItem(): { item: HTMLElement; select: HTMLSelectElement } {
  const { label, select } = speedSelect('dos-line-speed');
  label.classList.add('dos-speed');
  label.append(select);
  return { item: label, select };
}

/** The footer's hint; `open` shows the ⋯ menu with the speed in focus. */
export function speedHint(open: () => void): HTMLElement {
  const hint = h('button', { type: 'button', class: 'dos-btn dos-line-hint', hidden: true });
  let timer = 0;
  const hide = () => {
    clearTimeout(timer);
    hint.hidden = true;
  };
  hint.addEventListener('click', (e) => {
    e.stopPropagation(); // not a click "elsewhere" that closes the menu it opens
    hide();
    open();
  });
  addEventListener('gm-line-hint', () => {
    hint.textContent = hintText('page');
    hint.title = hint.textContent;
    hint.hidden = false;
    clearTimeout(timer);
    timer = window.setTimeout(hide, HINT_MS);
  });
  addEventListener('gm-modem', (e) => {
    const s = (e as CustomEvent<string>).detail;
    if (s === 'hangup' || s === 'off') hide();
  });
  return h('span', { class: 'dos-line-hint-live', role: 'status', 'aria-live': 'polite' }, hint);
}
