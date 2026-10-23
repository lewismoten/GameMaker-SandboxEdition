// The keyboard tray: a slide-out shelf under the desk top holding the keyboard and, on
// its mouse pad, a two-button ball mouse with its cord running back under the desk. The
// mouse is the PC's mouse: drag it around the pad to move the pointer, press it to click.
// The handle slides the tray in under the desk and out again.
import './tray.css';
import { h } from '../../editor/core/ui';
import { output } from '../../audio/output';
import { audioContext, unlock } from '../../audio/context';
import { SANDBOX_COLORS } from '../../retro/bbs/bbsName';
import { deskMouse } from '../../input/deskMouse';

const CGA = ['#000', '#00a', '#0a0', '#0aa', '#a00', '#a0a', '#a50', '#aaa', '#555', '#55f', '#5f5', '#5ff', '#f55', '#f5f', '#ff5', '#fff'];

let squeakCtx: AudioContext | undefined;

/** A rubbery squeak, the way the SQUEAK mouse would if it were a mouse. */
function squeak(): void {
  try {
    squeakCtx ??= audioContext();
    if (!squeakCtx) return;
    unlock();
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

/** The pad and the mouse, in the pad's own (untilted) pixels. */
const PAD_W = 156;
const PAD_H = 140;
const MOUSE_W = 42;
const MOUSE_H = 66;
/** Where the cord runs off the back of the pad, on under the desk to the PC. */
const CORD_FROM = [100, -56] as const;
/** PC screen pixels the pointer moves per pad pixel rolled: one sweep of the pad crosses the screen. */
const SPEED = 3;
/** The buttons are the top of the mouse; below them is the body you push it around by. */
const BUTTONS_H = 26;
const MOUSE_KEY = 'gm-desk-mouse';

const clampX = (x: number) => Math.max(0, Math.min(PAD_W - MOUSE_W, x));
const clampY = (y: number) => Math.max(0, Math.min(PAD_H - MOUSE_H, y));

function loadMouse(): { x: number; y: number } {
  try {
    const v = JSON.parse(localStorage.getItem(MOUSE_KEY) ?? 'null') as { x?: unknown; y?: unknown } | null;
    if (v && typeof v.x === 'number' && typeof v.y === 'number' && Number.isFinite(v.x + v.y)) return { x: clampX(v.x), y: clampY(v.y) };
  } catch {
    // parked where it always was
  }
  return { x: 98, y: 58 };
}

function saveMouse(p: { x: number; y: number }): void {
  try {
    localStorage.setItem(MOUSE_KEY, JSON.stringify({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
  } catch {
    // it just won't stay put next time
  }
}

/**
 * The mouse pad with a two-button ball mouse on it. Drag the mouse around the pad (it stays
 * on it) and the PC's pointer moves with it; press its left or right button (or tap it, or
 * right-click it) to click. Grab it by a button and drag to drag with that button held; a
 * long press on the body holds the button under your finger, too.
 */
function mousePad(): HTMLElement {
  let pos = loadMouse();
  const NS = 'http://www.w3.org/2000/svg';
  const cordSvg = document.createElementNS(NS, 'svg');
  cordSvg.setAttribute('class', 'mouse-cord');
  cordSvg.setAttribute('aria-hidden', 'true');
  const cord = document.createElementNS(NS, 'path');
  cordSvg.append(cord);
  const mouse = h(
    'div',
    {
      class: 'ball-mouse',
      role: 'button',
      tabindex: '0',
      'aria-label': "The PC's mouse: drag it on the pad to move the pointer; Enter clicks, arrow keys roll it",
      title: "Drag the mouse to move the PC's pointer; press its left or right button to click",
    },
    h('span', { class: 'mouse-btn left' }),
    h('span', { class: 'mouse-btn right' }),
    h('span', { class: 'mouse-logo' }, 'SQUEAK'),
  );
  const pad = h('div', { class: 'mouse-pad' }, padArt(), cordSvg, mouse);

  const place = () => {
    mouse.style.left = `${pos.x}px`;
    mouse.style.top = `${pos.y}px`;
    // the cord leaves the top of the mouse straight back, then curves away to the PC
    const ex = pos.x + MOUSE_W / 2;
    const ey = pos.y + 1;
    const [ax, ay] = CORD_FROM;
    const reach = Math.max(18, (ey - ay) * 0.45);
    cord.setAttribute('d', `M${ex} ${ey} C${ex} ${ey - reach} ${ax} ${ay + reach} ${ax} ${ay}`);
  };
  place();

  /** Rolls the mouse by (dx, dy) pad pixels with these buttons down. */
  const roll = (dx: number, dy: number, buttons: number) => {
    pos = { x: clampX(pos.x + dx), y: clampY(pos.y + dy) };
    place();
    // pushed against the pad's edge it still rolls (the pad slides along with it), so the
    // pointer can always reach the whole screen
    deskMouse(dx * SPEED, dy * SPEED, buttons);
  };
  const press = (buttons: number) => {
    if (buttons) {
      squeak();
      mouse.dataset.down = buttons === 2 ? 'right' : 'left';
    } else delete mouse.dataset.down;
    deskMouse(0, 0, buttons);
  };
  const click = (button: number) => {
    press(button);
    press(0);
  };

  let drag: { id: number; x: number; y: number; sx: number; sy: number; moved: boolean; side: number; buttons: number; hold?: ReturnType<typeof setTimeout> } | undefined;
  mouse.addEventListener('mousedown', (e) => e.preventDefault()); // leaves the keyboard on the PC
  mouse.addEventListener('contextmenu', (e) => e.preventDefault());
  mouse.addEventListener('pointerdown', (e) => {
    if (drag || (e.button !== 0 && e.button !== 2)) return;
    e.preventDefault();
    mouse.setPointerCapture(e.pointerId);
    const r = mouse.getBoundingClientRect();
    const side = e.button === 2 || e.clientX > r.left + r.width / 2 ? 2 : 1;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, side, buttons: 0 };
    const d = drag;
    if (e.button === 2 || e.clientY < r.top + (r.height * BUTTONS_H) / MOUSE_H) {
      d.buttons = side;
      press(side);
    } else
      d.hold = setTimeout(() => {
        if (drag !== d || d.moved) return;
        d.buttons = d.side;
        press(d.side);
      }, 450);
  });
  mouse.addEventListener('pointermove', (e) => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    clearTimeout(d.hold);
    // the pad is tilted away: turn screen pixels back into pad pixels
    const r = pad.getBoundingClientRect();
    roll(((e.clientX - d.x) * PAD_W) / r.width, ((e.clientY - d.y) * PAD_H) / r.height, d.buttons);
    d.x = e.clientX;
    d.y = e.clientY;
  });
  const end = (e: PointerEvent) => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    drag = undefined;
    clearTimeout(d.hold);
    if (d.buttons) press(0);
    else if (!d.moved && e.type === 'pointerup') click(d.side);
    if (d.moved) saveMouse(pos);
  };
  mouse.addEventListener('pointerup', end);
  mouse.addEventListener('pointercancel', end);
  mouse.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 12 : 3;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) {
      roll(...arrows[e.key], 0);
      saveMouse(pos);
    } else if (e.key === 'Enter' || e.key === ' ') click(1);
    else if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) click(2);
    else return;
    e.preventDefault();
    e.stopPropagation(); // not typed on the PC as well
  });
  return pad;
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
        mousePad(),
      ),
      handle,
    ),
  );
  return tray;
}
