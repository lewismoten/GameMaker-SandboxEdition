import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./driveSounds', () => ({ driveSound: vi.fn() }));

describe('CD tray', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const fakeDrive = () => {
    const classes = new Set<string>();
    const el = { classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) }, dataset: {} as Record<string, string> };
    return { drive: { el, setDisc: () => undefined, busy: vi.fn() } as never, classes };
  };

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
