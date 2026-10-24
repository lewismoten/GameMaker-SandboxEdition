// The room after dark, and the overhead light. By the room's clock (daylight.ts) the whole room
// darkens as night falls, more than the wall alone (blacklight.ts), so what gives light stands
// out: the screen (and its glow on the bezel, pc/screenGlow.ts), the desk lamp's pool, the LEDs,
// the black light on its poster, the moonlit window. The dark is one layer over the room with
// soft holes cut where those lights are (and under the props' captions, so they stay easy to
// read), found again each half second while it is dark. An LED only clears its own dot, and a
// glow layer over the dark paints a halo in the LED's own color round each one that is lit. A light switch on the wall beside the
// phone turns the overhead light on or off (remembered for the visit): on, the room is lit
// whatever the hour. Only on the wide stage, like the black light.
import { h } from '../../editor/core/ui';
import { watchDaylight } from '../room/daylight';
import { pressable, say } from './propKit';
import { roomSound } from './propSound';

const KEY = 'gm-overhead'; // "on" or "off" when the switch was flipped this visit
const chosen = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
};
const choose = (on: boolean) => {
  try {
    sessionStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode: for now only */
  }
};

/** How dark the room gets at full night, overhead light off. */
const NIGHT_DARK = 0.62;

/**
 * What gives light, and how far round it the dark lifts (as a share of its own size). A light
 * that things stand in front of (the lamp, the poster, the window) only clears its own box, so
 * the monitor or the case in front of it stays in the dark.
 */
