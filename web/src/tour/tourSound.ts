// The tour's sound: a Sandbox game's song quietly on the site's OPL2 music player and its
// digitized effects (steps.ts MUSIC and SOUNDS: never the Bard of Bizarre's recordings), the
// real dogs' barks (BARKS, public/tour/sfx), plus a
// step's recorded voice line when there is one (public/tour/voice/<id>.ogg). Nothing plays
// until a tour starts from a click; the mute switch is remembered in this browser, and a
// browser whose demo sound is "None" starts muted.
import { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import { channelGain, onMix } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { fetchGameFile, loadGameList } from '../project/files';
import { BARKS, MUSIC, SOUNDS, barkUrl, type MusicId, type SoundId } from './steps';

const KEY = 'gm-tour-sound';
/** Quiet: the music sits under the words. */
const VOLUME = 0.3;

function savedOn(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    return v ? v === 'on' : localStorage.getItem('gm-demo-audio') !== 'none';
  } catch {
    return true;
  }
}

export class TourSound {
  private engine = new AudioEngine();
  private files = new Map<string, Promise<Uint8Array | undefined>>();
  private song?: MusicId;
  private started = false;
  private voice?: HTMLAudioElement;
  /** Clips loading ahead of their step (prefetch), by address. */
  private warm = new Map<string, HTMLAudioElement>();
  on = savedOn();
  /** The Voice volume applies to a line already playing. */
  private unmix = onMix(() => {
    if (this.voice) this.voice.volume = channelGain('voice');
  });

  private file(path: string): Promise<Uint8Array | undefined> {
    let p = this.files.get(path);
    if (!p) {
      const [game, name] = path.split('/');
      p = loadGameList()
        .then((list) => list.find((g) => g.id === game))
        .then((entry) => (entry ? fetchGameFile(entry, name) : undefined))
        .catch(() => undefined);
      this.files.set(path, p);
    }
    return p;
  }

  /** From the click that starts the tour (browsers allow sound only after one). */
  start(): void {
    if (!this.on || this.started) return;
    this.started = true;
    void this.engine.resume().then(() => {
      const gain = this.engine.node;
      if (gain instanceof GainNode) gain.gain.value = VOLUME;
      if (this.song) void this.play(this.song);
    });
  }

  /**
   * Starts the sound without a click, as the tour carries on from another page (a browser that
   * saw a click on this site's last page may allow it): whether it is really playing. If not,
   * it starts with the next tap or key (audio/context.ts).
   */
  async startNow(): Promise<boolean> {
    if (!this.on) return true;
    this.start();
    await this.engine.resume();
    return this.engine.context?.state === 'running';
  }

  /** The chapter's song (kept to start once sound is on). */
  music(id: MusicId | undefined): void {
    if (id === this.song) return;
    this.song = id;
    if (this.started) void this.play(id);
  }

  private async play(id: MusicId | undefined): Promise<void> {
    if (!id) return this.engine.stopSong();
    const bytes = await this.file(MUSIC[id]);
    if (this.started && this.song === id) await this.engine.playSong(bytes);
  }

  effect(id: SoundId | undefined): void {
    if (!id || !this.started) return;
    if (id in BARKS) {
      const clips: readonly string[] = BARKS[id as keyof typeof BARKS];
      const a = new Audio(barkUrl(clips[Math.floor(Math.random() * clips.length)]));
      a.volume = 0.6 * channelGain('sfx');
      void a.play().catch(() => undefined);
      return;
    }
    void this.file(`${SOUNDS[id as keyof typeof SOUNDS]}.voc`).then((b) => this.started && this.engine.playVoc(b));
  }

  pause(paused: boolean): void {
    if (this.started) this.engine.pauseMusic(paused);
    if (paused) this.voice?.pause();
  }

  /** Sound on or off (from the tour's switch, so a click is under way). */
  set(on: boolean): void {
    this.on = on;
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      /* not remembered */
    }
    if (on) this.start();
    else {
      this.started = false;
      this.engine.stopAll();
      this.stopVoice();
    }
  }

  /** Starts loading a coming step's clip while the current one plays, so it is ready to start at once. */
  prefetch(url: string): void {
    if (!this.on || this.warm.has(url)) return;
    const a = new Audio();
    a.preload = 'auto';
    a.src = url;
    this.warm.set(url, a);
    // a few at most: the oldest goes
    if (this.warm.size > 4) {
      const [old] = this.warm.keys();
      this.warm.get(old)?.removeAttribute('src');
      this.warm.delete(old);
    }
  }

  /**
   * A step's recorded line, if there is one: resolves with its length in ms once it is ready
   * to play (and plays it), or 0 when there is none (the bubble's own timing is used).
   */
  speak(url: string): Promise<number> {
    this.stopVoice();
    // Voice off in the sound settings: the bubble's own timing is used, as with a step that has no clip
    if (!this.on || channelGain('voice') === 0) return Promise.resolve(0);
    const early = this.warm.get(url);
    this.warm.delete(url);
    const a = early ?? new Audio();
    a.preload = 'auto';
    this.voice = a;
    a.volume = channelGain('voice');
    return new Promise<number>((resolve) => {
      let given = false;
      const give = (ms: number) => {
        clearTimeout(timer);
        given = true;
        resolve(ms);
      };
      const timer = setTimeout(() => give(0), 3000);
      a.addEventListener('error', () => give(0), { once: true });
      a.addEventListener(
        'canplaythrough',
        () => {
          // ready after the step stopped waiting for it: playing now would be cut off mid-word
          if (given) return;
          if (this.voice !== a || !isFinite(a.duration)) return give(0);
          void a.play().catch(() => undefined);
          give(Math.ceil(a.duration * 1000) + 300);
        },
        { once: true },
      );
      if (!early) a.src = url;
      // loaded ahead already: no event is left to wait for
      else if (a.error) queueMicrotask(() => give(0));
      else if (a.readyState >= 4) queueMicrotask(() => a.dispatchEvent(new Event('canplaythrough')));
    });
  }

  stopVoice(): void {
    this.voice?.pause();
    this.voice?.removeAttribute('src');
    this.voice = undefined;
  }

  dispose(): void {
    this.stopVoice();
    this.started = false;
    this.unmix();
    this.engine.dispose();
  }
}
