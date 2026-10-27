// A change an AI made, as a toast at the bottom left: its words, Undo, and a close button. It
// goes after a while unless the pointer or focus is on it. Shared by the bridge panel and the chat.
import { h } from '../../editor/core/ui';
import './changeToast.css';

const toasts = h('div', { class: 'toasts assistant-toasts', role: 'status', 'aria-live': 'polite' });

export function changeToast(summary: string, undo: () => void, who = 'Assistant'): void {
  if (!toasts.isConnected) document.body.append(toasts);
  const t = h(
    'div',
    { class: 'toast' },
    h('span', null, `${who}: ${summary}`),
    h('button', { class: 'toast-undo', onclick: () => (undo(), t.remove()) }, 'Undo'),
    h('button', { class: 'toast-close', 'aria-label': 'Dismiss', title: 'Dismiss', onclick: () => t.remove() }, '×'),
  );
  toasts.append(t);
  // only the newest two stay (a build makes many changes; each is in the chat too)
  while (toasts.children.length > 2) toasts.firstElementChild?.remove();
  let timer = 0;
  const start = () => (timer = window.setTimeout(() => t.remove(), 12_000));
  const stop = () => clearTimeout(timer);
  t.addEventListener('pointerenter', stop);
  t.addEventListener('pointerleave', start);
  t.addEventListener('focusin', stop);
  t.addEventListener('focusout', start);
  start();
}
