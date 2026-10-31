// The GRAVITAS pad's TURBO slide switch (input/padTurbo.ts has what it does): the drawn one on
// the pad (`.gp-switch`, made in gamePadArt.ts; the pointer throws it), and the large labeled
// one on the large controls' panel, a real switch for a finger or the keyboard.
import { h } from '../../editor/core/ui';
import { onTurbo, setTurbo, turboOn } from '../../input/padTurbo';

/** A press on a drawn switch throws it; true when the press was on one. */
export function throwDrawnSwitch(e: PointerEvent): boolean {
  if (e.button > 0 || !(e.target as Element).closest('.gp-switch')) return false;
  e.preventDefault();
  setTurbo(!turboOn());
  return true;
}

/** The labeled switch for the large controls: "4 BUTTON" and "TURBO" either side of a slide. */
export function bigSwitch(): HTMLElement {
  const knob = h('span', { class: 'gp-sw-knob' });
  const sw = h(
    'button',
    {
      type: 'button',
      class: 'gp-sw-big',
      role: 'switch',
      'aria-label': 'Turbo: holding button 3 or 4 presses button 1 or 2 over and over, ten times a second',
      title: '4 BUTTON: buttons 3 and 4 do nothing in Game-Maker games. TURBO: holding 3 or 4 presses 1 or 2 over and over.',
    },
    h('span', { class: 'gp-sw-slot' }, knob),
  );
  const word = (text: string, turbo: boolean) => {
    const el = h('span', { class: 'gp-sw-word' }, text);
    el.addEventListener('click', () => setTurbo(turbo));
    return el;
  };
  const show = () => {
    sw.setAttribute('aria-checked', String(turboOn()));
    row.dataset.turbo = turboOn() ? '1' : '0';
  };
  const row = h('div', { class: 'gp-sw-row' }, word('4 BUTTON', false), sw, word('TURBO', true));
  sw.addEventListener('click', () => setTurbo(!turboOn()));
  // the row is gone with the panel; the listener leaves with it once the page's pad does
  const stop = onTurbo(() => (row.isConnected ? show() : stop()));
  show();
  return row;
}
