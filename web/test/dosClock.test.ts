// TIME commands reach the shared room clock, including prompts, invalid input and reset.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Shell } from '../src/retro/dos/shell';
import { deskClockSet, deskNow, resetDeskClock } from '../src/retro/dos/deskClock';
import { FileSystem } from '../src/retro/dos/vfs';
import { TextKeys } from '../src/retro/text/textInput';
import type { TextScreen } from '../src/retro/text/textScreen';
import { daylight } from '../src/desk/room/daylight';

const real = new Date(1994, 9, 23, 14, 5, 6, 780);
function pc() {
  const screen = {
    text: '',
    cursorX: 0,
    cursorY: 0,
    print(t: string) {
      this.text += t;
    },
  };
  const keys = new TextKeys();
  const shell = new Shell({ screen: screen as unknown as TextScreen, keys, fs: new FileSystem(), run: async () => {} });
  const run = async (command: string) => {
    screen.text = '';
    await shell.execute(command);
    return screen.text;
  };
  return { run, keys };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(real);
  resetDeskClock();
});
afterEach(() => {
  resetDeskClock();
  vi.useRealTimers();
});

describe('DOS room clock', () => {
  it('sets numeric and named hours through COMMAND.COM and updates daylight', async () => {
    const { run } = pc();
    for (const [input, hour, minute] of [
      ['1pm', 13, 0],
      ['2pm', 14, 0],
      ['00', 0, 0],
      ['23', 23, 0],
      ['DUSK', 16, 54],
    ] as const) {
      expect(await run(`TIME ${input}`)).toBe('');
      const d = deskNow();
      expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([hour, minute, 0, 0]);
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([1994, 9, 23]);
    }
    expect(daylight()).toBeCloseTo(0.5);
    await run('TIME night');
    expect(daylight()).toBe(0);
    await run('TIME day');
    expect(daylight()).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(deskNow().getSeconds()).toBe(5);
  });

  it('retries invalid prompt input and keeps or resets the chosen time', async () => {
    const { run, keys } = pc();
    keys.type('not-a-time\ndusk\n');
    expect(await run('TIME')).toContain('Invalid time');
    expect(deskNow().getHours()).toBe(16);
    keys.type('\n');
    await run('TIME');
    expect(deskNow().getHours()).toBe(16);
    const before = deskNow().getTime();
    expect(await run('TIME 25')).toContain('Invalid time');
    expect(deskNow().getTime()).toBe(before);
    keys.type('RESET\n');
    expect(await run('TIME')).toContain('the real local time');
    expect(deskNow()).toEqual(real);
    expect(deskClockSet()).toBe(false);
    await run('TIME midnight');
    await run('TIME /LOCAL');
    expect(deskNow()).toEqual(real);
  });

  it('documents shortcuts without changing the clock or DATE help', async () => {
    const { run } = pc();
    const help = await run('TIME /?');
    expect(help).toContain('1pm, 2pm, 00, 23');
    expect(help).toContain('dusk, sunset, evening, night, midnight');
    expect(await run('DATE /?')).not.toContain('dusk');
    expect(deskNow()).toEqual(real);
    expect(deskClockSet()).toBe(false);
  });
});
