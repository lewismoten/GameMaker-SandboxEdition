// A demo's sound: the game's audio engine with the demo sound choice (demoAudio.ts) applied.
import { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import type { Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { demoAudio, type DemoAudio } from './demoAudio';

/** The game's sound with a demo's choice applied: songs only with the card, nothing at all for None. */
export class DemoAudioEngine extends AudioEngine {
  private wanted?: Uint8Array;

  constructor(private current: DemoAudio = demoAudio()) {
    super();
    this.soundEnabled = current !== 'none';
  }

  get mode(): DemoAudio {
    return this.current;
  }

  override async playSong(bytes: Uint8Array | undefined): Promise<boolean> {
    if (this.current !== 'blaster') {
      super.stopSong();
      this.wanted = bytes;
      return false;
    }
    // (super stops the song playing first, through stopSong below)
    const done = super.playSong(bytes);
    this.wanted = bytes;
    return done;
  }

  override stopSong(): void {
    this.wanted = undefined;
    super.stopSong();
  }

  override playVoc(bytes: Uint8Array | undefined): boolean {
    return this.current === 'blaster' && super.playVoc(bytes);
  }

  /**
   * Starts sound held back until the visitor used the page (call it from the gesture's
   * handler): the song the game asked for meanwhile starts over (it can't be joined midway).
   */
  async wake(): Promise<void> {
    if (this.context || this.current === 'none') return;
    await this.resume();
    const song = this.wanted;
    if (this.current === 'blaster' && song && this.context) {
      await super.playSong(song);
      this.wanted = song;
    }
  }

  /** Switches the sound while the game plays (`session` is the game's, for its speakerOnly). */
  setMode(m: DemoAudio, session?: Session): void {
    const was = this.current;
    this.current = m;
    this.soundEnabled = m !== 'none';
    if (session) session.speakerOnly = m !== 'blaster';
    if (m === 'none') this.stopSpeaker();
    if (m !== 'blaster') {
      super.stopSong();
      this.stopVoc();
    } else if (was !== 'blaster' && this.wanted) {
      // back to the card: the level's song starts over (it can't be joined midway)
      const song = this.wanted;
      void super.playSong(song);
      this.wanted = song;
    }
  }
}
