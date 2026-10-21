// Small things around the desk: a Sandbox BBS mug full of pencils and pens, a beige wall
// telephone (lift the handset for a dial tone), and a swing-arm lamp that is on when it
// is dark outside (click it to switch it yourself).
import './deskProps.css';
import { h } from '../editor/ui';
import { output } from '../audio/output';
import { watchDaylight } from './daylight';
import { deskMug } from './mug';

const svg = (cls: string, viewBox: string, body: string): HTMLElement => {
  const el = h('div', { class: cls });
  el.innerHTML = `<svg viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
  return el;
};

export function mug(): HTMLElement {
  // the mug lives in mug.ts: printed with the picture chosen in its viewer
  return deskMug(() => void import('./mugViewer').then((m) => m.openMugViewer()));
}

/** A dial tone for as long as the handset is off the hook. */
function dialTone(): () => void {
  let ctx: AudioContext | undefined;
  try {
    ctx = new AudioContext();
  } catch {
    return () => undefined;
  }
  const g = ctx.createGain();
  g.gain.value = 0.05;
  g.connect(output(ctx));
  const oscs = [350, 440].map((f) => {
    const o = ctx!.createOscillator();
    o.frequency.value = f;
    o.connect(g);
    o.start();
    return o;
  });
  return () => {
    oscs.forEach((o) => o.stop());
    void ctx!.close();
  };
}

export function wallPhone(): HTMLElement {
  const el = svg(
    'wall-phone',
    '0 0 80 210',
    `<!-- the base on the wall -->
    <rect x="8" y="4" width="64" height="120" rx="9" fill="url(#ph-body)" stroke="#8f8770"/>
    <defs>
      <linearGradient id="ph-body" x1="0" x2="1"><stop offset="0" stop-color="#ece6d3"/><stop offset="0.6" stop-color="#d8d0b8"/><stop offset="1" stop-color="#b3aa90"/></linearGradient>
    </defs>
    <!-- the cradle and keypad -->
    <rect x="18" y="12" width="44" height="8" rx="3" fill="#b3aa90"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${22 + (i % 3) * 13}" y="${66 + Math.floor(i / 3) * 12}" width="10" height="8" rx="2" fill="#f4f1e6" stroke="#9e967c" stroke-width="0.6"/><text x="${27 + (i % 3) * 13}" y="${72 + Math.floor(i / 3) * 12}" text-anchor="middle" font-size="5" font-family="Arial" fill="#444">${'123456789*0#'[i]}</text>`).join('')}
    <!-- the handset, hanging on the base -->
    <g class="handset">
      <rect x="14" y="16" width="52" height="44" rx="8" fill="url(#ph-body)" stroke="#8f8770"/>
      <rect x="28" y="22" width="24" height="32" rx="4" fill="#cbc3aa"/>
      <circle cx="40" cy="27" r="2" fill="#8f8770"/><circle cx="40" cy="49" r="2" fill="#8f8770"/>
    </g>
    <!-- the coiled cord -->
    <path class="cord" d="M40 122 ${Array.from({ length: 14 }, (_, i) => `q ${i % 2 ? -7 : 7} 3 0 6`).join(' ')} q 0 6 -6 2" fill="none" stroke="#c9c1a6" stroke-width="2.4"/>`,
  );
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', 'Wall telephone: lift the handset');
  el.title = 'The phone: lift the handset';
  let hangUp: (() => void) | undefined;
  const toggle = () => {
    if (hangUp) {
      hangUp();
      hangUp = undefined;
      el.classList.remove('off-hook');
    } else {
      hangUp = dialTone();
      el.classList.add('off-hook');
    }
    el.setAttribute('aria-pressed', String(!!hangUp));
  };
  el.addEventListener('click', toggle);
  el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle()));
  return el;
}

/** The lamp, and the pool of light it throws on the desk. */
export function deskLamp(): { lamp: HTMLElement; glow: HTMLElement; dispose(): void } {
  const glow = h('div', { class: 'lamp-glow', 'aria-hidden': 'true' });
  const lamp = svg(
    'desk-lamp',
    '0 0 220 300',
    `<!-- base -->
    <ellipse cx="170" cy="286" rx="40" ry="10" fill="#1d1f24"/>
    <rect x="132" y="272" width="76" height="14" rx="6" fill="#2b2e35"/>
    <!-- lower arm, elbow and upper arm -->
    <line x1="170" y1="276" x2="150" y2="118" stroke="#2b2e35" stroke-width="7" stroke-linecap="round"/>
    <line x1="162" y1="270" x2="143" y2="124" stroke="#8a8d96" stroke-width="1.4"/>
    <path d="M156 210 q6 -4 0 -8 q-6 -4 0 -8 q6 -4 0 -8 q-6 -4 0 -8" fill="none" stroke="#9aa0aa" stroke-width="1.4"/>
    <circle cx="150" cy="118" r="7" fill="#3a3e47"/>
    <line x1="150" y1="118" x2="78" y2="70" stroke="#2b2e35" stroke-width="6" stroke-linecap="round"/>
    <circle cx="78" cy="70" r="6" fill="#3a3e47"/>
    <!-- the shade, tipped down toward the desk -->
    <g transform="rotate(32 70 78)">
      <path d="M58 56 L74 62 L76 72 L72 74 L64 112 Q46 118 28 104 L44 74 L48 70 Z" fill="url(#lamp-shade)" stroke="#1a1c20"/>
      <ellipse class="bulb" cx="46" cy="109" rx="17" ry="4.5" fill="#fff6c8"/>
      <defs><linearGradient id="lamp-shade" x1="0" x2="1"><stop offset="0" stop-color="#1f5a35"/><stop offset="0.45" stop-color="#2f8a52"/><stop offset="1" stop-color="#14402a"/></linearGradient></defs>
    </g>`,
  );
  lamp.setAttribute('role', 'switch');
  lamp.setAttribute('tabindex', '0');
  lamp.setAttribute('aria-label', 'Desk lamp');
  let manual: boolean | undefined;
  let dark = false;
  const show = () => {
    const on = manual ?? dark;
    lamp.classList.toggle('on', on);
    glow.classList.toggle('on', on);
    lamp.setAttribute('aria-checked', String(on));
    lamp.title = on ? 'Desk lamp: on (click to switch off)' : 'Desk lamp: off (click to switch on)';
  };
  const toggle = () => {
    manual = !(manual ?? dark);
    show();
  };
  lamp.addEventListener('click', toggle);
  lamp.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle()));
  const stop = watchDaylight((light) => {
    dark = light < 0.5;
    manual = undefined; // the light outside changed: back to the lamp's habits
    show();
  });
  return { lamp, glow, dispose: stop };
}
