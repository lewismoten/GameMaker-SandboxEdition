// The demos' sound choice: hushing silences every demo for a while (the guided tour talks over
// them) and gives the visitor's choice back after, without saving None as their choice.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoAudio, demoAudioPicker, hushDemos, onDemoAudio, setDemoAudio } from './demoAudio';

describe('demo sound', () => {
  it('is hushed while the tour talks, and comes back as it was', () => {
    setDemoAudio('speaker');
    const heard: string[] = [];
    const off = onDemoAudio((m) => heard.push(m));
    hushDemos(true);
    expect(demoAudio()).toBe('none');
    hushDemos(false);
    expect(demoAudio()).toBe('speaker');
    off();
    expect(heard).toEqual(['none', 'speaker']);
  });
});

// A node-only stand-in for the few DOM calls the picker makes; `connected` is what isConnected says.
function fakeElement(): Record<string, unknown> {
  const el: Record<string, unknown> = {
    connected: false,
    children: [] as unknown[],
    setAttribute: () => undefined,
    addEventListener: () => undefined,
    append: (...c: unknown[]) => (el.children as unknown[]).push(...c),
  };
  Object.defineProperty(el, 'isConnected', { get: () => el.connected });
  return el;
}

describe('demo sound picker lifetime', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stops following the choice as soon as its owner aborts, even if it was never attached', () => {
    vi.stubGlobal('document', { createElement: fakeElement });
    const owner = new AbortController();
    const picker = demoAudioPicker({ signal: owner.signal }) as unknown as { children: { children: { checked: boolean; value: string }[] }[] };
    const inputs = picker.children.flatMap((label) => label.children).filter((c) => 'checked' in c);
    setDemoAudio('speaker');
    expect(inputs.find((i) => i.value === 'speaker')?.checked).toBe(true);
    owner.abort();
    setDemoAudio('blaster');
    expect(inputs.find((i) => i.value === 'speaker')?.checked).toBe(true);
    expect(inputs.find((i) => i.value === 'blaster')?.checked).toBe(false);
  });

  it('never subscribes when the owner is already gone', () => {
    vi.stubGlobal('document', { createElement: fakeElement });
    const owner = new AbortController();
    owner.abort();
    const picker = demoAudioPicker({ signal: owner.signal }) as unknown as { children: { children: { checked: boolean; value: string }[] }[] };
    const inputs = picker.children.flatMap((label) => label.children).filter((c) => 'checked' in c);
    setDemoAudio('none');
    expect(inputs.find((i) => i.value === 'none')?.checked).toBe(false);
  });
});
