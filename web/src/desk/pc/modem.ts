// An external modem on the desk. Click it to dial out (TERMINAL); click the speed on its
// front to pick the line speed (300 baud to Unlimited, retro/bbs/lineSpeed.ts), which the BBS
// text and downloads then take. Its front lights follow the call: MR when the PC is on, TR
// while the terminal runs, OH when it picks up the line, CD and HS once connected, RD and SD
// flickering with the data. A long wait on a slow line earns a hint, once a call, pointing
// at the speed.
import { h } from '../../editor/core/ui';
import type { ModemSignal } from '../../retro/bbs/term';
import { hintText, SPEED_TEXT, speedLabel, speedWords, timeWarp, WARP_TEXT } from '../../retro/bbs/lineSpeed';
import { speedRadios } from '../../retro/bbs/lineSpeedControls';
import { cover } from '../props/propKit';

const LIGHTS = ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR', 'MR'] as const;
type Light = (typeof LIGHTS)[number];

/** How long the hint stays up. */
const HINT_MS = 14_000;

interface DeskModem {
  el: HTMLElement;
  /** MR: the modem has power (follows the PC). */
  power(on: boolean): void;
}

export function deskModem(onClick: () => void): DeskModem {
  const leds = new Map<Light, HTMLElement>();
  const panel = h(
    'div',
    { class: 'modem-lights' },
    ...LIGHTS.map((name) => {
      const led = h('span', { class: 'mled' });
      leds.set(name, led);
      return h('span', { class: 'mlight' }, led, h('small', null, name));
    }),
  );
  // a button over it, so the lights' letters aren't read as its name
  const dial = h(
    'div',
    { class: 'modem-dial', onclick: onClick },
    h('div', { class: 'modem-body' }, panel),
    h('span', { class: 'caption' }, 'Modem — dial a BBS'),
  );
  cover(dial, 'Modem: dial a BBS', 'Click to dial a BBS');

  // the speed on the front: its own button, opening a little menu of speeds
  const brand = h('span', null);
  const speed = h('button', { type: 'button', class: 'modem-speed', 'aria-haspopup': 'true', 'aria-expanded': 'false' }, brand);
  const menu = h('div', { class: 'modem-menu', hidden: true }, speedRadios());
  // the hint: how slow this really was, and two ways out: skip this wait, or change the speed
  const hintWords = h('p', null);
  const warpBtn = h('button', { type: 'button', class: 'modem-hint-warp' }, `⏩ ${WARP_TEXT}`);
  const speedBtn = h('button', { type: 'button' }, SPEED_TEXT);
  const hint = h(
    'div',
    { class: 'modem-hint', role: 'group', 'aria-label': 'Slow line', hidden: true },
    hintWords,
    h('div', { class: 'modem-hint-actions' }, warpBtn, speedBtn),
  );
  const hintLive = h('div', { class: 'modem-hint-live', role: 'status', 'aria-live': 'polite' }, hint);
  const el = h('div', { class: 'prop modem' }, dial, speed);
  // the menu and the hint live on the page, over the room, so the room's lighting never dims them
  document.body.append(menu, hintLive);
  /** Under the modem (above it if there is no room), inside the window. */
  const place = (pop: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const gutter = 16;
    const w = pop.offsetWidth;
    const ht = pop.offsetHeight;
    pop.style.left = `${Math.max(gutter, Math.min(innerWidth - gutter - w, r.left))}px`;
    const below = r.bottom + 8;
    pop.style.top = `${below + ht <= innerHeight - gutter ? below : Math.max(gutter, r.top - 8 - ht)}px`;
  };

  const showSpeed = () => {
    brand.textContent = `DATA/FAX ${speedLabel()}`;
    const name = `DATA/FAX ${speedLabel()}: the modem's speed, ${speedWords()}. Change it`;
    speed.setAttribute('aria-label', name);
    speed.title = name;
  };
  showSpeed();

  let hintTimer = 0;
  const hideHint = () => {
    clearTimeout(hintTimer);
    hint.hidden = true;
  };
  const open = (on: boolean, focus = on) => {
    menu.hidden = !on;
    speed.setAttribute('aria-expanded', String(on));
    el.classList.toggle('menu-open', on);
    if (on) {
      hideHint();
      place(menu);
      if (focus) menu.querySelector<HTMLInputElement>('input:checked')?.focus();
    }
  };
  speed.addEventListener('click', () => open(menu.hidden));
  speedBtn.addEventListener('click', () => open(true));
  warpBtn.addEventListener('click', () => {
    hideHint();
    timeWarp();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    open(false);
    speed.focus();
  });
  // a choice made with the mouse closes it; the arrow keys move through the speeds and keep it open
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('label') && (e as MouseEvent).detail > 0) {
      open(false);
      speed.focus();
    }
  });
  const inside = (n: Node | null) => !!n && (el.contains(n) || menu.contains(n) || hint.contains(n));
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !inside(e.target as Node)) open(false, false);
  });
  menu.addEventListener('focusout', (e) => {
    if (!menu.hidden && e.relatedTarget && !inside(e.relatedTarget as Node)) open(false, false);
  });
  // the desk moved under them: they go
  const away = () => {
    if (!menu.hidden) open(false, false);
    hideHint();
  };
  addEventListener('resize', away);
  addEventListener('scroll', away, true);
  addEventListener('gm-line-speed', showSpeed);
  addEventListener('gm-line-hint', () => {
    if (!el.isConnected) {
      // this desk is gone: its pop-ups go too
      menu.remove();
      hintLive.remove();
      return;
    }
    if (!menu.hidden) return;
    hintWords.textContent = hintText();
    hint.hidden = false;
    place(hint);
    clearTimeout(hintTimer);
    hintTimer = window.setTimeout(hideHint, HINT_MS);
  });

  const set = (name: Light, on: boolean) => leds.get(name)?.classList.toggle('on', on);
  const flash = (name: Light) => {
    set(name, true);
    setTimeout(() => set(name, false), 60 + Math.random() * 60);
  };
  const onSignal = (e: Event) => {
    const signal = (e as CustomEvent<ModemSignal>).detail;
    switch (signal) {
      case 'ready':
        set('TR', true);
        break;
      case 'offhook':
        set('OH', true);
        break;
      case 'carrier':
        set('CD', true);
        set('HS', true);
        break;
      case 'receive':
        if (leds.get('CD')?.classList.contains('on')) flash('RD');
        break;
      case 'send':
        if (leds.get('CD')?.classList.contains('on')) flash('SD');
        break;
      case 'hangup':
        hideHint();
        for (const l of ['OH', 'CD', 'HS', 'RD', 'SD'] as const) set(l, false);
        break;
      case 'off':
        hideHint();
        for (const l of ['TR', 'OH', 'CD', 'HS', 'RD', 'SD'] as const) set(l, false);
        break;
    }
  };
  window.addEventListener('gm-modem', onSignal);
  return {
    el,
    power(on) {
      set('MR', on);
      if (!on) for (const l of LIGHTS) set(l, false);
    },
  };
}
