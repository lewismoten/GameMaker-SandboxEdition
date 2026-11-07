// The cast stage's sound: Teddy's Little Big Adventure's title song on the OPL2 (its own .CMF,
// played by the site's music worklet, so it is always the Teddy games' shared theme from
// games/kit/teddyTheme.ts), its digitized effects (a bark, a yip, the chicken's squeak, the
// horn, a giggle, things landing) and a few made here (footsteps, the tin heart's tick-tock,
// THE CHEZ's electric motor). It follows the site's demo sound choice (media/demoAudio.ts:
// "None" keeps it quiet) and only starts from a gesture on the stage. It is hushed while the guided
// tour plays (the tour has its own song and effects; tour/, its 'gm-tour' events and `tour-on` class).
import { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine/audio/engine';
import { demoAudio, setDemoAudio } from '../media/demoAudio';
import { peekGameFile, loadGameList } from '../project/files';

const SONG = 'title.cmf';
/** A digitized effect: Teddy's own by name, or another game's as 'game/name' (goat/scream). */
export type Effect = string;

const MOTOR_LEVEL = 0.03;
const tourOn = () => document.documentElement.classList.contains('tour-on');

export class StageSound {
  private engine = new AudioEngine();
  private files = new Map<string, Promise<Uint8Array | undefined>>();
  private started = false;
  private paused = false;
  private hum?: { master: GainNode; whine: OscillatorNode; upper: OscillatorNode; nodes: AudioScheduledSourceNode[] };
  /** The stage's music follows the tour: hushed from its start to its end. */
  private onTour = () => this.engine.pauseMusic(this.hushed);
  /** Wanted: the demo sound choice isn't "None". */
  wanted = demoAudio() !== 'none';

  constructor() {
    window.addEventListener('gm-tour', this.onTour);
  }

  /** Paused by the Pause button or the tour. */
  private get hushed(): boolean {
    return this.paused || tourOn();
  }

  private file(name: string, game = 'teddy'): Promise<Uint8Array | undefined> {
    const key = `${game}/${name}`;
    let p = this.files.get(key);
    if (!p) {
      p = loadGameList()
        .then((list) => list.find((g) => g.id === game))
        .then((entry) => (entry ? peekGameFile(entry, name) : undefined))
        .catch(() => undefined);
      this.files.set(key, p);
    }
    return p;
  }

  /** The sound is actually going (wanted, and a gesture has started it). */
  get playing(): boolean {
    return this.started;
  }

  /** From a gesture's handler: starts the music when sound is wanted (once). */
  start(): void {
    if (!this.wanted || this.started) return;
    this.started = true;
    void this.engine.resume().then(async () => {
      if (!this.started) return;
      await this.engine.playSong(await this.file(SONG));
      if (this.hushed) this.engine.pauseMusic(true);
    });
  }

  /** Turns the sound on or off (and remembers it as the site's demo sound choice). */
  set(on: boolean): void {
    this.wanted = on;
    setDemoAudio(on ? 'blaster' : 'none');
    if (on) this.start();
    else {
      this.stopMotor();
      this.started = false;
      this.engine.stopAll();
    }
  }

  pause(paused: boolean): void {
    this.paused = paused;
    if (this.started) this.engine.pauseMusic(this.hushed);
  }

  private get live(): AudioContext | undefined {
    const c = this.engine.context;
    return this.started && !tourOn() && c && c.state === 'running' ? c : undefined;
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

  /**
   * THE CHEZ's electric motor: one sustained smooth whine (not per-frame blips, which sounded like a
   * putt-putt engine). Call it every frame with whether the car is moving; it only starts when it begins
   * to move (a soft contactor clunk, then the pitch climbs ~400 to 900 Hz and settles), and fades out
   * when it stops. Quiet, so voices stay clear.
   */
  motor(moving: boolean): void {
    const c = this.live;
    const out = this.engine.node;
    if (!moving || !c || !out) {
      this.stopMotor();
      return;
    }
    if (this.hum) return;
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(MOTOR_LEVEL, t + 0.15);
    const nodes: AudioScheduledSourceNode[] = [];
    const whine = c.createOscillator();
    whine.type = 'sine';
    const upper = c.createOscillator();
    upper.type = 'triangle';
    const upperGain = c.createGain();
    upperGain.gain.value = 0.25;
    for (const [o, mult] of [
      [whine, 1],
      [upper, 2],
    ] as const) {
      o.frequency.setValueAtTime(400 * mult, t);
      o.frequency.exponentialRampToValueAtTime(900 * mult, t + 1.4);
    }
    whine.connect(master);
    upper.connect(upperGain).connect(master);
    nodes.push(whine, upper);
    // a little tire and gear hiss
    const noise = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    noise.loop = true;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2500;
    const hiss = c.createGain();
    hiss.gain.value = 0.12;
    noise.connect(band).connect(hiss).connect(master);
    nodes.push(noise);
    master.connect(out);
    for (const n of nodes) n.start(t);
    this.hum = { master, whine, upper, nodes };
    this.blip('triangle', 90, 45, 0.09, 0.05); // the contactor's clunk
  }

  private stopMotor(): void {
    const h = this.hum;
    const c = this.engine.context;
    if (!h) return;
    this.hum = undefined;
    if (!c) return;
    const t = c.currentTime;
    h.master.gain.cancelScheduledValues(t);
    h.master.gain.setValueAtTime(Math.max(h.master.gain.value, 0.0001), t);
    h.master.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    for (const o of [h.whine, h.upper]) {
      o.frequency.cancelScheduledValues(t);
      o.frequency.setValueAtTime(o.frequency.value, t);
      o.frequency.exponentialRampToValueAtTime(o === h.whine ? 300 : 600, t + 0.3);
    }
    for (const n of h.nodes) {
      n.stop(t + 0.35);
      n.onended = () => n.disconnect();
    }
  }

  dispose(): void {
    this.stopMotor();
    this.started = false;
    window.removeEventListener('gm-tour', this.onTour);
    this.engine.dispose();
  }
}
