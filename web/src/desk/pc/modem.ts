// An external 14,400 bps modem on the desk. Click it to dial out (TERMINAL). Its front
// lights follow the call: MR when the PC is on, TR while the terminal runs, OH when it
// picks up the line, CD and HS once connected, RD and SD flickering with the data.
import { h } from '../../editor/core/ui';
import type { ModemSignal } from '../../retro/bbs/term';

const LIGHTS = ['HS', 'AA', 'CD', 'OH', 'RD', 'SD', 'TR', 'MR'] as const;
type Light = (typeof LIGHTS)[number];

export interface DeskModem {
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
  const el = h(
    'button',
    { class: 'prop modem', onclick: onClick, 'aria-label': 'Modem: dial a BBS', title: 'Click to dial a BBS' },
    h('div', { class: 'modem-body' }, h('span', { class: 'modem-brand' }, 'DATA/FAX 14,400'), panel),
    h('span', { class: 'caption' }, 'Modem — dial a BBS'),
  );
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
        for (const l of ['OH', 'CD', 'HS', 'RD', 'SD'] as const) set(l, false);
        break;
      case 'off':
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
