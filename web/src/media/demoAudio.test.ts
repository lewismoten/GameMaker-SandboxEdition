// The demos' sound choice: hushing silences every demo for a while (the guided tour talks over
// them) and gives the visitor's choice back after, without saving None as their choice.
import { describe, expect, it } from 'vitest';
import { demoAudio, hushDemos, onDemoAudio, setDemoAudio } from './demoAudio';

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
