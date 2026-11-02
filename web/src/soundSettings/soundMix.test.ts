// The sound mix (engine audio/mix.ts): defaults, clamping, remembering, and the Tour switch.
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('sound mix', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    });
    vi.resetModules();
  });

  it('starts everything on at full volume', async () => {
    const m = await import('@lewismoten/gamemaker-sandbox-engine/audio/mix');
    expect(m.channelGain('music')).toBe(1);
    expect(m.channelGain('voice')).toBe(1);
    expect(m.channelGain('sfx')).toBe(1);
  });

  it('applies on/off and volume, tells listeners, and remembers across a reload', async () => {
    const m = await import('@lewismoten/gamemaker-sandbox-engine/audio/mix');
    const seen = vi.fn();
    m.onMix(seen);
    m.setChannel('music', { volume: 40 });
    m.setChannel('sfx', { on: false });
    m.setChannel('voice', { volume: 250 });
    expect(seen).toHaveBeenCalledTimes(3);
    expect(m.channelGain('music')).toBeCloseTo(0.4);
    expect(m.channelGain('sfx')).toBe(0);
    expect(m.channelGain('voice')).toBe(1);
    vi.resetModules();
    const again = await import('@lewismoten/gamemaker-sandbox-engine/audio/mix');
    expect(again.getMix().music.volume).toBe(40);
    expect(again.getMix().sfx.on).toBe(false);
  });

  it('ignores junk in storage', async () => {
    localStorage.setItem('gm-sound-mix', '{"music":{"on":"x","volume":-5}}');
    const m = await import('@lewismoten/gamemaker-sandbox-engine/audio/mix');
    expect(m.getMix().music).toEqual({ on: true, volume: 100 });
  });

  it('the Tour switch turns the guides on for every page', async () => {
    const t = await import('../tour/tourPages');
    expect(t.allGuidesOn()).toBe(false);
    t.setAllGuides(true);
    expect(t.allGuidesOn()).toBe(true);
    t.setAllGuides(false);
    expect(t.guidesOn('home')).toBe(false);
  });
});
