// audio/context.ts: one AudioContext for the page, started inside a gesture (iOS).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeContext extends EventTarget {
  static made = 0;
  state: AudioContextState = 'suspended';
  sampleRate = 48000;
  destination = {};
  resumes = 0;
  started = 0;
  constructor() {
    super();
    FakeContext.made++;
  }
  resume() {
    this.resumes++;
    this.state = 'running';
    return Promise.resolve();
  }
  createBuffer() {
    return {};
  }
  createBufferSource() {
    return { connect: () => undefined, start: () => this.started++, buffer: null };
  }
}

const listeners = new Map<string, (e: Event) => void>();

beforeEach(() => {
  vi.resetModules();
  FakeContext.made = 0;
  listeners.clear();
  const target = { addEventListener: (t: string, f: (e: Event) => void) => listeners.set(t, f) };
  vi.stubGlobal('window', { ...target, AudioContext: FakeContext });
  vi.stubGlobal('document', { ...target, visibilityState: 'visible' });
  vi.stubGlobal('navigator', { audioSession: { type: 'auto' }, userActivation: { isActive: false, hasBeenActive: false } });
});

afterEach(() => vi.unstubAllGlobals());

describe('the page AudioContext', () => {
  it('is made once and shared', async () => {
    const { audioContext } = await import('../src/audio/context');
    expect(audioContext()).toBe(audioContext());
    expect(FakeContext.made).toBe(1);
    expect(audioContext()!.state).toBe('suspended');
  });

  it('starts on the first real tap, with a silent sample and the playback audio session', async () => {
    const { audioContext, soundUnlocked, onSoundUnlocked } = await import('../src/audio/context');
    const ctx = audioContext() as unknown as FakeContext;
    const heard = vi.fn();
    onSoundUnlocked(heard);
    listeners.get('pointerup')!({ type: 'pointerup', isTrusted: false } as Event);
    expect(ctx.resumes).toBe(0); // a script's event is no gesture
    listeners.get('touchend')!({ type: 'touchend', isTrusted: true } as Event);
    expect(ctx.resumes).toBe(1);
    expect(ctx.started).toBe(1);
    expect(heard).toHaveBeenCalledTimes(1);
    expect((navigator as unknown as { audioSession: { type: string } }).audioSession.type).toBe('playback');
    expect(soundUnlocked()).toBe(true);
    // once running, later taps leave it alone
    listeners.get('click')!({ type: 'click', isTrusted: true } as Event);
    expect(ctx.resumes).toBe(1);
  });

  it('makes the context in the first tap when nothing asked for one yet', async () => {
    const { soundUnlocked } = await import('../src/audio/context');
    expect(FakeContext.made).toBe(0);
    listeners.get('keydown')!({ type: 'keydown', key: 'a', isTrusted: true } as unknown as Event);
    expect(FakeContext.made).toBe(1);
    expect(soundUnlocked()).toBe(true);
  });

  it('comes back after an interruption when the page is shown again', async () => {
    const { audioContext, unlock } = await import('../src/audio/context');
    const ctx = audioContext() as unknown as FakeContext;
    unlock();
    ctx.state = 'interrupted' as AudioContextState;
    listeners.get('visibilitychange')!({ type: 'visibilitychange' } as Event);
    expect(ctx.state).toBe('running');
    expect(ctx.resumes).toBe(2);
  });
});
