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
    h('span', { class: 'mouse-logo' }, 'SQUEAK'),
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
  // It starts pushed in under the desk and slides out once the desk is on the screen, so
  // you can see it is a tray (straight away without motion).
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tray = h('div', { class: 'kb-tray', dataset: { out: String(still) } });
  const handle = h(
    'button',
    {
      class: 'tray-handle',
      title: 'Slide the keyboard tray in or out',
      'aria-label': 'Keyboard tray pulled out',
      'aria-pressed': String(still),
      onclick: () => setOut(tray.dataset.out !== 'true'),
    },
    h('span', { class: 'tray-pull', 'aria-hidden': 'true' }),
  );
  const setOut = (out: boolean) => {
    tray.dataset.out = String(out);
    handle.setAttribute('aria-pressed', String(out));
  };
  if (!still) setTimeout(() => setOut(true), 900);
  // tray-move slides; tray-plane is the board itself, tilted away from the chair, so the
  // keyboard and the mouse pad share one perspective. The rails stay put under the desk.
  tray.append(
    h(
      'div',
      { class: 'tray-move' },
      h(
        'div',
        { class: 'tray-plane' },
        h('div', { class: 'tray-slab', 'aria-hidden': 'true' }, h('span', { class: 'tray-runner l' }), h('span', { class: 'tray-runner r' })),
        keyboard,
        h('div', { class: 'mouse-pad' }, h('span', { class: 'pad-print' }, 'SANDBOX', h('br'), 'BBS'), h('span', { class: 'mouse-cord' }), ballMouse()),
      ),
      handle,
    ),
  );
  return tray;
}
