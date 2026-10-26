// The on-screen keys: names, presses, a one-shot Shift and a held Ctrl.
import { beforeAll, describe, expect, it } from 'vitest';
import { keyFor, modifierOf, VirtualKeys } from '../src/input/virtualKeys';

// Node has EventTarget but no KeyboardEvent: a stand-in that keeps its init.
beforeAll(() => {
  if (typeof KeyboardEvent === 'undefined')
    (globalThis as Record<string, unknown>).KeyboardEvent = class extends Event {
      constructor(type: string, init: KeyboardEventInit) {
        super(type, init);
        Object.assign(this, {
          key: init.key,
          code: init.code,
          shiftKey: !!init.shiftKey,
          ctrlKey: !!init.ctrlKey,
          altKey: !!init.altKey,
          repeat: !!init.repeat,
        });
      }
    };
});

function recorder() {
  const t = new EventTarget();
  const log: string[] = [];
  for (const type of ['keydown', 'keyup'])
    t.addEventListener(type, (e) => {
      const k = e as KeyboardEvent;
      log.push(`${type === 'keydown' ? '+' : '-'}${k.code}:${k.key}${k.shiftKey ? ':S' : ''}${k.ctrlKey ? ':C' : ''}`);
    });
  return { t, log };
}

describe('virtual keys', () => {
  it('names keys as a US keyboard does', () => {
    expect(keyFor('KeyA')).toBe('a');
    expect(keyFor('KeyA', true)).toBe('A');
    expect(keyFor('KeyA', false, true)).toBe('A');
    expect(keyFor('KeyA', true, true)).toBe('a');
    expect(keyFor('Digit1', true)).toBe('!');
    expect(keyFor('F4')).toBe('F4');
    expect(keyFor('Numpad7')).toBe('7');
    expect(keyFor('NumpadEnter')).toBe('Enter');
    expect(keyFor('Space')).toBe(' ');
    expect(modifierOf('ShiftRight')).toBe('shift');
    expect(modifierOf('KeyS')).toBeUndefined();
  });

  it('presses and lets go of a key', () => {
    const { t, log } = recorder();
    const v = new VirtualKeys(() => t);
    v.press('F4');
    v.press('F4'); // already down
    v.release('F4');
    expect(log).toEqual(['+F4:F4', '-F4:F4']);
  });

  it('keeps a clicked Shift down for the next key only', () => {
    const { t, log } = recorder();
    const v = new VirtualKeys(() => t);
    v.press('ShiftLeft');
    v.release('ShiftLeft');
    expect(v.modifiers().has('ShiftLeft')).toBe(true);
    v.press('KeyA');
    v.release('KeyA');
    v.press('KeyB');
    v.release('KeyB');
    expect(log).toEqual(['+ShiftLeft:Shift:S', '+KeyA:A:S', '-KeyA:A:S', '-ShiftLeft:Shift', '+KeyB:b', '-KeyB:b']);
  });

  it('lets go of a held Ctrl when its finger lifts', () => {
    const { t, log } = recorder();
    const v = new VirtualKeys(() => t);
    v.press('ControlLeft');
    v.press('KeyC');
    v.release('KeyC');
    v.release('ControlLeft');
    expect(log).toEqual(['+ControlLeft:Control:C', '+KeyC:c:C', '-KeyC:c:C', '-ControlLeft:Control']);
  });

  it('a second click lets go of a latched modifier', () => {
    const { t, log } = recorder();
    const v = new VirtualKeys(() => t);
    v.press('AltLeft');
    v.release('AltLeft');
    v.press('AltLeft');
    v.release('AltLeft');
    expect(log.length).toBe(2);
    expect(v.modifiers().size).toBe(0);
  });
});
