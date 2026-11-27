// Leaving the desk during RESET disposes the PC while the reset timer is pending.
import { expect, it, vi } from 'vitest';
import { Computer } from './computer';

vi.mock('./computer/folders', () => ({
  ComputerFolders: class {
    powered = true;
    keys = { abort: vi.fn(), resume: vi.fn() };
    shell = { stop: vi.fn(), reset: vi.fn() };
    dispose() {}
  },
}));

it('cancels a pending reset when the desk disposes the PC', async () => {
  vi.useFakeTimers();
  try {
    const pc = Reflect.construct(Computer, []) as Computer;
    const resume = vi.spyOn(pc.keys, 'resume');
    const powerOn = vi.spyOn(pc, 'powerOn').mockResolvedValue();
    const reset = pc.reset();
    pc.powerOff();
    pc.dispose();
    await vi.advanceTimersByTimeAsync(300);
    await reset;
    expect([resume.mock.calls.length, powerOn.mock.calls.length]).toEqual([0, 0]);
  } finally {
    vi.useRealTimers();
  }
});
