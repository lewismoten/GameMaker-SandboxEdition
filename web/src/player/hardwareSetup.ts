// Optional first-run setup around the player; choices stay outside native game data.
import './hardwareSetup.css';
import type { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import { h } from '../editor/core/ui';
import { hardwarePrefs, type GameHardware } from './hardwarePrefs';

export function hardwareSetup(container: HTMLElement, id: string, audio: AudioEngine) {
  const baseline = (): GameHardware => hardwarePrefs.game(id) ?? { sound: 'blaster', video: 'auto' };
  let disposed = false;
  let active: { dialog: HTMLDialogElement; finish(value?: GameHardware): void; result: Promise<GameHardware | undefined> } | undefined;
  const show = h('input', { type: 'checkbox', checked: hardwarePrefs.show(), onchange: () => hardwarePrefs.setShow(show.checked) });
  const controls = h(
    'div',
    { class: 'gm-hardware-launch' },
    h('label', null, show, 'Show setup on first run'),
    h('button', { type: 'button', onclick: () => void open() }, 'Video & audio…'),
  );
  container.append(controls);

  function open(): Promise<GameHardware | undefined> {
    if (disposed) return Promise.resolve(undefined);
    if (active) return active.result;
    const saved = baseline();
    const sound = h(
      'select',
      { 'aria-label': 'Sound and music' },
      h('option', { value: 'blaster' }, 'Sound Blaster'),
      h('option', { value: 'speaker' }, 'PC speaker only'),
    );
    sound.value = saved.sound;
    const video = h(
      'select',
      { 'aria-label': 'VGA chip type' },
      h('option', { value: 'auto' }, 'Auto-detect VGA'),
      h('option', { value: 'vga' }, 'Standard VGA'),
    );
    video.value = saved.video;
    const next = h('input', {
      type: 'checkbox',
      checked: hardwarePrefs.show(),
      onchange: () => {
        hardwarePrefs.setShow(next.checked);
        show.checked = next.checked;
      },
    });
    let resolve!: (value?: GameHardware) => void;
    const result = new Promise<GameHardware | undefined>((done) => {
      resolve = done;
    });
    const finish = (value?: GameHardware) => {
      dialog.close();
      dialog.remove();
      active = undefined;
      resolve(value);
    };
    const dialog = h(
      'dialog',
      { class: 'gm-hardware-dialog', 'aria-label': 'Video and audio setup' },
      h('h2', null, 'Video & audio setup'),
      h('p', null, 'Teddy says: check the settings before blaming the cables.'),
      h('label', null, 'Sound and music', sound),
      h('p', null, 'Sound Blaster: port 220h, IRQ 7. PC speaker: effects without music.'),
      h('label', null, 'VGA chip type', video),
      h('p', null, 'Both choices display 320 × 200 VGA. The browser handles chipset timing.'),
      h('label', { class: 'gm-setup-check' }, next, 'Show setup for games without saved settings'),
      h(
        'div',
        { class: 'gm-setup-buttons' },
        h(
          'button',
          {
            type: 'button',
            onclick: () => {
              void audio.resume().then(() => {
                if (!disposed && active?.dialog === dialog) audio.playSpeaker(new Array<number>(35).fill(660));
              });
            },
          },
          'Test speaker',
        ),
        h('button', { type: 'button', onclick: () => finish(saved) }, 'Bypass setup'),
        h(
          'button',
          {
            type: 'button',
            autofocus: true,
            onclick: () => {
              const value: GameHardware = { sound: sound.value === 'speaker' ? 'speaker' : 'blaster', video: video.value === 'vga' ? 'vga' : 'auto' };
              hardwarePrefs.save(id, value);
              finish(value);
            },
          },
          'Save settings',
        ),
      ),
    );
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(saved);
    });
    // Setup keys belong to the dialog, even inside a player waiting for its first key.
    dialog.addEventListener('keydown', (e) => e.stopPropagation());
    container.append(dialog);
    active = { dialog, finish, result };
    dialog.showModal();
    return result;
  }

  return {
    controls,
    async prepare(force = false): Promise<GameHardware | undefined> {
      const saved = hardwarePrefs.game(id);
      return force || (!saved && hardwarePrefs.show()) ? open() : disposed ? undefined : baseline();
    },
    dispose() {
      disposed = true;
      active?.finish();
      controls.remove();
    },
  };
}
