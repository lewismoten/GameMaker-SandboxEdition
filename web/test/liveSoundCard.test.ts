// Live sound-card changes preserve game state, PC-speaker output and the latest requested FM song.
import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import { loadSong } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfLoad';
import { blankSong } from '@lewismoten/gamemaker-sandbox-tools/music/compose';
import { sample, osc } from '@lewismoten/gamemaker-sandbox-tools/audio';

const mockAudio = () => {
  const audio = new AudioEngine();
  const postMessage = vi.fn();
  Object.assign(audio, { music: { port: { postMessage } } });
  return { audio, postMessage };
};

describe('live sound card', () => {
  it('pauses and resumes an already loaded song without restarting it or stopping the speaker', async () => {
    const { audio, postMessage } = mockAudio();
    const speaker = vi.spyOn(audio, 'stopSpeaker');
    await audio.playSong(blankSong());
    audio.setSoundCard(false);
    expect(postMessage).toHaveBeenLastCalledWith({ type: 'pause', paused: true }, []);
    audio.setSoundCard(true);
    expect(postMessage).toHaveBeenLastCalledWith({ type: 'pause', paused: false }, []);
    expect(postMessage.mock.calls.filter(([message]) => message.type === 'load')).toHaveLength(1);
    expect(speaker).not.toHaveBeenCalled();
  });
  it('starts the latest song requested while absent, and respects an explicit stop', async () => {
    const { audio, postMessage } = mockAudio();
    audio.setSoundCard(false);
    expect(await audio.playSong(blankSong(120))).toBe(false);
    const latest = blankSong(60);
    expect(await audio.playSong(latest)).toBe(false);
    expect(postMessage.mock.calls.some(([message]) => message.type === 'load')).toBe(false);
    audio.setSoundCard(true);
    expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'load', music: loadSong(latest)!.music }), []);
    audio.stopSong();
    postMessage.mockClear();
    audio.setSoundCard(false);
    audio.setSoundCard(true);
    expect(postMessage.mock.calls.some(([message]) => message.type === 'load')).toBe(false);
  });
  it('cuts an active VOC and blocks digital playback until the card returns', () => {
    const { audio } = mockAudio();
    const source = { connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const context = { createBuffer: () => ({ copyToChannel: vi.fn() }), createBufferSource: () => source };
    Object.assign(audio, { ctx: context, master: {} });
    const voc = sample(0.002, osc.sine(440));
    expect(audio.playVoc(voc)).toBe(true);
    audio.setSoundCard(false);
    expect(source.stop).toHaveBeenCalledOnce();
    expect(audio.playVoc(voc)).toBe(false);
    audio.setSoundCard(true);
    expect(audio.playVoc(voc)).toBe(true);
  });
  it('preserves the music preference when the physical card returns', async () => {
    const { audio, postMessage } = mockAudio();
    expect(audio.soundCardEnabled).toBe(true);
    await audio.playSong(blankSong());
    audio.setSoundCard(false);
    expect(audio.soundCardEnabled).toBe(false);
    audio.musicEnabled = false;
    postMessage.mockClear();
    audio.setSoundCard(true);
    expect(audio.soundCardEnabled).toBe(true);
    expect(postMessage).not.toHaveBeenCalled();
  });
  it('keeps a pending worklet from starting FM after the card is removed', async () => {
    vi.useFakeTimers();
    try {
      const { audio, postMessage } = mockAudio();
      let ready!: () => void;
      const musicReady = new Promise<void>((resolve) => {
        ready = resolve;
      });
      Object.assign(audio, { music: undefined, musicReady });
      const playing = audio.playSong(blankSong());
      audio.setSoundCard(false);
      Object.assign(audio, { music: { port: { postMessage } } });
      ready();
      await playing;
      expect(postMessage.mock.calls.some(([message]) => message.type === 'load')).toBe(false);
      audio.setSoundCard(true);
      expect(postMessage.mock.calls.filter(([message]) => message.type === 'load')).toHaveLength(1);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
