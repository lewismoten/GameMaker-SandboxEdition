// The GRAVITAS GamePad drawn (gamePadArt.css): a gray two-lobed pad, its purple d-pad on the
// left with the brass socket the joystick shaft screws into, and four colored buttons in a
// diamond on the right. A picture only, sized by its box: the desk's pad (gamePad.ts) and its
// large controls press it, and TURBO BUTTON's ad (manual/magazine/sections/hardware.ts) shows it.
import './gamePadArt.css';
import { h } from '../../editor/core/ui';

/** The four buttons, 1 to 4: their color and where each sits in the diamond. */
export const PAD_BUTTONS = [
  { n: 1, color: 'red', at: 'left' },
  { n: 2, color: 'yellow', at: 'bottom' },
  { n: 3, color: 'green', at: 'right' },
  { n: 4, color: 'blue', at: 'top' },
] as const;

/** The shell's outline in its 200 x 100 box: two round lobes and a narrow waist. */
const SHELL = 'M50 3C75 3 84 21 100 21S125 3 150 3a47 47 0 0 1 0 94C125 97 116 79 100 79S75 97 50 97a47 47 0 0 1 0-94Z';

/** The rows of grip dots round each lobe's outer edge. */
function gripDots(): string {
  let dots = '';
  for (const [cx, from] of [
    [50, 112],
    [150, -68],
  ] as const)
    for (const r of [40, 34])
      for (let a = 0; a <= 136; a += r === 40 ? 8.5 : 10.5) {
        const t = ((from + a) * Math.PI) / 180;
        dots += `<circle cx="${(cx + r * Math.cos(t)).toFixed(1)}" cy="${(50 + r * Math.sin(t)).toFixed(1)}" r="1.15"/>`;
      }
  return dots;
}

let made = 0;

/** The shell, with its own gradient id (a hidden copy's gradient would leave the others unpainted). */
const shellSvg = (id: string) => `<svg class="gp-shell" viewBox="0 0 200 100" aria-hidden="true">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#eeeeec"/><stop offset="0.55" stop-color="#d4d4d1"/><stop offset="1" stop-color="#a9a9a6"/></linearGradient>
  </defs>
  <path d="${SHELL}" fill="#7d7d7a" transform="translate(0 2.5)"/>
  <path d="${SHELL}" fill="url(#${id})" stroke="#8e8e8a" stroke-width="0.8"/>
  <path d="M97 47 105 78.6" stroke="#9a9a96" stroke-width="0.9"/>
  <circle cx="50" cy="50" r="30" fill="#c4c4c0" stroke="#a3a39f" stroke-width="0.8"/>
  <circle cx="150" cy="50" r="30" fill="#cdcdc9" stroke="#adada9" stroke-width="0.6"/>
  <g fill="#8f8f8b">${gripDots()}</g>
  <g text-anchor="middle" fill="#3b2a6e">
    <text x="100" y="33" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-style="italic" font-size="7.2" letter-spacing="0.2">GRAVITAS</text>
    <text x="100" y="40.5" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="5" fill="#55555a">PC GamePad</text>
  </g>
</svg>`;

/**
 * The pad, its buttons (`.gp-btn[data-b]`) and its d-pad (`.gp-dpad`). `shaft` lays the
 * unscrewed joystick shaft beside it; show() presses what is held.
 */
export function gamePadArt(opts: { shaft?: boolean; alt?: string } = {}): HTMLElement {
  const art = h(
    'span',
    { class: 'gp-art', ...(opts.alt ? { role: 'img', 'aria-label': opts.alt } : { 'aria-hidden': 'true' }) },
    h('span', { class: 'gp-shell-box' }),
    h('span', { class: 'gp-dpad', dataset: { pos: '0' } }, h('span', { class: 'gp-cross' }), h('span', { class: 'gp-socket' })),
    ...PAD_BUTTONS.map((b) => h('span', { class: `gp-btn ${b.color} at-${b.at}`, dataset: { b: String(b.n) } })),
    opts.shaft ? h('span', { class: 'gp-shaft' }, h('span', { class: 'gp-thread' })) : null,
  );
  art.querySelector('.gp-shell-box')!.innerHTML = shellSvg(`gp-plastic-${++made}`);
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
