// Small things around the desk: a Sandbox BBS mug full of pencils and pens, a beige wall
// telephone (lift the handset for a dial tone), and a swing-arm lamp that is on when it
// is dark outside (click it to switch it yourself).
import './deskProps.css';
import { h } from '../../editor/core/ui';
import { output } from '../../audio/output';
import { watchDaylight } from './daylight';
import { deskMug } from '../mug/mug';

const svg = (cls: string, viewBox: string, body: string): HTMLElement => {
  const el = h('div', { class: cls });
  el.innerHTML = `<svg viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
  return el;
};

export function mug(): HTMLElement {
  // the mug lives in mug.ts: printed with the picture chosen in its viewer
  return deskMug(() => void import('../mug/mugViewer').then((m) => m.openMugViewer()));
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

/** A coiled cord down a vertical run, as SVG path commands: little loops side to side. */
const coil = (dy: number, turns: number) => Array.from({ length: turns }, (_, i) => `q ${i % 2 ? -7 : 7} ${dy / turns / 2} 0 ${dy / turns}`).join(' ');

export function wallPhone(): HTMLElement {
  // A beige touch-tone wall phone, about 6" x 11": the handset hangs straight down the front
  // of the base on its hook, earpiece up, with the keypad below it and the coiled cord
  // hanging in a loop from the mouthpiece back up into the bottom of the base.
  const keys = Array.from({ length: 12 }, (_, i) => {
    const x = 23 + (i % 3) * 12;
    const y = 134 + Math.floor(i / 3) * 10;
    return `<rect x="${x}" y="${y}" width="10" height="8" rx="2" fill="#f4f1e6" stroke="#9e967c" stroke-width="0.6"/><text x="${x + 5}" y="${y + 6}" text-anchor="middle" font-size="5" font-family="Arial" fill="#444">${'123456789*0#'[i]}</text>`;
  }).join('');
  const holes = (cx: number, cy: number) =>
    [
      [0, 0],
      [-4, 0],
      [4, 0],
      [0, -4],
      [0, 4],
      [-3, -3],
      [3, 3],
      [-3, 3],
      [3, -3],
    ]
      .map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="0.9" fill="#7d755f"/>`)
      .join('');
  const el = svg(
    'wall-phone',
    '0 0 80 260',
    `<defs>
      <linearGradient id="ph-body" x1="0" x2="1"><stop offset="0" stop-color="#ece6d3"/><stop offset="0.6" stop-color="#d8d0b8"/><stop offset="1" stop-color="#b3aa90"/></linearGradient>
      <linearGradient id="ph-hand" x1="0" x2="1"><stop offset="0" stop-color="#f3eedf"/><stop offset="0.5" stop-color="#e0d8c2"/><stop offset="1" stop-color="#b9b097"/></linearGradient>
    </defs>
    <!-- the base on the wall, with the hook the handset hangs on and the keypad below it -->
    <rect x="8" y="4" width="64" height="176" rx="9" fill="url(#ph-body)" stroke="#8f8770"/>
    <rect x="14" y="10" width="52" height="116" rx="12" fill="#c9c0a6"/>
    <rect x="36" y="12" width="8" height="7" rx="2" fill="#8f8770"/>
    <rect x="20" y="130" width="40" height="44" rx="4" fill="#cdc5ab"/>
    ${keys}
    <!-- the coiled cord: out of the base, down in a loop and up into the mouthpiece -->
    <path class="cord" d="M54 180 ${coil(56, 12)} q 0 12 -13 12 q -13 0 -13 -12 ${coil(-104, 22)} q 0 -4 6 -6" fill="none" stroke="#c9c1a6" stroke-width="2.2"/>
    <!-- the handset, hanging on the hook: earpiece, handle, mouthpiece -->
    <g class="handset">
      <path d="M22 16 q0 -8 9 -8 h18 q9 0 9 8 v18 q0 7 -8 9 q-3 1 -3 6 v40 q0 5 3 6 q8 2 8 9 v18 q0 8 -9 8 h-18 q-9 0 -9 -8 v-18 q0 -7 8 -9 q3 -1 3 -6 v-40 q0 -5 -3 -6 q-8 -2 -8 -9 z" fill="url(#ph-hand)" stroke="#8f8770"/>
      <ellipse cx="40" cy="24" rx="12" ry="11" fill="#d9d1b9" stroke="#a99f86" stroke-width="0.6"/>
      ${holes(40, 24)}
      <ellipse cx="40" cy="110" rx="12" ry="11" fill="#d9d1b9" stroke="#a99f86" stroke-width="0.6"/>
      ${holes(40, 110)}
      <rect x="37" y="50" width="6" height="34" rx="3" fill="#000" opacity="0.06"/>
    </g>`,
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