const LIGHTS: { sel: string; spread: number; when?: (desk: HTMLElement) => boolean }[] = [
  { sel: '.crt', spread: 0.3, when: (d) => d.dataset.power === 'on' },
  { sel: '.lamp-glow.on', spread: 0 },
  { sel: '.bl-poster', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  // every poster on the wall glows under the black light
  { sel: '.wall-poster .wp-sheet', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  { sel: '.desk-scene > .poster', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  { sel: '.gm-box .retail', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  // white paper glows a light purple under the tube
  { sel: ':is(.news-clipping, .phone-notes, .sticky, .catalog-prop)', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  // and so do the game boxes' lettering and stickers (boxes/boxUv.ts): their own print keeps the rest dim
  { sel: '.game-shelf .shelf-box', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  // and the title on the printed label of the disk in front in the disk box (disks/diskLabel.css)
  { sel: '.disk-box .floppy.peek.front .label.printed .p-banner', spread: 0, when: (d) => d.classList.contains('bl-uv') },
  // the wall clock's lume numbers and hands, glowing under the black light or still charged
  { sel: '.wall-clock .wc-face', spread: 0, when: (d) => d.classList.contains('bl-uv') || !!d.querySelector('.wall-clock.wc-glowing') },
  // the night outside is as dark as it is, whatever the room's light: the window is never dimmed
  { sel: '.snow-window', spread: 0 },
  { sel: '.caption', spread: 0.4 },
  // the mail under the bedroom door (mailDrop.ts), in the hall light from the gap, so it can be found in the dark
  { sel: '.room-door .rd-mail', spread: 0.5 },
  // the switch has a little glowing lever, the way to find it in the dark
  { sel: '.light-switch', spread: 0.4 },
];

/** The LEDs: each clears only its own dot and glows its own color (`color`, else its fill). */
const LEDS: { sel: string; when?: (desk: HTMLElement) => boolean; color?: string; reach?: number }[] = [
  { sel: '.led.on' },
  { sel: '.monitor-led', when: (d) => d.dataset.power === 'on' },
  { sel: '.drive-led.on' },
  { sel: '.mled.on' },
  { sel: '.spk-led.on' },
  // the turbo readout's red digits light the case round them red
  { sel: '.seg-display.lit', color: 'rgb(255, 59, 43)', reach: 22 },
];

/** "rgb(r, g, b)" as "rgb(r g b / a)"; undefined for a color that isn't one. */
const withAlpha = (rgb: string, a: number): string | undefined => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  return m ? `rgb(${m[1]} ${m[2]} ${m[3]} / ${a})` : undefined;
};

export function roomLight(desk: HTMLElement): () => void {
  const scene = desk.querySelector<HTMLElement>('.desk-scene');
  if (!scene) return () => {};
  const dark = h('div', { class: 'room-dark', 'aria-hidden': 'true' });
  const glow = h('div', { class: 'room-glow', 'aria-hidden': 'true' });
  const plate = h('div', { class: 'light-switch' }, h('span', { class: 'ls-toggle' }));
  scene.append(dark, glow, plate);

  let light = 1;
  let on = chosen();
  let timer = 0;

  /** Cuts a soft hole in the dark round each light that is on, in the scene's own pixels. */
  const holes = () => {
    const s = scene.getBoundingClientRect();
    const k = s.width / scene.offsetWidth || 1;
    // the dark reaches past the scene (the wall either side): its box, in scene pixels
    const d = dark.getBoundingClientRect();
    const ox = (s.left - d.left) / k;
    const oy = (s.top - d.top) / k;
    const layers: string[] = [];
    for (const l of LIGHTS) {
      if (l.when && !l.when(desk)) continue;
      for (const el of desk.querySelectorAll<Element>(l.sel)) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cx = (r.left - s.left + r.width / 2) / k + ox;
        const cy = (r.top - s.top + r.height / 2) / k + oy;
        // as wide as the spread asks, or (no spread) only just round the light's own box
        const rx = l.spread ? ((r.width / k) * (1 + l.spread)) / 2 + 6 : (r.width / k / 2) * 1.12;
        const ry = l.spread ? ((r.height / k) * (1 + l.spread)) / 2 + 6 : (r.height / k / 2) * 1.12;
        layers.push(`radial-gradient(${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, transparent 55%, #000 100%)`);
      }
    }
    const halos: string[] = [];
    for (const l of LEDS) {
      if (l.when && !l.when(desk)) continue;
      for (const el of desk.querySelectorAll<Element>(l.sel)) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cx = (r.left - s.left + r.width / 2) / k + ox;
        const cy = (r.top - s.top + r.height / 2) / k + oy;
        const w = r.width / k / 2;
        const ht = r.height / k / 2;
        layers.push(`radial-gradient(${(w + 1).toFixed(1)}px ${(ht + 1).toFixed(1)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, transparent 70%, #000 100%)`);
        const color = l.color ?? getComputedStyle(el).backgroundColor;
        const inner = withAlpha(color, 0.55);
        if (!inner) continue;
        const rx = w + (l.reach ?? 10);
        const ry = ht + (l.reach ?? 10);
        halos.push(`radial-gradient(${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, ${inner}, transparent 100%)`);
      }
    }
    const mask = layers.length ? layers.join(', ') : 'none';
    dark.style.setProperty('mask-image', mask);
    dark.style.setProperty('-webkit-mask-image', mask);
    glow.style.backgroundImage = halos.join(', ');
  };

  const show = () => {
    const amount = on ? 0 : NIGHT_DARK * (1 - light);
    dark.style.opacity = amount.toFixed(3);
    glow.style.opacity = (amount / NIGHT_DARK).toFixed(3);
    desk.classList.toggle('rl-dark', amount > 0.2);
    desk.classList.toggle('rl-lit', on);
    plate.setAttribute('aria-checked', String(on));
    clearInterval(timer);
    if (amount > 0) {
      holes();
      timer = window.setInterval(holes, 500);
    }
  };

  const off = pressable(
    plate,
    'Overhead light',
    () => {
      on = !on;
      choose(on);
      roomSound.click();
      show();
      say(
        plate,
        on ? (light < 0.5 ? 'Click. The overhead light comes on.' : 'Click. In daylight you can hardly tell it’s on.') : 'Click. Overhead light off.',
        undefined,
        {
          beside: true,
        },
      );
    },
    { id: 'desk-light', title: '' },
  );
  plate.setAttribute('role', 'switch'); // (pressable makes it a button first)
  const stop = watchDaylight((l) => {
    light = l;
    show();
  });
  const onResize = () => !on && light < 1 && holes();
  addEventListener('resize', onResize);
  return () => {
    off();
    stop();
    clearInterval(timer);
    removeEventListener('resize', onResize);
    desk.classList.remove('rl-dark', 'rl-lit');
    dark.remove();
    glow.remove();
    plate.remove();
  };
}
