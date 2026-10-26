// The demos' sound choice: Sound Blaster, PC speaker or none, and switching between them.
import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../src/audio/engine';
import { DemoAudioEngine, demoAudio, onDemoAudio, setDemoAudio } from '../src/media/demoAudio';
import type { Session } from '../src/engine/scene';

const song = new Uint8Array([1, 2, 3]);

describe('demo audio', () => {
  it('starts on Sound Blaster and tells listeners of a change', () => {
    expect(demoAudio()).toBe('blaster');
    const heard: string[] = [];
    const off = onDemoAudio((m) => heard.push(m));
    setDemoAudio('speaker');
    setDemoAudio('speaker');
    setDemoAudio('none');
    off();
    setDemoAudio('blaster');
    expect(heard).toEqual(['speaker', 'none']);
  });

  it('plays no song on the PC speaker, and starts it again back on the card', () => {
    const play = vi.spyOn(AudioEngine.prototype, 'playSong').mockResolvedValue(true);
    const a = new DemoAudioEngine('speaker');
    const s = { speakerOnly: true } as Session;
    void a.playSong(song);
    expect(play).not.toHaveBeenCalled();
    a.setMode('blaster', s);
    expect(s.speakerOnly).toBe(false);
    expect(play).toHaveBeenCalledWith(song);
    a.setMode('speaker', s);
    expect(s.speakerOnly).toBe(true);
    a.setMode('none', s);
    expect(a.soundEnabled).toBe(false);
    a.setMode('blaster', s);
    expect(play).toHaveBeenCalledTimes(2);
    expect(a.soundEnabled).toBe(true);
    play.mockRestore();
  });

  it('forgets a song that was stopped', () => {
    const play = vi.spyOn(AudioEngine.prototype, 'playSong').mockResolvedValue(true);
    const a = new DemoAudioEngine('none');
    void a.playSong(song);
    a.stopSong();
    a.setMode('blaster');
    expect(play).not.toHaveBeenCalled();
    play.mockRestore();
  });
});

describe('walkthrough sound without a card', () => {
  it('writes no song into the video, and starts it again when the card goes back in', async () => {
    const { WalkAudio } = await import('../src/walkthrough/runtime');
    const play = vi.spyOn(AudioEngine.prototype, 'playSong').mockResolvedValue(true);
    const a = new WalkAudio();
    a.logging = true;
    a.card = false;
    void a.playSong(song);
    expect(a.playVoc(new Uint8Array(4))).toBe(false);
    expect(a.events.some((e) => e.kind === 'song' || e.kind === 'voc')).toBe(false);
    const s = { speakerOnly: true } as Session;
    a.setCard(true, s);
    expect(s.speakerOnly).toBe(false);
    expect(a.events.at(-1)).toMatchObject({ kind: 'song', bytes: song });
    a.setCard(false, s);
    expect(s.speakerOnly).toBe(true);
    expect(a.events.slice(-2).map((e) => e.kind)).toEqual(['stopSong', 'stopVoc']);
    play.mockRestore();
  });
});
