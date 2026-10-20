// The keyboard tray: a slide-out shelf under the desk top holding the keyboard and, on
// its mouse pad, a two-button ball mouse with its cord running back under the desk.
// The handle slides the tray in under the desk and out again.
import './tray.css';
import { h } from '../editor/ui';

function ballMouse(): HTMLElement {
  const mouse = h(
    'div',
    { class: 'ball-mouse', title: 'A two-button ball mouse' },
    h('span', { class: 'mouse-btn left' }),
    h('span', { class: 'mouse-btn right' }),
    h('span', { class: 'mouse-logo' }, 'RSD'),
  );
  // a nudge, as if someone moved it; real clicks go to the screen
  mouse.addEventListener('click', () => {
    mouse.classList.remove('nudge');
    void mouse.offsetWidth;
    mouse.classList.add('nudge');
  });
  return mouse;
}

export function keyboardTray(keyboard: HTMLElement): HTMLElement {
  const tray = h('div', { class: 'kb-tray', dataset: { out: 'true' } });
  const handle = h('button', {
    class: 'tray-handle',
    title: 'Slide the keyboard tray in or out',
    'aria-label': 'Keyboard tray',
    'aria-pressed': 'true',
    onclick: () => {
      const out = tray.dataset.out !== 'true';
      tray.dataset.out = String(out);
      handle.setAttribute('aria-pressed', String(out));
    },
  });
  tray.append(
    h('div', { class: 'tray-slab', 'aria-hidden': 'true' }),
    keyboard,
    h('div', { class: 'mouse-pad' }, h('span', { class: 'pad-print' }, 'SANDBOX', h('br'), 'BBS'), h('span', { class: 'mouse-cord' }), ballMouse()),
    handle,
  );
  return tray;
}
