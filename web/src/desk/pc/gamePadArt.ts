// The GRAVITAS GamePad drawn (gamePadArt.css, its SVG parts in gamePadSvg.ts): a gray pad
// shaped like a peanut in its shell (a faint net of shell texture, two round lobes pinched at
// the waist), molded with a side wall and a rounded edge, its purple d-pad standing up on the
// left with the brass socket the joystick shaft screws into recessed in it, and four colored
// buttons in a diamond on the right. A picture only, sized by its box: the desk's pad (gamePad.ts) and its
// large controls press it, and TURBO BUTTON's ad (manual/magazine/sections/hardware.ts) shows it.
import './gamePadArt.css';
import { h } from '../../editor/core/ui';
import { dpadSvg, shaftLyingSvg, shaftUpSvg, shellSvg } from './gamePadSvg';

/** The four buttons, 1 to 4: their color and where each sits in the diamond. */
export const PAD_BUTTONS = [
  { n: 1, color: 'red', at: 'left' },
  { n: 2, color: 'yellow', at: 'bottom' },
  { n: 3, color: 'green', at: 'right' },
  { n: 4, color: 'blue', at: 'top' },
] as const;

let made = 0;

/**
 * The pad, its buttons (`.gp-btn[data-b]`) and its d-pad (`.gp-dpad`). `shaft` lays the
 * unscrewed joystick shaft beside it (`.gp-shaft`) and has it standing in the socket too
 * (`.gp-stick`, hidden unless a page shows it); show() presses what is held.
 */
export function gamePadArt(opts: { shaft?: boolean; alt?: string } = {}): HTMLElement {
  const art = h(
    'span',
    { class: `gp-art${opts.shaft ? ' with-shaft' : ''}`, ...(opts.alt ? { role: 'img', 'aria-label': opts.alt } : { 'aria-hidden': 'true' }) },
    h('span', { class: 'gp-shell-box' }),
    h(
      'span',
      { class: 'gp-dpad', dataset: { pos: '0' } },
      h('span', { class: 'gp-dpad-box' }),
      // the standing shaft lives in the socket, so its foot is always the socket's center
      h('span', { class: 'gp-socket' }, opts.shaft ? h('span', { class: 'gp-stick' }) : null),
    ),
    ...PAD_BUTTONS.map((b) => h('span', { class: `gp-btn ${b.color} at-${b.at}`, dataset: { b: String(b.n) } })),
    opts.shaft ? h('span', { class: 'gp-shaft' }) : null,
  );
  const id = `gp-plastic-${++made}`;
  const fill = (sel: string, svg: string) => {
    const box = art.querySelector(sel);
    if (box) box.innerHTML = svg;
  };
  fill('.gp-shell-box', shellSvg(id));
  fill('.gp-dpad-box', dpadSvg(id));
  fill('.gp-shaft', shaftLyingSvg(id));
  fill('.gp-stick', shaftUpSvg(id));
  return art;
}

/** Presses the drawing's d-pad toward `pos` (0 centered, 1..8 clockwise from up) and the buttons in `buttons` (bit 0 = button 1). */
export function showPad(art: HTMLElement, pos: number, buttons: number): void {
  const dpad = art.querySelector<HTMLElement>('.gp-dpad');
  if (dpad && dpad.dataset.pos !== String(pos)) {
    dpad.dataset.pos = String(pos);
    // the side pushed sinks: the shading comes from that side
    dpad.style.setProperty('--tilt', `${(pos - 1) * 45}deg`);
  }
  for (const b of art.querySelectorAll<HTMLElement>('.gp-btn')) b.classList.toggle('down', (buttons & (1 << (Number(b.dataset.b) - 1))) !== 0);
}
