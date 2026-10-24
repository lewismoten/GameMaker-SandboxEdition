// The mouse pad's remembered print: what was saved comes back, and anything else (nothing,
// an unknown name, storage that throws) is the Sandbox BBS print it came with.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PAD, PAD_CHANGED, PAD_PRINTS, loadPad, savePad } from './padChoice';

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mouse pad print', () => {
  it('starts as the Sandbox BBS print, listed first', () => {
    expect(DEFAULT_PAD).toBe('sandbox');
    expect(PAD_PRINTS[0].id).toBe('sandbox');
    expect(loadPad()).toBe('sandbox');
  });

  it('remembers each print', () => {
    for (const { id } of PAD_PRINTS) {
      savePad(id);
      expect(loadPad()).toBe(id);
    }
  });

  it('falls back to the default for a bad stored value', () => {
    for (const bad of ['', 'CHEZ', 'plaid', '{"id":"chez"}', 'null', 'constructor', 'toString']) {
      store.set('gm-desk-pad', bad);
      expect(loadPad()).toBe('sandbox');
    }
  });

  it('falls back to the default when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(loadPad()).toBe('sandbox');
    expect(() => savePad('night')).not.toThrow();
  });

  it('tells an open desk when it changes', () => {
    const seen: unknown[] = [];
    window.addEventListener(PAD_CHANGED, (e) => seen.push((e as CustomEvent).detail));
    savePad('graph');
    expect(seen).toEqual(['graph']);
  });
});
