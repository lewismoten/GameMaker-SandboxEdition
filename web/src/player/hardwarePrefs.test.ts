// First-run hardware policy is per game, backup-aware and usable without persistent storage.
import { describe, expect, it } from 'vitest';
import { fromHardware } from './dosConfig/model';
import { HardwarePrefs } from './hardwarePrefs';

function fixture() {
  let raw: string | null = null;
  const store = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  return {
    prefs: new HardwarePrefs(() => store),
    store,
    replace: (value: string | null) => {
      raw = value;
    },
  };
}

describe('first-run hardware preferences', () => {
  it('starts with setup enabled and remembers independent per-game choices across instances', () => {
    const { prefs, store } = fixture();
    expect(prefs.show()).toBe(true);
    expect(prefs.game('one')).toBeUndefined();
    prefs.save('one', { sound: 'speaker', video: 'vga' });
    prefs.save('two', { sound: 'blaster', video: 'auto' });
    prefs.setShow(false);
    const restored = new HardwarePrefs(() => store);
    expect(restored.show()).toBe(false);
    expect(restored.game('one')).toEqual({ sound: 'speaker', video: 'vga' });
    expect(restored.game('two')).toEqual({ sound: 'blaster', video: 'auto' });
    const copy = restored.game('one')!;
    copy.sound = 'blaster';
    expect(restored.game('one')?.sound).toBe('speaker');
  });
  it('reads restored or cleared preferences immediately and validates untrusted game choices', () => {
    const { prefs, replace } = fixture();
    prefs.setShow(false);
    replace('{"show":true,"games":{"bad":{"sound":"silent","video":"auto"},"good":{"sound":"speaker","video":"auto"}}}');
    expect(prefs.show()).toBe(true);
    expect(prefs.game('bad')).toBeUndefined();
    expect(prefs.game('good')?.sound).toBe('speaker');
    expect(prefs.game('toString')).toBeUndefined();
    replace(null);
    expect(prefs.game('good')).toBeUndefined();
    expect(prefs.show()).toBe(true);
  });
  it('defaults malformed DOS fields independently when restoring a game', () => {
    const { prefs, replace } = fixture();
    replace('{"games":{"game":{"sound":"speaker","video":"vga","dos":{"driver":3,"irq":"5","port":560,"vga":4}}}}');
    expect(fromHardware(prefs.game('game'))).toEqual({
      sound: 0,
      vga: 4,
      irq: 7,
      port: 560,
      driverName: 'sndblast.drv',
      driverPath: '.\\',
    });
  });
  it('retains choices for this visit when storage access or writes fail', () => {
    const blocked = new HardwarePrefs(() => {
      throw new Error('Storage blocked');
    });
    blocked.setShow(false);
    blocked.save('game', { sound: 'speaker', video: 'auto' });
    expect(blocked.show()).toBe(false);
    expect(blocked.game('game')?.sound).toBe('speaker');
    const quota = new HardwarePrefs(() => ({
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota');
      },
    }));
    quota.save('__proto__', { sound: 'blaster', video: 'vga' });
    expect(quota.game('__proto__')).toEqual({ sound: 'blaster', video: 'vga' });
  });
});
