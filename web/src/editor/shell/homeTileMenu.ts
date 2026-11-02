// A project's thumbnail actions stay beside the button that opened them, above scrolling tiles.
import { h } from '../core/ui';
import { projectMenuItems } from './homeProjectActions';
import type { HomeGame } from './homeCards';
import './homeTileMenu.css';

export function homeTileMenu(anchor: HTMLElement, game: HomeGame, refresh: () => Promise<void>): void {
  if (!game.project || !anchor.isConnected) return;
  document.querySelector<HTMLElement>('.tile-action-menu:popover-open')?.hidePopover();
  const items = h('div', { class: 'tile-action-items' }, ...projectMenuItems(game.project, refresh));
  const hint = h('p', { class: 'tile-action-hint', hidden: true });
  const close = () => {
    menu.hidePopover();
    if (anchor.isConnected) anchor.focus({ preventScroll: true });
  };
  const menu = h(
    'div',
    { class: 'tile-action-menu', popover: 'auto', role: 'dialog', 'aria-label': `Actions for ${game.title}` },
    h(
      'div',
      { class: 'tile-action-heading' },
      h('strong', null, game.title),
      h('button', { type: 'button', 'aria-label': 'Close game actions', onclick: close }, '×'),
    ),
    items,
    hint,
  );
  const updateHint = () => {
    const above = items.scrollTop > 1;
    const below = items.scrollTop + items.clientHeight < items.scrollHeight - 1;
    hint.hidden = !(above || below);
    hint.textContent = above && below ? '↑ More actions above and below ↓' : below ? 'More actions below ↓' : '↑ More actions above';
  };
  const place = () => {
    const rect = anchor.getBoundingClientRect();
    const below = innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const down = below >= Math.min(menu.scrollHeight, 260) || below >= above;
    const room = Math.max(80, down ? below : above);
    menu.style.maxHeight = `${Math.min(380, room)}px`;
    menu.style.left = `${Math.max(8, Math.min(innerWidth - menu.offsetWidth - 8, rect.right - menu.offsetWidth))}px`;
    menu.style.top = `${Math.max(8, down ? rect.bottom + 4 : rect.top - menu.offsetHeight - 4)}px`;
    updateHint();
  };
  const listeners = new AbortController();
  menu.addEventListener('toggle', (event) => {
    if (event.newState !== 'closed') return;
    listeners.abort();
    anchor.setAttribute('aria-expanded', 'false');
    menu.remove();
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    const buttons = [...menu.querySelectorAll<HTMLButtonElement>('button')];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === 'ArrowDown'
        ? index + 1
        : event.key === 'ArrowUp'
          ? index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : undefined;
    if (next === undefined) return;
    event.preventDefault();
    buttons[(next + buttons.length) % buttons.length].focus();
  });
  // Close before the item's handler opens its own dialog; focus returns to this tile afterwards.
  items.addEventListener(
    'click',
    (event) => {
      if ((event.target as HTMLElement).closest('button, a')) close();
    },
    true,
  );
  items.addEventListener('scroll', updateHint);
  addEventListener('resize', place, { signal: listeners.signal });
  addEventListener(
    'scroll',
    (event) => {
      if (event.target instanceof Node && !menu.contains(event.target)) menu.hidePopover();
    },
    { capture: true, signal: listeners.signal },
  );
  document.body.append(menu);
  menu.showPopover();
  anchor.setAttribute('aria-expanded', 'true');
  place();
  items.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true });
}
