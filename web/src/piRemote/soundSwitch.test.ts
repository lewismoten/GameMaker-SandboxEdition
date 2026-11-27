// Drive the switch while the browser is still resuming its audio context.
import { expect, it, vi } from 'vitest';
import { soundSwitch } from './soundSwitch';

const audio = vi.hoisted(() => ({ resume: vi.fn<() => Promise<void>>(), playSong: vi.fn() }));
vi.mock('../editor/core/ui', () => ({
  h: () => Object.assign(new EventTarget(), { setAttribute: vi.fn() }),
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/context', () => ({ unlock: vi.fn() }));
vi.mock('@lewismoten/gamemaker-sandbox-engine/audio/engine', () => ({
  AudioEngine: class {
    setGame = vi.fn();
    stopAll = vi.fn();
    resume = audio.resume;
    playSong = audio.playSong;
  },
}));
vi.mock('../project/files', () => ({
  loadLeanCatalogList: () => Promise.resolve([{ id: 'dice', gam: 'dice.gam', title: 'Dice' }]),
  fetchGameFile: () => Promise.resolve(Uint8Array.of(1)),
}));

it.each(['start', 'music stop', 'stopall', 'end', 'game DICE DICE.GAM', 'disconnect'])('honors %s while audio is resuming', async (last) => {
  vi.clearAllMocks();
  let resume!: () => void;
  audio.resume.mockReturnValue(new Promise<void>((resolve) => (resume = resolve)));
  const control = soundSwitch();
  control.button.dispatchEvent(new Event('click'));
  await vi.waitFor(() => expect(audio.resume).toHaveBeenCalled());
  control.line('SND game DICE DICE.GAM');
  control.line('SND music start DICE/DICE.CMF');
  if (last === 'disconnect') {
    control.disconnected();
    control.button.dispatchEvent(new Event('click'));
  } else if (last !== 'start') {
    control.line(`SND ${last}`);
  }
  // A fresh game line after initialization gives canceled cases an observable completion signal.
  resume();
  await vi.dynamicImportSettled();
  if (last === 'disconnect' || last === 'end') control.line('SND game DICE DICE.GAM');
  await vi.waitFor(() => expect(control.status.textContent).toBe('Sound: Dice.'));
  expect(audio.playSong).toHaveBeenCalledTimes(last === 'start' ? 1 : 0);
});
