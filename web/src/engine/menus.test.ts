import { describe, expect, it } from 'vitest';
import { gVertMenu } from './menus';
import { Keyboard } from '../input/keyboard';
import type { Machine } from './machine';

/** Just enough of a Machine for GVertMenu: a keyboard, a pointer and a frame clock. */
function fakeMachine(): Machine {
  let t = 0;
  const keyboard = new Keyboard();
  const pointer = { x: 0, y: 0, clicks: 0 };
  return {
    keyboard,
    pointer,
    screen: { getCol: () => 0, boxFill: () => undefined },
    now: () => t,
    frame: async () => void (t += 16),
    flushKeys: () => {
      keyboard.clear();
      pointer.clicks = 0;
    },
    takeClick: () => {
      const c = pointer.clicks > 0;
      pointer.clicks = 0;
      return c;
    },
  } as unknown as Machine;
}

const ENTER = 28;
const DOWN = 80;

describe('gVertMenu', () => {
  it('takes keys typed before it opened, as the C menu did (no keyboard flush)', async () => {
    const m = fakeMachine();
    m.keyboard.inject(DOWN, true);
    m.keyboard.inject(DOWN, false);
    m.keyboard.inject(ENTER, true);
    expect(await gVertMenu(m, 70, 121, 8, 6, 1, 30, 1, false)).toBe(2);
  });

  it('clears keys typed before it opened when asked to (menus opened mid-level)', async () => {
    const m = fakeMachine();
    m.keyboard.inject(ENTER, true);
    m.keyboard.inject(ENTER, false);
    const picked = gVertMenu(m, 70, 121, 8, 6, 1, 1, 3);
    expect(await picked).toBe(7); // idle: the stale Enter was dropped
  });

  it('takes a key pressed once it is up', async () => {
    const m = fakeMachine();
    const picked = gVertMenu(m, 70, 121, 8, 6, 1, 30, 1, false);
    await Promise.resolve();
    m.keyboard.inject(ENTER, true);
    expect(await picked).toBe(1);
  });
});
