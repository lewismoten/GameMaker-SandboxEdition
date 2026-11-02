// The ⚙ menu's "Sound and tour…" dialog: Music, Voice, Sound effects and Games, each with an on/off
// switch and a 0-100 volume, plus the Tour switch (guides wait on every page that has a tour).
// Changes apply at once and are remembered (audio/mix.ts in the engine package; the tour's own
// 'gm-tour-on'). Escape or Done closes it and focus goes back to where it was opened from.
import './soundDialog.css';
import { CHANNELS, getMix, setChannel, type Channel } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { h, modal } from '../editor/core/ui';
import { allGuidesOn, setAllGuides } from '../tour/tourPages';

const TEXT: Record<Channel, [string, string]> = {
  music: ['Music', 'Songs on the pages, in the tour and in games'],
  voice: ['Voice', 'The guides in the tour, callers on the phone'],
  sfx: ['Sound effects', 'Bumps, barks, pickups and the rest, in games too'],
  games: ['Games', 'Everything a game plays (music, voices, effects), on top of Music and Sound effects'],
};

let n = 0;

function row(id: string, title: string, hint: string, on: boolean, onToggle: (on: boolean) => void, volume?: HTMLElement): HTMLElement {
  const sw = h<'input'>('input', {
    id: `${id}-on`,
    type: 'checkbox',
    role: 'switch',
    class: 'snd-switch',
    checked: on,
    'aria-describedby': `${id}-hint`,
    onchange: () => onToggle(sw.checked),
  });
  return h(
    'div',
    { class: 'snd-row' },
    h('label', { class: 'snd-name', for: `${id}-on` }, h('b', null, title), ' ', h('small', { id: `${id}-hint` }, hint)),
    sw,
    volume ?? h('span', { class: 'snd-novol' }),
  );
}

function volumeBox(id: string, title: string, c: Channel): HTMLElement {
  const v = getMix()[c].volume;
  const out = h('output', { class: 'snd-out', for: `${id}-vol` }, String(v));
  const slider = h<'input'>('input', {
    id: `${id}-vol`,
    type: 'range',
    min: '0',
    max: '100',
    step: '1',
    value: String(v),
    'aria-label': `${title} volume`,
    oninput: () => {
      out.textContent = slider.value;
      setChannel(c, { volume: Number(slider.value) });
    },
  });
  return h('span', { class: 'snd-vol' }, slider, out);
}

/** Opens the dialog; resolves when it closes. */
export function openSoundDialog(): Promise<void> {
  const from = document.activeElement as HTMLElement | null;
  const id = `snd-${++n}`;
  const done = modal<void>('Sound and tour', (close) =>
    h(
      'div',
      { class: 'snd-body' },
      ...CHANNELS.map((c) => {
        const [title, hint] = TEXT[c];
        return row(`${id}-${c}`, title, hint, getMix()[c].on, (on) => setChannel(c, { on }), volumeBox(`${id}-${c}`, title, c));
      }),
      row(`${id}-tour`, 'Tour', 'Guides wait on every page that has a tour', allGuidesOn(), (on) => {
        setAllGuides(on);
        void import('../tour/tourButton').then((m) => m.refreshGuides());
      }),
      h('div', { class: 'snd-foot' }, h('button', { type: 'button', class: 'primary', onclick: () => close(undefined) }, 'Done')),
    ),
  );
  return done.then(() => {
    // the menu that opened this is closed by now: the gear is the way back
    const gear = from?.isConnected && from.offsetParent ? from : document.querySelector<HTMLElement>('.topbar-gear[aria-label="Settings"]');
    gear?.focus();
  });
}
