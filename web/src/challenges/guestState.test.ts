// Guest storage must be independent of both owner bytes and other turns, even after exit.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { createGuestState } from './guestState';

afterEach(() => vi.unstubAllGlobals());

describe('guest storage capability', () => {
  it('never reads or writes persistent state and does not inherit disk callbacks or streams', () => {
    const touchOwner = vi.fn(() => {
      throw new Error('Owner state accessed');
    });
    for (const name of ['indexedDB', 'localStorage', 'sessionStorage']) {
      vi.stubGlobal(name, new Proxy({}, { get: touchOwner }));
    }
    const pristine = new GameFiles([['game.gam', new Uint8Array([1, 2])]]);
    pristine.onChange = touchOwner;
    pristine.stream = { need: touchOwner, want: touchOwner };
    const settings = { motion: 'reduced', sound: 'off' };
    const a = createGuestState(pristine, settings);
    const b = createGuestState(pristine, settings);
    a.files.get('game.gam')![0] = 9;
    a.files.set('slot0.sav', new Uint8Array([3]));
    a.files.set('game.his', new Uint8Array([4]));
    a.setSetting('sound', 'on');
    expect(a.persistent).toBe(false);
    expect(a.files.stream).toBeUndefined();
    expect(pristine.get('game.gam')).toEqual(new Uint8Array([1, 2]));
    expect(pristine.has('slot0.sav')).toBe(false);
    expect(b.files.get('game.gam')).toEqual(new Uint8Array([1, 2]));
    expect(b.files.has('game.his')).toBe(false);
    expect(b.setting('sound')).toBe('off');
    expect(settings.sound).toBe('off');
    expect(touchOwner).not.toHaveBeenCalled();
  });

  it('drops the turn, rejects late writes and starts the next turn clean', () => {
    const pristine = new GameFiles([['game.gam', new Uint8Array([1])]]);
    const a = createGuestState(pristine);
    a.files.set('slot0.sav', new Uint8Array([2]));
    a.setSetting('motion', 'reduced');
    a.close();
    a.close();
    expect(a.files.names()).toEqual([]);
    expect(() => a.files.set('slot0.sav', new Uint8Array([3]))).toThrow('Guest run is closed');
    expect(() => a.setSetting('motion', 'full')).toThrow();
    expect(() => a.setting('motion')).toThrow();
    const next = createGuestState(pristine);
    expect(next.files.names()).toEqual(['game.gam']);
    expect(next.setting('motion')).toBeUndefined();
  });
});
