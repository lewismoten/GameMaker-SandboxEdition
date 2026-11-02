// ROOMFIX's command line, its storage keys still being the owners' keys, and what each reset keeps.
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseRoomFix } from './roomFix';
import { ITEMS, KEYS } from './roomFixItems';

describe('ROOMFIX command line', () => {
  it('lists with no words, helps with /?', () => {
    expect(parseRoomFix([])).toEqual({ kind: 'list' });
    expect(parseRoomFix(['/?'])).toEqual({ kind: 'help' });
  });
  it('picks the safe, the room, everything, or named things', () => {
    expect(parseRoomFix(['/safe'])).toEqual({ kind: 'reset', ids: ['SAFE'], full: false });
    expect(parseRoomFix(['/SAFE', '/FULL'])).toEqual({ kind: 'reset', ids: ['SAFE'], full: true });
    expect(parseRoomFix(['/ROOM'])).toMatchObject({ kind: 'reset', full: false, ids: expect.not.arrayContaining(['SAFE']) });
    expect(parseRoomFix(['/ALL'])).toMatchObject({ kind: 'reset', ids: ITEMS.map((i) => i.id) });
    expect(parseRoomFix(['mug', 'lights'])).toEqual({ kind: 'reset', ids: ['LIGHTS', 'MUG'], full: false });
  });
  it('refuses what it does not know, and /FULL alone', () => {
    expect(parseRoomFix(['/X']).kind).toBe('error');
    expect(parseRoomFix(['SAVES']).kind).toBe('error');
    expect(parseRoomFix(['/FULL']).kind).toBe('error');
  });
  it('can reach nothing that is a game save, an achievement, an egg or a heart', () => {
    for (const i of ITEMS) expect(i.id).not.toMatch(/SAVE$|SCORE|ACH|EGG|HEART/);
  });
});

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};

describe('what ROOMFIX resets', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memory());
    vi.stubGlobal('sessionStorage', memory());
    vi.stubGlobal('window', { dispatchEvent: () => true });
    vi.stubGlobal('CustomEvent', class {});
  });
  it('each key is still the one its owner uses', () => {
    for (const k of Object.values(KEYS)) expect(readFileSync(`src/${k.owner}`, 'utf8')).toContain(`'${k.key}'`);
  });
  it('puts back the mug and the pad and leaves unrelated keys alone', async () => {
    localStorage.setItem(KEYS.mug.key, '{"design":"scene"}');
    localStorage.setItem(KEYS.pad.key, 'x');
    localStorage.setItem('gm-other', 'keep');
    for (const id of ['MUG', 'PAD']) await ITEMS.find((i) => i.id === id)!.reset(false);
    expect(localStorage.getItem(KEYS.mug.key)).toBeNull();
    expect(localStorage.getItem(KEYS.pad.key)).toBeNull();
    expect(localStorage.getItem('gm-other')).toBe('keep');
  });
  it('puts the lights back to the clock', async () => {
    sessionStorage.setItem(KEYS.overhead.key, 'on');
    await ITEMS.find((i) => i.id === 'LIGHTS')!.reset(false);
    expect(sessionStorage.getItem(KEYS.overhead.key)).toBeNull();
  });
});
