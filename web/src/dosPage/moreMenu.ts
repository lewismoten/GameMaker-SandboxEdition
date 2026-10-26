// The DOS page's ⋯ menu (dos.html): the controls used less often (reset, the Sound Blaster card,
// the CD, the BBS, the Owner's Guide and The Ultimate Owner's Guide), so the bar keeps to one row. The panel is placed under the
// button by the window (it must not be clipped by a bar that scrolls sideways on a phone), and
// closes on Escape, on a choice, or on a click elsewhere.
import { h } from '../editor/core/ui';

export function moreMenu(name: string, items: HTMLElement[]): HTMLElement {
  const summary = h('summary', { class: 'dos-btn dos-more-btn', 'aria-label': name, title: name }, h('span', { 'aria-hidden': 'true' }, '⋯'));
  const panel = h('div', { class: 'dos-menu', role: 'group', 'aria-label': name }, ...items);
  const menu = h('details', { class: 'dos-more' }, summary, panel);
  const place = () => {
    const r = summary.getBoundingClientRect();
    panel.style.top = `${r.bottom + 6}px`;
    panel.style.right = `${Math.max(8, innerWidth - r.right)}px`;
  };
  menu.addEventListener('toggle', () => menu.open && place());
  addEventListener('resize', () => menu.open && place());
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    summary.focus();
  });
  // a button chosen closes it (the Sound Blaster checkbox stays open, to see it change)
  panel.addEventListener('click', (e) => {
    if ((e.target as Element).closest('button')) menu.open = false;
  });
  document.addEventListener('click', (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
  return menu;
}
