// The Pi remote's wire format matches sandbox-kernel's scripts/usb_kernel.py: the same lines
// (f'KEY {code} {state}\n', b'INFO\n', f'RUN {name}\n') and its KEYS table of Linux codes.
import { describe, expect, it } from 'vitest';
import { classify, INFO_LINE, keyLine, LineSplitter, PI_USB_FILTER, runLine } from './protocol';
import { LINUX_KEYS, MAIN_ROWS, EDIT_ROWS, ARROW_ROWS, NUMPAD_ROWS } from './keymap';
import { HeldKeys } from './heldKeys';

/** usb_kernel.py's KEYS, by name. */
const PY_KEYS = { esc: 1, q: 16, enter: 28, space: 57, up: 103, left: 105, right: 106, down: 108 };
const bytes = (s: string) => new TextEncoder().encode(s);

describe('Pi remote protocol', () => {
  it('writes KEY lines as usb_kernel.py does', () => {
    expect(keyLine(108, 'down')).toBe('KEY 108 down\n');
    expect(keyLine(108, 'up')).toBe('KEY 108 up\n');
    expect(keyLine(28, 'down') + keyLine(28, 'up')).toBe('KEY 28 down\nKEY 28 up\n');
    expect(() => keyLine(0, 'down')).toThrow(RangeError);
    expect(() => keyLine(768, 'up')).toThrow(RangeError);
    expect(() => keyLine(1.5, 'up')).toThrow(RangeError);
  });

  it('uses the same Linux codes as usb_kernel.py', () => {
    expect({
      esc: LINUX_KEYS.Escape,
      q: LINUX_KEYS.KeyQ,
      enter: LINUX_KEYS.Enter,
      space: LINUX_KEYS.Space,
      up: LINUX_KEYS.ArrowUp,
      left: LINUX_KEYS.ArrowLeft,
      right: LINUX_KEYS.ArrowRight,
      down: LINUX_KEYS.ArrowDown,
    }).toEqual(PY_KEYS);
    // spot checks against input-event-codes.h
    expect([LINUX_KEYS.Digit1, LINUX_KEYS.Digit0, LINUX_KEYS.KeyA, LINUX_KEYS.KeyZ, LINUX_KEYS.KeyY, LINUX_KEYS.KeyN]).toEqual([2, 11, 30, 44, 21, 49]);
    expect([LINUX_KEYS.F1, LINUX_KEYS.F10, LINUX_KEYS.F11, LINUX_KEYS.F12, LINUX_KEYS.Numpad7, LINUX_KEYS.Delete]).toEqual([59, 68, 87, 88, 71, 111]);
  });

  it('gives every on-screen key a code the kernel takes, once each', () => {
    const keys = [...MAIN_ROWS, ...EDIT_ROWS, ...ARROW_ROWS, ...NUMPAD_ROWS].flat().filter((k) => k !== null);
    for (const k of keys) expect(LINUX_KEYS[k.code], k.code).toBeGreaterThan(0);
    expect(new Set(keys.map((k) => k.code)).size).toBe(keys.length);
    // the main block's rows are all 15 units wide, after Esc and the function keys
    for (const row of MAIN_ROWS.slice(1)) expect(row.reduce((n, k) => n + (k.width ?? 1), 0)).toBe(15);
  });

  it('writes INFO and RUN lines', () => {
    expect(INFO_LINE).toBe('INFO\n');
    expect(runLine('GMOS.ELF')).toBe('RUN GMOS.ELF\n');
    expect(() => runLine('gmos.elf')).toThrow(RangeError);
    expect(() => runLine('TOOLONGNAME.ELF')).toThrow(RangeError);
  });

  it('asks for the kernel’s USB device', () => {
    expect(PI_USB_FILTER).toEqual({ usbVendorId: 0xcafe, usbProductId: 0x4011 });
  });

  it('splits lines however the reads break them', () => {
    const s = new LineSplitter();
    expect(s.push(bytes('LOG GMOS ch'))).toEqual([]);
    expect(s.push(bytes('ose X\r\nOK key 108 do'))).toEqual(['LOG GMOS chose X']);
    expect(s.push(bytes('wn\nINFO 2 a=1\n'))).toEqual(['OK key 108 down', 'INFO 2 a=1']);
  });

  it('sorts replies', () => {
    const info = classify('INFO 2 zero-w armv6 ABI=1.0 active=1 confirmed=12 pending=0');
    expect(info).toMatchObject({ kind: 'info', fields: { ABI: '1.0', confirmed: '12' } });
    expect(classify('LOG GMOS quit')).toEqual({ kind: 'log', text: 'GMOS quit' });
    expect(classify('OK key 103 down').kind).toBe('ok');
    expect(classify('ERR input no-device').kind).toBe('error');
    expect(classify('READY 1024').kind).toBe('other');
  });
});

describe('Pi remote held keys', () => {
  it('sends one down and one up however many things hold a key', () => {
    const held = new HeldKeys();
    expect(held.press(103, 'screen')).toEqual({ code: 103, state: 'down' });
    expect(held.press(103, 'physical')).toBeUndefined();
    expect(held.release(103, 'screen')).toBeUndefined();
    expect(held.release(103, 'screen')).toBeUndefined();
    expect(held.release(103, 'physical')).toEqual({ code: 103, state: 'up' });
    expect(held.isHeld(103)).toBe(false);
  });

  it('lets go of one holder’s keys, or all of them', () => {
    const held = new HeldKeys();
    held.press(42, 'latch');
    held.press(30, 'physical');
    held.press(31, 'screen');
    expect(held.releaseAll('latch')).toEqual([{ code: 42, state: 'up' }]);
    expect(held.releaseAll()).toEqual([
      { code: 30, state: 'up' },
      { code: 31, state: 'up' },
    ]);
  });
});
