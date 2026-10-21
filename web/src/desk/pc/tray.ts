// The keyboard tray: a slide-out shelf under the desk top holding the keyboard and, on
// its mouse pad, a two-button ball mouse with its cord running back under the desk.
// The handle slides the tray in under the desk and out again.
import './tray.css';
import { h } from '../../editor/core/ui';
import { output } from '../../audio/output';
import { SANDBOX_COLORS } from '../../retro/bbs/bbsName';

const CGA = ['#000', '#00a', '#0a0', '#0aa', '#a00', '#a0a', '#a50', '#aaa', '#555', '#55f', '#5f5', '#5ff', '#f55', '#f5f', '#ff5', '#fff'];

let squeakCtx: AudioContext | undefined;

/** A rubbery squeak, the way the SQUEAK mouse would if it were a mouse. */
function squeak(): void {
  try {
    squeakCtx ??= new AudioContext();
    void squeakCtx.resume();
  } catch {
    return;
  }
  const ctx = squeakCtx;
  const out = output(ctx);
  const t = ctx.currentTime + 0.01;
  // two quick chirps, up and back down, with a little wobble
  for (const [start, len, top] of [
    [0, 0.11, 3900],
    [0.13, 0.16, 4400],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(2300, t + start);
    o.frequency.exponentialRampToValueAtTime(top, t + start + len * 0.45);
    o.frequency.exponentialRampToValueAtTime(2600, t + start + len);
    const wob = ctx.createOscillator();
    wob.frequency.value = 38;
    const depth = ctx.createGain();
    depth.gain.value = 120;
    wob.connect(depth).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t + start);
    g.gain.linearRampToValueAtTime(0.09, t + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + start + len);
    o.connect(g).connect(out);
    for (const n of [o, wob]) {
      n.start(t + start);
      n.stop(t + start + len + 0.02);
    }
  }
}

/** The mouse pad's print: THE -= S A N D B O X =- BBS's logon screen, night sky and dunes. */
function padArt(): HTMLElement {
  const letters = [...'SANDBOX']
    .map((c, i) => `<text x="${14 + i * 18.5}" y="38" fill="${CGA[SANDBOX_COLORS[i]]}">${c}</text>`)
    .join('');
  const stars = [[18, 10], [44, 6], [70, 14], [96, 8], [128, 12], [146, 5], [112, 22], [30, 20]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="#fff" opacity="0.8"/>`)
    .join('');
  const el = h('div', { class: 'pad-art', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 156 140" preserveAspectRatio="none">
    <defs><linearGradient id="pad-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2e"/><stop offset="1" stop-color="#23407c"/></linearGradient></defs>
    <rect width="156" height="140" fill="url(#pad-sky)"/>
    ${stars}
    <circle cx="132" cy="62" r="9" fill="#ffe7a0" opacity="0.9"/>
    <g font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="22" stroke="#000" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${letters}</g>
    <text x="78" y="54" text-anchor="middle" font-family="'Courier New', monospace" font-weight="700" font-size="11" fill="#ff5">-= B B S =-</text>
    <path d="M0 104 Q30 84 62 96 T120 92 T156 98 V140 H0 Z" fill="#b8863d"/>
    <path d="M0 116 Q40 100 84 112 T156 108 V140 H0 Z" fill="#e2bf78"/>
    <g fill="#9c6c2c"><rect x="18" y="80" width="26" height="18"/><rect x="14" y="74" width="8" height="10"/><rect x="40" y="74" width="8" height="10"/><rect x="26" y="70" width="10" height="12"/><path d="M28 98 v-8 a3 3 0 0 1 6 0 v8 z" fill="#5c3c14"/></g>
    <path d="M31 70 v-9 l7 3 -7 3" fill="#f55" stroke="#5c3c14" stroke-width="0.8"/>
    <text x="150" y="132" text-anchor="end" font-family="'Courier New', monospace" font-weight="700" font-size="9" fill="#3a2a10">1-412-555-SAND</text>
  </svg>`;
  return el;
}

function ballMouse(): HTMLElement {
  const mouse = h(
    'div',
    { class: 'ball-mouse', title: 'A two-button ball mouse' },
    h('span', { class: 'mouse-btn left' }),
    h('span', { class: 'mouse-btn right' }),
    h('span', { class: 'mouse-logo' }, 'SQUEAK'),
  );
  // a nudge (as if someone moved it) and a squeak; real clicks go to the screen
  mouse.addEventListener('click', () => {
    squeak();
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
        h('div', { class: 'mouse-pad' }, padArt(), h('span', { class: 'mouse-cord' }), ballMouse()),
      ),
      handle,
    ),
  );
  return tray;
}
