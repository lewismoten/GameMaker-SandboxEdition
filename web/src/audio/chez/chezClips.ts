// THE CHEZ from Lewis's own recording of the car (public/chez/, cut from his drive to the park):
// the contactor's clunk, the start (a contactor closing and the motor climbing), a three-second
// cruise loop and the stop (the contactor letting go as it rolls to a halt). Where the clips can't
// be fetched or decoded, it falls back to the made-up voice (chezSynth.ts).
import { SynthMotor } from './chezSynth';
import { DOPPLER, bus, passCurve, type ChezMotor, type ChezOptions } from './chezTypes';

const NAMES = ['contactor', 'start', 'cruise', 'stop'] as const;
type Clips = Record<(typeof NAMES)[number], AudioBuffer>;
type Loader = (ctx: BaseAudioContext, name: string) => Promise<AudioBuffer>;

/** The start clip's motor ends a little above cruise (its 2nd harmonic near 534 Hz against 490). */
const SETTLE_FROM = 1.09;
const SETTLE = 2.5;
const XFADE = 0.4;
/** From the contactor's clunk to the start clip. */
const START_LEAD = 0.45;
/** The clips' level against the made-up voice's. */
const GAIN = 1.2;

let loader: Loader = async (ctx, name) => {
  const res = await fetch(`./chez/chez-${name}.ogg`);
  if (!res.ok) throw new Error(`chez-${name}.ogg: ${res.status}`);
  return ctx.decodeAudioData(await res.arrayBuffer());
};
const loaded = new WeakMap<BaseAudioContext, Promise<Clips | undefined>>();

/** Replaces how the clips are fetched (tests, offline renders). */
export function setChezClipLoader(l: Loader): void {
  loader = l;
}

function clips(ctx: BaseAudioContext): Promise<Clips | undefined> {
  let p = loaded.get(ctx);
  if (!p) {
    p = Promise.all(NAMES.map((n) => loader(ctx, n)))
      .then((b) => Object.fromEntries(NAMES.map((n, i) => [n, b[i]])) as Clips)
      .catch(() => undefined);
    loaded.set(ctx, p);
  }
  return p;
}

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
}

export class ClipMotor implements ChezMotor {
  private chain: [GainNode, ...AudioNode[]];
  private gen = 0;
  private now: Voice[] = [];
  private live = new Set<Voice>();
  private synth?: SynthMotor;
  moving = false;

  constructor(
    private ctx: BaseAudioContext,
    private out: AudioNode,
    private opts: ChezOptions,
  ) {
    this.chain = bus(ctx, out, opts);
  }

  /** Runs `f` with the clips once they load, unless go/stop/dispose came in between. */
  private withClips(f: (c: Clips) => void, fallback: (s: SynthMotor) => void): void {
    const g = ++this.gen;
    void clips(this.ctx).then((c) => {
      if (g !== this.gen) return;
      if (c) f(c);
      else fallback((this.synth ??= new SynthMotor(this.ctx, this.out, this.opts)));
    });
  }

  go(): void {
    if (this.moving) return;
    this.moving = true;
    this.withClips(
      (c) => {
        const t = this.ctx.currentTime + 0.01;
        this.play(c.contactor, t);
        const start = this.play(c.start, t + START_LEAD);
        const at = t + START_LEAD + c.start.duration - XFADE;
        start.gain.gain.setValueAtTime(GAIN, at);
        start.gain.gain.linearRampToValueAtTime(0, at + XFADE);
        const cruise = this.play(c.cruise, at, true);
        cruise.gain.gain.setValueAtTime(0, at);
        cruise.gain.gain.linearRampToValueAtTime(GAIN, at + XFADE);
        cruise.src.playbackRate.setValueAtTime(SETTLE_FROM, at);
        cruise.src.playbackRate.linearRampToValueAtTime(1, at + SETTLE);
        this.now = [start, cruise];
      },
      (s) => s.go(),
    );
  }

  stop(): void {
    if (!this.moving) return;
    this.moving = false;
    const playing = this.now;
    this.now = [];
    this.withClips(
      (c) => {
        const t = this.ctx.currentTime + 0.01;
        for (const v of playing) this.fadeOut(v, t, 0.15);
        if (playing.length) this.play(c.stop, t);
      },
      (s) => s.stop(),
    );
  }

  passBy(seconds: number): void {
    this.withClips(
      (c) => {
        const t = this.ctx.currentTime + 0.01;
        const v = this.play(c.cruise, t, true);
        v.gain.gain.setValueCurveAtTime(
          passCurve().map((x) => x * GAIN),
          t,
          seconds,
        );
        const mid = t + seconds / 2;
        const w = seconds * 0.08;
        v.src.playbackRate.setValueAtTime(1 + DOPPLER, mid - w);
        v.src.playbackRate.linearRampToValueAtTime(1 - DOPPLER, mid + w);
        v.src.stop(t + seconds + 0.05);
      },
      (s) => s.passBy(seconds),
    );
  }

  dispose(): void {
    this.gen++;
    this.moving = false;
    this.now = [];
    for (const v of this.live) this.free(v, true);
    this.live.clear();
    this.synth?.dispose();
    for (const n of this.chain) n.disconnect();
  }

  /** `buf` from `t` (looping or once) through a gain of its own. */
  private play(buf: AudioBuffer, t: number, loop = false): Voice {
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = loop;
    const gain = this.ctx.createGain();
    gain.gain.value = GAIN;
    src.connect(gain).connect(this.chain[0]);
    const v = { src, gain };
    this.live.add(v);
    src.onended = () => {
      this.free(v, false);
      this.live.delete(v);
    };
    src.start(t);
    return v;
  }

  private fadeOut(v: Voice, t: number, len: number): void {
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setTargetAtTime(0, t, len / 3);
    v.src.stop(t + len);
  }

  private free(v: Voice, now: boolean): void {
    if (now) {
      try {
        v.src.stop();
      } catch {
        // already stopped
      }
    }
    v.src.disconnect();
    v.gain.disconnect();
  }
}
