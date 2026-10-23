// A pair of small beige computer speakers either side of the monitor. The right one has
// the controls: a volume knob (drag it, scroll it or use the arrow keys), a power LED
// that lights with the PC, and a headphone jack. Under them, the Sound Blaster switch.
import './speakers.css';
import { h } from '../../editor/core/ui';
import { getVolume, setVolume } from '../../audio/output';
import { blasterSwitch, type BlasterPc } from './blasterSwitch';

const TURN = 270; // degrees from silent to full

function knob(): HTMLElement {
  const el = h('div', { class: 'spk-knob', role: 'slider', tabindex: 0, 'aria-label': 'Volume', 'aria-valuemin': 0, 'aria-valuemax': 100 });
  const show = () => {
    const v = getVolume();
    el.style.setProperty('--turn', `${-TURN / 2 + v * TURN}deg`);
    el.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    el.title = `Volume ${Math.round(v * 100)}%`;
  };
  const nudge = (d: number) => (setVolume(getVolume() + d), show());
  el.addEventListener('wheel', (e) => (e.preventDefault(), nudge(e.deltaY < 0 ? 0.05 : -0.05)), { passive: false });
  el.addEventListener('keydown', (e) => {
    const d = { ArrowUp: 0.05, ArrowRight: 0.05, ArrowDown: -0.05, ArrowLeft: -0.05 }[e.key];
    if (d) (e.preventDefault(), e.stopPropagation(), nudge(d));
  });
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    let y = e.clientY;
    const move = (m: PointerEvent) => {
      nudge((y - m.clientY) / 120);
      y = m.clientY;
    };
    const up = () => (el.removeEventListener('pointermove', move), el.removeEventListener('pointerup', up));
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });
  show();
  return el;
}

const grille = () => h('div', { class: 'spk-grille' });

export function speakers(pc?: BlasterPc): { left: HTMLElement; right: HTMLElement; power(on: boolean): void } {
  const led = h('span', { class: 'spk-led', title: 'Power' });
  const left = h('div', { class: 'speaker left', 'aria-hidden': 'true' }, grille(), h('span', { class: 'spk-brand' }, 'BOOMTONE'));
  const right = h(
    'div',
    { class: 'speaker right' },
    grille(),
    h('div', { class: 'spk-controls' }, knob(), led, h('span', { class: 'spk-jack', title: 'Headphones' })),
    // under the controls: the Sound Blaster switch (the card is in the PC; the switch is where you can reach it)
    blasterSwitch(pc),
  );
  return { left, right, power: (on) => led.classList.toggle('on', on) };
}
