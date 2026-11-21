import { describe, expect, it, vi } from 'vitest';
import { EventLog, nameOf, recordEvents, scanOf } from '@lewismoten/gamemaker-sandbox-tools/kit/eventLog';

describe('key names', () => {
  it('maps names to scan codes and back', () => {
    expect(scanOf('enter')).toBe(0x1c);
    expect(scanOf('Up')).toBe(0x48);
    expect(scanOf('q')).toBe(0x10);
    expect(scanOf('Banana')).toBeUndefined();
    expect(nameOf(0x39)).toBe('Space');
    expect(nameOf(0x7f)).toBe('0x7f');
  });
});

describe('EventLog', () => {
  it('records key edges, score deltas, scene changes and counts presses', () => {
    const sim = { scene: 2, ci: { score: 0 } } as never as ConstructorParameters<typeof EventLog>[0];
    const log = new EventLog(sim);
    log.key(0x1c, true);
    log.key(0x1c, false);
    log.key(0x1c, true);
    log.tick(0, 2, undefined);
    (sim as { ci: { score: number } }).ci.score = 25;
    (sim as { scene: number }).scene = 3;
    log.tick(0, 2, 'link');
    expect(log.presses(0x1c)).toBe(2);
    expect(log.presses(0x1c, 3)).toBe(0);
    expect(log.events.map((e) => e.kind)).toEqual(['key', 'key', 'key', 'score', 'scene']);
    expect(log.events[3]).toMatchObject({ kind: 'score', delta: 25, scene: 2 });
  });
});

describe('recordEvents', () => {
  it('logs a patched sim class and restores it, even when the run throws', async () => {
    class Fake {
      scene = 1;
      ci = { score: 0 };
      held = new Set<number>();
      isHeld(k: number) {
        return this.held.has(k);
      }
      press(k: number) {
        this.held.add(k);
      }
      release(k: number) {
        this.held.delete(k);
      }
      async tick() {
        this.ci.score += 10;
        return undefined;
      }
    }
    const descriptors = () => ['press', 'release', 'tick'].map((method) => Object.getOwnPropertyDescriptor(Fake.prototype, method));
    const original = descriptors();
    const { logs } = await recordEvents(Fake as never, async () => {
      const f = new Fake();
      f.press(0x39);
      f.press(0x39);
      await f.tick();
      f.release(0x39);
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].events.map((e) => e.kind)).toEqual(['key', 'score', 'key']);
    expect(descriptors()).toStrictEqual(original);
    await expect(recordEvents(Fake as never, async () => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(descriptors()).toStrictEqual(original);
  });

  it('leaves a subclass inheriting from its base after recording, also when the run throws', async () => {
    class Base {
      scene = 1;
      ci = { score: 0 };
      held = new Set<number>();
      isHeld(k: number) {
        return this.held.has(k);
      }
      press(k: number) {
        this.held.add(k);
      }
      release(k: number) {
        this.held.delete(k);
      }
      async tick() {
        return undefined;
      }
    }
    class Child extends Base {}
    const own = () => Object.getOwnPropertyNames(Child.prototype);
    const before = own();
    const { logs } = await recordEvents(Child as never, async () => {
      new Child().press(0x39);
    });
    expect(logs).toHaveLength(1);
    expect(own()).toEqual(before);
    await expect(recordEvents(Child as never, async () => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(own()).toEqual(before);
    const changed = vi.fn();
    Base.prototype.press = changed;
    new Child().press(1);
    expect(changed).toHaveBeenCalledOnce();
  });
});
