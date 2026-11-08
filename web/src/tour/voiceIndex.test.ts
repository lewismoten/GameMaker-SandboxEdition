// The tour asks only for voice clips the index lists.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasClip, loadClipIndex, type ClipIndex } from './voiceIndex';

const index: ClipIndex = { 'home-hello': { chapter: 'home' }, 'desk-power': { chapter: 'desk' } };
const reply = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;
const offline = (async () => {
  throw new Error('offline');
}) as unknown as typeof fetch;

describe('tour voice index', () => {
  it('has a clip only for a listed step of that chapter', () => {
    expect(hasClip(index, 'home', 'home-hello')).toBe(true);
    expect(hasClip(index, 'home', 'home-teddy')).toBe(false);
    expect(hasClip(index, 'desk', 'home-hello')).toBe(false);
  });

  it('assumes a clip while the index is unknown', () => {
    expect(hasClip(undefined, 'home', 'home-teddy')).toBe(true);
  });

  it('reads the index, and is undefined when it cannot', async () => {
    expect(await loadClipIndex(reply(index))).toEqual(index);
    expect(await loadClipIndex(reply({}, false))).toBeUndefined();
    expect(await loadClipIndex(reply([1]))).toBeUndefined();
    expect(await loadClipIndex(offline)).toBeUndefined();
  });

  it('agrees with the real index: Gwinn’s hello has a clip, Teddy’s woof has none', () => {
    const real = JSON.parse(readFileSync(new URL('../../public/tour/voice/index.json', import.meta.url), 'utf8')) as ClipIndex;
    expect(hasClip(real, 'home', 'home-hello')).toBe(true);
    expect(hasClip(real, 'home', 'home-teddy')).toBe(false);
  });
});
