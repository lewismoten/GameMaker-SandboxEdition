import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveSound } from './driveSounds';

vi.mock('../../editor/core/ui', () => ({ h: () => ({ dataset: {}, classList: { add: vi.fn(), remove: vi.fn() } }) }));
vi.mock('./driveSounds', () => ({ driveSound: vi.fn() }));

describe('CD tray', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const fakeDrive = () => {
    const classes = new Set<string>();
    const el = { classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) }, dataset: {} as Record<string, string> };
    return { drive: { el, setDisc: () => undefined, busy: vi.fn() } as never, classes };
  };

  it('spins up after insertion and skips spin-up after ejection', async () => {
    const { cdDrive, openTray } = await import('./caseParts');
    const drive = cdDrive(vi.fn());
    const cycle = async () => {
      const closed = openTray(drive, 1000);
      await vi.runAllTimersAsync();
      await closed;
    };
    vi.mocked(driveSound).mockClear();
    await cycle();
    drive.setDisc('Game-Maker SE 3.0');
    await vi.dynamicImportSettled();
    drive.setDisc(undefined);
    await cycle();
    await vi.dynamicImportSettled();
    expect(vi.mocked(driveSound).mock.calls.map(([kind]) => kind)).toEqual(['tray-open', 'tray-close', 'cd-spin', 'tray-open', 'tray-close']);
  });

  it('stays open for its wait, then closes by itself', async () => {
    const { closeTray, openTray, trayState, TRAY_SLIDE_MS, TRAY_WAIT_MS } = await import('./caseParts');
    const { drive, classes } = fakeDrive();
    void openTray(drive);
    expect(classes.has('open')).toBe(true);
    vi.advanceTimersByTime(TRAY_SLIDE_MS + TRAY_WAIT_MS - 100);
    expect(trayState(drive)).toBe('open');
    vi.advanceTimersByTime(200);
    expect(trayState(drive)).toBe('closing');
    vi.advanceTimersByTime(TRAY_SLIDE_MS);
    expect(trayState(drive)).toBe('closed');
    expect(classes.has('open')).toBe(false);
    closeTray(drive); // nothing to close
    expect(trayState(drive)).toBe('closed');
  });

  it('closes on a second press, and a press while it closes never sends it back out', async () => {
    const { closeTray, openTray, trayState, TRAY_SLIDE_MS } = await import('./caseParts');
    const { drive, classes } = fakeDrive();
    void openTray(drive);
    vi.advanceTimersByTime(TRAY_SLIDE_MS);
    closeTray(drive);
    expect(trayState(drive)).toBe('closing');
    void openTray(drive); // pressed again mid-close
    expect(trayState(drive)).toBe('closing');
    expect(classes.has('open')).toBe(false);
    vi.advanceTimersByTime(TRAY_SLIDE_MS);
    expect(trayState(drive)).toBe('closed');
  });
});
