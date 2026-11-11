// File-card menus: mouse context menu, a visible button, and standard keyboard navigation.
import './assetMenu.css';
import { h } from '../core/ui';

export interface AssetAction {
  label: string;
  run(): void;
  disabled?: boolean;
  danger?: boolean;
}
let active: ((focus?: boolean) => void) | undefined;

export function assetMenu(anchor: HTMLElement, actions: AssetAction[], point?: { x: number; y: number }, label = 'File actions'): () => void {
  active?.(false);
  let closed = false;
  const menu = h('div', { class: 'asset-menu', role: 'menu', 'aria-label': label, popover: 'auto' });
  const close = (focus = true) => {
    if (closed) return;
    closed = true;
    if (menu.matches(':popover-open')) menu.hidePopover();
    menu.remove();
    anchor.setAttribute('aria-expanded', 'false');
    if (focus && anchor.isConnected) anchor.focus({ preventScroll: true });
    if (active === close) active = undefined;
  };
  active = close;
  menu.append(
    ...actions.map((a) =>
      h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          tabindex: -1,
          disabled: a.disabled,
          class: a.danger ? 'danger' : '',
          onclick: () => {
            // A dialog opened by the action returns to the anchor, since this item is removed.
            close();
            a.run();
          },
        },
        a.label,
      ),
    ),
  );
  const enabled = () => [...menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === 'Tab') {
      close();
      return;
    }
    const buttons = enabled(),
      index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? buttons.length - 1
          : e.key === 'ArrowDown'
            ? (index + 1) % buttons.length
            : e.key === 'ArrowUp'
              ? (index - 1 + buttons.length) % buttons.length
              : undefined;
    if (next !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      buttons[next]?.focus();
    }
  });
  menu.addEventListener('toggle', () => {
    if (!menu.matches(':popover-open')) close(false);
  });
  document.body.append(menu);
  menu.showPopover();
  anchor.setAttribute('aria-expanded', 'true');
  const at = point ?? { x: anchor.getBoundingClientRect().left, y: anchor.getBoundingClientRect().bottom };
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(at.x, innerWidth - box.width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(at.y, innerHeight - box.height - 8))}px`;
  enabled()[0]?.focus();
  return () => close(false);
}
