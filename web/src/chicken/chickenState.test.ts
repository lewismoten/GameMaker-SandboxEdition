// The chicken state: Sir Reginald by default, flips to Lady Regina, restores, and rides in a preferences backup.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHICKEN_CHANGED, CHICKEN_KEY, chickenNow, onChicken, setChicken } from './chickenState';
import { chickenWords } from './chickenWords';
import { eggs } from '../backup/sections/eggs';
import { LOCAL_KEYS } from '../backup/inventory';

beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  });
  vi.stubGlobal('window', new EventTarget());
});

describe('chicken state', () => {
  it('is Sir Reginald by default, and for anything unreadable', () => {
    expect(chickenNow()).toBe('sir');
    localStorage.setItem(CHICKEN_KEY, 'banana');
    expect(chickenNow()).toBe('sir');
  });

  it('flips to Lady Regina once, tells listeners, and restores', () => {
    const seen = vi.fn();
    const stop = onChicken(seen);
    expect(setChicken('lady')).toBe(true);
    expect(setChicken('lady')).toBe(false);
    expect(chickenNow()).toBe('lady');
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith('lady');
    expect(setChicken('sir')).toBe(true);
    expect(localStorage.getItem(CHICKEN_KEY)).toBeNull();
    expect(chickenNow()).toBe('sir');
    stop();
    window.dispatchEvent(new Event(CHICKEN_CHANGED));
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('has matching words', () => {
    expect(chickenWords('sir')).toMatchObject({ title: 'Sir Reginald', he: 'he', his: 'his' });
    expect(chickenWords('lady')).toMatchObject({ full: 'Lady Regina Cluckington III', he: 'she', His: 'Her' });
  });
});

describe('chicken in the preferences backup', () => {
  const ctx = { prefer: 'mine' as const };
  const payload = (local: Record<string, string>) => ({ local, inSaves: [] as string[] });

  it('is owned by the eggs section', () => {
    expect(LOCAL_KEYS.eggs.keys).toContain(CHICKEN_KEY);
  });

  it('merging brings Lady Regina over, and replacing follows the backup', () => {
    const merged = eggs.merge(payload({}), payload({ [CHICKEN_KEY]: 'lady' }), ctx as never);
    expect(merged.local[CHICKEN_KEY]).toBe('lady');
    const kept = eggs.merge(payload({ [CHICKEN_KEY]: 'lady' }), payload({}), ctx as never);
    expect(kept.local[CHICKEN_KEY]).toBe('lady');
    expect(eggs.replace!(payload({ [CHICKEN_KEY]: 'lady' }), ctx as never, payload({})).local[CHICKEN_KEY]).toBe('lady');
    expect(eggs.replace!(payload({}), ctx as never, payload({ [CHICKEN_KEY]: 'lady' })).local[CHICKEN_KEY]).toBeUndefined();
  });
});

describe('chicken story', () => {
  it('flips only in Tune-Up, from The Rain Delay on or on winning', async () => {
    const { noteChickenScene } = await import('./chickenStory');
    noteChickenScene('game:tuneup', 'Muffled');
    noteChickenScene('game:teddy', 'The Rain Delay');
    noteChickenScene('game:tuneup', 'Hubcaps and Balls, round 1');
    expect(chickenNow()).toBe('sir');
    noteChickenScene('game:tuneup', 'The Rain Delay, the two and the three');
    expect(chickenNow()).toBe('lady');
    setChicken('sir');
    noteChickenScene('tuneup', undefined, true);
    expect(chickenNow()).toBe('lady');
  });
});
