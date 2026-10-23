// The cast stage's sound: Teddy's Little Big Adventure's title song on the OPL2 (its own .CMF,
// played by the site's music worklet), its digitized effects (a bark, a yip, the chicken's
// squeak, the horn, a giggle, things landing) and a few made here (footsteps, the tin heart's
// tick-tock, THE CHEZ's electric whirr). It follows the site's demo sound choice
// (media/demoAudio.ts: "None" keeps it quiet) and only starts from a gesture on the stage.
import { AudioEngine } from '../audio/engine';
import { demoAudio, setDemoAudio } from '../media/demoAudio';
import { fetchGameFile, loadGameList } from '../project/files';

const SONG = 'title.cmf';
/** A digitized effect: Teddy's own by name, or another game's as 'game/name' (goat/scream). */
export type Effect = string;

export class StageSound {
  private engine = new AudioEngine();
  private files = new Map<string, Promise<Uint8Array | undefined>>();
  private started = false;
  private paused = false;
  /** Wanted: the demo sound choice isn't "None". */
  wanted = demoAudio() !== 'none';

  private file(name: string, game = 'teddy'): Promise<Uint8Array | undefined> {
    const key = `${game}/${name}`;
    let p = this.files.get(key);
    if (!p) {
      p = loadGameList()
        .then((list) => list.find((g) => g.id === game))
        .then((entry) => (entry ? fetchGameFile(entry, name) : undefined))
        .catch(() => undefined);
      this.files.set(key, p);
    }
    return p;
  }

  /** From a gesture's handler: starts the music when sound is wanted (once). */
  start(): void {
    if (!this.wanted || this.started) return;
    this.started = true;
    void this.engine.resume().then(async () => {
      if (!this.started) return;
      await this.engine.playSong(await this.file(SONG));
      if (this.paused) this.engine.pauseMusic(true);
    });
  }

  /** Turns the sound on or off (and remembers it as the site's demo sound choice). */
  set(on: boolean): void {
    this.wanted = on;
    setDemoAudio(on ? 'blaster' : 'none');
    if (on) this.start();
    else {
      this.started = false;
      this.engine.stopAll();
    }
  }

  pause(paused: boolean): void {
    this.paused = paused;
    if (this.started) this.engine.pauseMusic(paused);
  }

  private get live(): AudioContext | undefined {
    const c = this.engine.context;
    return this.started && c && c.state === 'running' ? c : undefined;
  }

  effect(name: Effect): void {
    if (!this.live) return;
    const [game, voc] = name.includes('/') ? name.split('/') : ['teddy', name];
    void this.file(`${voc}.voc`, game).then((b) => this.live && this.engine.playVoc(b));
  }

  /** A short synthesized sound into the stage's output. */
  private blip(type: OscillatorType, from: number, to: number, seconds: number, level: number): void {
    const c = this.live;
    const out = this.engine.node;
    if (!c || !out) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + seconds + 0.01);
  }

  step(): void {
    this.blip('triangle', 140, 70, 0.05, 0.12);
  }

  tick(n: number): void {
    this.blip('square', n % 2 ? 1500 : 1050, n % 2 ? 1400 : 1000, 0.04, 0.05);
  }

  whirr(): void {
    this.blip('sawtooth', 220, 330, 0.16, 0.03);
  }

  dispose(): void {
    this.started = false;
    this.engine.dispose();
  }
}
