// The Pi remote's "Pi sound" switch (off by default): while on, the Pi's SND lines play here
// (piSound.ts). Its click also starts the browser's audio. Off, a closed port or "SND stopall"
// stops everything. The audio engine and the catalog load only when it is first turned on.
import { h } from '../editor/core/ui';
import { unlock } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { parseSoundLine, type SoundEvent } from './soundLine';
import type { PiSound, SoundState } from './piSound';

interface SoundSwitch {
  /** The switch and its status line, for the page. */
  readonly button: HTMLButtonElement;
  readonly status: HTMLElement;
  /** Each log text from the Pi (after "LOG "). */
  line(text: string): void;
  /** The port closed: everything stops and the switch goes off. */
  disconnected(): void;
  /** Whether the sounds play here now. */
  isOn(): boolean;
  dispose(): void;
}

const LABEL = 'Pi sound';

export function soundSwitch(): SoundSwitch {
  let on = false;
  let player: PiSound | undefined;
  let loading = false;
  let pendingMusic: Extract<SoundEvent, { kind: 'music' }> | undefined;
  /** The game the Pi last started, kept while the switch is off so turning it on mid-game knows it. */
  let lastGame: SoundEvent | undefined;

  const label = h('span', { class: 'pi-sound-label' }, `${LABEL}: off`);
  const button = h(
    'button',
    { type: 'button', role: 'switch', 'aria-checked': 'false', class: 'pi-switch pi-sound', title: 'Play the Pi’s game sounds on this computer' },
    h('span', { class: 'pi-switch-knob', 'aria-hidden': 'true' }),
    label,
  );
  const status = h('p', { class: 'pi-sound-status', role: 'status' }, '');

  const show = (s: SoundState) => {
    if (!on) return;
    status.textContent =
      s.kind === 'playing'
        ? `Sound: ${s.title}.`
        : s.kind === 'unknown'
          ? 'Sound for this game isn’t available here.'
          : 'Sound is on. It plays when a game on the Pi plays one.';
  };

  async function load(): Promise<PiSound | undefined> {
    const [{ AudioEngine }, { PiSound }, files] = await Promise.all([
      import('@lewismoten/gamemaker-sandbox-engine/audio/engine'),
      import('./piSound'),
      import('../project/files'),
    ]);
    const engine = new AudioEngine();
    engine.setGame(true); // the Games volume, as the web player
    await engine.resume();
    return new PiSound(engine, { games: () => files.loadLeanCatalogList(), file: (g, name) => files.fetchGameFile(g, name) }, show);
  }

  function set(next: boolean): void {
    on = next;
    button.setAttribute('aria-checked', String(on));
    label.textContent = `${LABEL}: ${on ? 'on' : 'off'}`;
    if (!on) {
      pendingMusic = undefined;
      player?.stop();
      status.textContent = '';
      return;
    }
    show({ kind: 'waiting' });
    if (player) {
      if (lastGame) void player.handle(lastGame);
      return;
    }
    if (loading) return;
    loading = true;
    void load()
      .catch(() => undefined)
      .then((p) => {
        loading = false;
        player = p;
        if (!on) return;
        if (!p) {
          pendingMusic = undefined;
          status.textContent = 'Sound could not start in this browser.';
          return;
        }
        if (lastGame) void p.handle(lastGame);
        if (pendingMusic) void p.handle(pendingMusic);
        pendingMusic = undefined;
      });
  }

  button.addEventListener('click', () => {
    if (!on) unlock(); // inside the click, before any await (iOS and Chrome's autoplay rule)
    set(!on);
  });

  return {
    isOn: () => on,
    button,
    status,
    line(text) {
      const e = parseSoundLine(text);
      if (!e) return;
      if (e.kind === 'game') lastGame = e;
      if (e.kind === 'end') lastGame = undefined;
      if (!on) return;
      if (player) void player.handle(e);
      else if (e.kind === 'music') pendingMusic = e;
      else if (e.kind === 'game' || e.kind === 'end' || e.kind === 'musicStop' || e.kind === 'stopAll') pendingMusic = undefined;
    },
    disconnected() {
      lastGame = undefined;
      if (on) set(false);
    },
    dispose() {
      if (on) set(false);
    },
  };
}
