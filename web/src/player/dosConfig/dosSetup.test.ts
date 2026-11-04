import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hardwarePrefs } from '../hardwarePrefs';
import { fromHardware } from './model';

const ask = vi.hoisted(() => vi.fn());
vi.mock('./screen', () => ({ askConfigData: ask }));
const { dosHardwareSetup } = await import('./dosSetup');
const machine = {} as never;

describe('the PC setup', () => {
  beforeEach(() => {
    ask.mockReset();
    hardwarePrefs.setShow(true);
  });
  it('shows the DOS screen for a game with nothing saved, and saves what it returns', async () => {
    ask.mockResolvedValue({ ...fromHardware(), sound: 0, vga: 3 });
    const setup = dosHardwareSetup(machine, 'dos-first');
    expect(setup.controls).toBeUndefined();
    const got = await setup.prepare();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(got).toMatchObject({ sound: 'speaker', video: 'vga' });
    expect(hardwarePrefs.game('dos-first')).toEqual(got);
  });
  it('skips the screen for a saved game, and when FASTPLAY is on', async () => {
    hardwarePrefs.save('dos-saved', { sound: 'speaker', video: 'auto' });
    expect(await dosHardwareSetup(machine, 'dos-saved').prepare()).toEqual({ sound: 'speaker', video: 'auto' });
    hardwarePrefs.setShow(false);
    expect(await dosHardwareSetup(machine, 'dos-fast').prepare()).toEqual({ sound: 'blaster', video: 'auto' });
    expect(ask).not.toHaveBeenCalled();
  });
  it('shows the screen again for CONFIG.BAT with the saved choices in it', async () => {
    hardwarePrefs.save('dos-bat', { sound: 'speaker', video: 'vga' });
    ask.mockImplementation((_m: unknown, s: unknown) => Promise.resolve(s));
    await dosHardwareSetup(machine, 'dos-bat').prepare(true);
    expect(ask.mock.calls[0][1]).toMatchObject({ sound: 0, vga: 1 });
  });
});
