// The game pad's large controls (gamePad.ts): the pad drawn big in a panel at the bottom of the
// window, over the desk but clear of the PC's screen, with a labelled button on each of the
// d-pad's eight ways and on each of its four buttons. Hold one with the pointer, or with Enter
// or Space (the arrow keys push the d-pad too); the game on the PC reads it as the joystick.
// The panel doesn't take the focus from the game when it is opened or pressed with the pointer.
import { h } from '../../editor/core/ui';
import { padPosition } from '../../input/deskJoystick';
import { focusInto } from '../overlayFocus';
import { gamePadArt, PAD_BUTTONS } from './gamePadArt';
import { pressWithPointer, type PadHolds } from './gamePadHolds';

const WAYS = ['', 'Up', 'Up and right', 'Right', 'Down and right', 'Down', 'Down and left', 'Left', 'Up and left'];
const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

export function gamePadPanel(holds: PadHolds, opener: HTMLElement): { open(focus: boolean): void; close(): void } {
  const art = gamePadArt();
  // the d-pad's eight ways, in a 3 x 3 grid over it (its middle is the d-pad at rest)
  const dirs = h('div', { class: 'gp-dirs', role: 'group', 'aria-label': 'D-pad' });
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const pos = padPosition(col - 1, row - 1, 0.5);
      dirs.append(pos ? h('button', { type: 'button', class: 'gp-way', dataset: { pos: String(pos) }, 'aria-label': WAYS[pos], title: WAYS[pos] }) : h('span'));
    }
  const faces = PAD_BUTTONS.map((b) =>
    h('button', {
      type: 'button',
      class: `gp-face at-${b.at}`,
      dataset: { b: String(b.n) },
      'aria-label': `Button ${b.n}, ${b.color}${b.n > 2 ? ': Game-Maker games read only buttons 1 and 2' : ''}`,
      title: `Button ${b.n} (${b.color})`,
    }),
  );
  const close = h('button', { type: 'button', class: 'gp-close', 'aria-label': 'Close the large game pad', title: 'Close (Esc)' }, '×');
  const panel = h(
    'div',
    { class: 'gp-panel', role: 'dialog', 'aria-label': 'GRAVITAS PC GamePad', hidden: true },
    h('div', { class: 'gp-panel-head' }, h('strong', null, 'GRAVITAS PC GamePad'), close),
    h('div', { class: 'gp-panel-pad' }, art, dirs, ...faces),
    h(
      'p',
      { class: 'gp-panel-note' },
      'Game-Maker games read the d-pad and buttons 1 and 2, red and yellow. Hold a button with the pointer, Enter or Space; the arrow keys push the d-pad.',
    ),
  );
  const unwatch = holds.watch(art);
  let restore: (() => void) | undefined;

  panel.addEventListener('mousedown', (e) => {
    // pressing the pad leaves the keyboard with the game
    if ((e.target as Element).closest('.gp-panel-pad')) e.preventDefault();
  });
  panel.addEventListener('pointerdown', (e) => void pressWithPointer(holds, e, art));

  // ---- the keyboard ----
  const arrows = new Set<string>();
  const pushArrows = () => {
    let dx = 0;
    let dy = 0;
    for (const k of arrows) {
      dx += ARROWS[k][0];
      dy += ARROWS[k][1];
    }
    holds.dir('arrows', padPosition(dx, dy, 0.5));
  };
  const key = (e: KeyboardEvent, down: boolean) => {
    if (e.key === 'Escape') {
      if (down) hide();
    } else if (ARROWS[e.key]) {
      if (down) arrows.add(e.key);
      else arrows.delete(e.key);
      pushArrows();
    } else if (e.key === 'Enter' || e.key === ' ') {
      const el = (e.target as Element).closest<HTMLElement>('.gp-way, .gp-face');
      if (!el) return;
      if (!e.repeat) {
        if (el.dataset.pos) holds.dir('key', down ? Number(el.dataset.pos) : 0);
        else holds.button('key', Number(el.dataset.b), down);
      }
    } else return;
    // not typed on the PC as well (and Enter doesn't click: holding it holds the button)
    e.preventDefault();
    e.stopPropagation();
  };
  panel.addEventListener('keydown', (e) => key(e, true));
  panel.addEventListener('keyup', (e) => key(e, false));
  // a screen reader's click: a short press
  panel.addEventListener('click', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('.gp-way, .gp-face');
    if (!el || e.detail !== 0) return;
    if (el.dataset.pos) holds.dir('tap', Number(el.dataset.pos));
    else holds.button('tap', Number(el.dataset.b), true);
    setTimeout(() => (holds.dir('tap', 0), holds.button('tap', 0, false)), 150);
  });
  panel.addEventListener('focusout', (e) => {
    // the keys let go when the keyboard leaves the panel
    if (panel.contains(e.relatedTarget as Node | null)) return;
    arrows.clear();
    holds.dir('arrows', 0);
    holds.dir('key', 0);
    holds.button('key', 0, false);
  });

  const hide = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    holds.letGo();
    restore?.();
    restore = undefined;
  };
  close.addEventListener('click', hide);
  return {
    open(focus) {
      if (!panel.isConnected) (opener.closest('.desk') ?? document.body).append(panel);
      if (!panel.hidden) return hide();
      panel.hidden = false;
      opener.setAttribute('aria-expanded', 'true');
      // opened from the keyboard: the keyboard goes to the d-pad's up
      if (focus) restore = focusInto(dirs.querySelector<HTMLElement>("[data-pos='1']"));
    },
    close() {
      hide();
      unwatch();
      panel.remove();
    },
  };
}
