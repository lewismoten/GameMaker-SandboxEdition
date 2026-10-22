// The Sound Blaster switch on the right speaker's front, under the volume knob,: it puts the desk PC's sound card in or
// takes it out (retro/computer/soundBlaster.ts). Without the card, games and Game-Maker's
// designers play their sounds on the PC speaker and there is no music. Programs look for the
// card as they start, as PLAYGAME did, so a game already playing keeps its sound until the next.
import './blasterSwitch.css';
import { h, toast } from '../../editor/core/ui';
import { setSoundBlaster, soundBlaster } from '../../retro/computer/soundBlaster';

export function blasterSwitch(): HTMLElement {
  const el = h(
    'button',
    { class: 'sb-switch', type: 'button', role: 'switch', 'aria-label': 'Sound Blaster card' },
    h('span', { class: 'sb-print', 'aria-hidden': 'true' }, 'SOUND', h('br'), 'BLASTER'),
    h('span', { class: 'sb-track', 'aria-hidden': 'true' }, h('span', { class: 'sb-knob' })),
  );
  const show = () => {
    const on = soundBlaster();
    el.setAttribute('aria-checked', String(on));
    el.dataset.on = String(on);
    el.title = on ? 'Sound Blaster on: music and digital sound. Click to switch it off.' : 'Sound Blaster off: PC speaker only. Click to switch it on.';
  };
  el.addEventListener('click', () => {
    const on = !soundBlaster();
    setSoundBlaster(on);
    show();
    const playing = !!document.querySelector('.crt-game canvas');
    toast(
      (on ? 'Sound Blaster on: music and digital sound.' : 'Sound Blaster off: sounds play on the PC speaker, with no music.') +
        (playing ? ' The game playing now finds out when it is started again.' : ''),
    );
  });
  show();
  return el;
}
