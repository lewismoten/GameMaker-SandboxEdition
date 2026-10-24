// The DOS page's modem speed (dos.html): there is no desk modem to click, so the speed is a
// select in the ⋯ menu, and the "speed it up" hint (retro/bbs/lineSpeed.ts) is a pair of small
// buttons in the footer row: travel through time past this wait, or open the menu at the speed.
// Shown once a call, gone after a while.
import { h } from '../editor/core/ui';
import { speedSelect } from '../retro/bbs/lineSpeedControls';
import { hintText, SPEED_TEXT, timeWarp, WARP_TEXT } from '../retro/bbs/lineSpeed';

const HINT_MS = 14_000;

/** The ⋯ menu's row: "Modem speed [14,400 baud ▾]". */
export function speedItem(): { item: HTMLElement; select: HTMLSelectElement } {
  const { label, select } = speedSelect('dos-line-speed');
  label.classList.add('dos-speed');
  label.append(select);
  return { item: label, select };
}

/**
 * The footer's hint, in its one row: two buttons, a trip through time (this wait only) and
 * the speed (`open` shows the ⋯ menu with the speed in focus); the full sentence is their title.
 */
export function speedHint(open: () => void): HTMLElement {
  const warp = h('button', { type: 'button', class: 'dos-btn dos-line-warp' }, `⏩ ${WARP_TEXT}`);
  const speed = h('button', { type: 'button', class: 'dos-btn' }, 'Speed…');
  const hint = h('span', { class: 'dos-line-hint', role: 'group', 'aria-label': 'Slow line', hidden: true }, warp, speed);
  let timer = 0;
  const hide = () => {
    clearTimeout(timer);
    hint.hidden = true;
  };
  warp.addEventListener('click', () => {
    hide();
    timeWarp();
  });
  speed.addEventListener('click', (e) => {
    e.stopPropagation(); // not a click "elsewhere" that closes the menu it opens
    hide();
    open();
  });
  addEventListener('gm-line-hint', () => {
    const words = hintText();
    warp.title = `${words} ${WARP_TEXT}.`;
    speed.title = `${words} ${SPEED_TEXT}.`;
    speed.setAttribute('aria-label', SPEED_TEXT);
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
