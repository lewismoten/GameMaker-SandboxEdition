// THE CHEZ made on the spot (Web Audio, no files), to the numbers in Lewis's recording of the car:
// the series-wound motor's whine is one harmonic tone, its 2nd harmonic loudest, about 245 Hz at
// cruise; the contactors clack (a bright 20 ms snap and a thump 50 ms later) at the start and at
// the step from 24 V to 48 V (the whine jumps up, as the factory tower switches the pack) and each time the foot comes back on after coasting; road rumble, the cabin's road noise and tire hiss grow with speed
// (matched to the recording's octave bands at cruise: the whine stands about 18 dB over them).
import { CRUISE_HZ, DOPPLER, bus, noiseBuffer, passCurve, type ChezMotor, type ChezOptions } from './chezTypes';

/** Harmonic amplitudes of the whine (dB against the 2nd), measured at cruise. */
const HARMONICS_DB = [-8, 0, -10, -22, -18, -26, -21, -23, -34, -32, -31, -36];
/**
 * The climb from rest: [seconds after the main contactor closes, speed 0..1]. The car has three
 * speeds: low (through the resistor, for backing up only, so never in a pull-away), 24 V (the two
 * batteries in parallel) and 48 V (in series). A road start is a ka-chunk into 24 V, the whine
 * creeping up its plateau, then a ka-chunk into 48 V: the whine jumps and creeps to cruise.
 */
const CLIMB: readonly (readonly [number, number])[] = [
  [0, 0.43],
  [2.3, 0.62],
  [2.38, 0.86],
  [5, 1.0],
];
/** The 48 V ka-chunk (seconds into the climb): the snap and thump, then a second relay's smaller clack. */
const STEPS = [2.3];
/** The second relay of a step clacks this long after the first. */
const RELAY_LAG = 0.13;
/** Coasting (foot off): the contactors drop out and the whine fades over this long as the car rolls. */
const COAST = 3;
/** The speed the whine jumps back to when the contactor closes again after a coast. */
const RESUME_SPEED = 0.86;
/** The switch's click before the contactor pulls in. */
const SWITCH_LEAD = 0.35;
const WIND_DOWN = 1.8;
/** The whine's share of the mix; the noise beds' filters, gains and how they grow with speed (gain * speed^power). */
const WHINE = 0.75;
type Filter = [BiquadFilterType, number, number];
const BEDS: readonly { filters: Filter[]; gain: number; power: number }[] = [
  { filters: [['lowpass', 90, 0.7]], gain: 4.5, power: 1 }, // road rumble
  {
    filters: [
      ['highpass', 160, 0.6],
      ['lowpass', 800, 0.6],
    ],
    gain: 2.7,
    power: 1,
  }, // the cabin's road noise
  {
    filters: [
      ['bandpass', 1800, 0.9],
      ['lowpass', 3500, 0.7],
    ],
    gain: 0.25,
    power: 2,
  }, // tire hiss
];

const waves = new WeakMap<BaseAudioContext, PeriodicWave>();
function whineWave(ctx: BaseAudioContext): PeriodicWave {
  let w = waves.get(ctx);
  if (!w) {
    const real = new Float32Array(HARMONICS_DB.length + 1);
    const imag = real.map((_, i) => (i ? 10 ** (HARMONICS_DB[i - 1] / 20) : 0));
    w = ctx.createPeriodicWave(real, imag);
    waves.set(ctx, w);
  }
  return w;
}

/** Speed (0..1) `s` seconds into the climb. */
export function climbSpeed(s: number): number {
  if (s <= 0) return CLIMB[0][1];
  for (let i = 1; i < CLIMB.length; i++) {
    const [t1, v1] = CLIMB[i];
    if (s <= t1) {
      const [t0, v0] = CLIMB[i - 1];
      return v0 + ((v1 - v0) * (s - t0)) / (t1 - t0);
    }
  }
  return CLIMB[CLIMB.length - 1][1];
}

/** One drive's nodes, from go() (or a pass-by) until it has wound down. */
interface Run {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  whine: OscillatorNode;
  whineGain: GainNode;
  /** The noise beds' gains, in BEDS order. */
  beds: GainNode[];
  /** When the contactor closed (context time). */
  t0: number;
  /** Clunks still to come (the speed steps), with when they start: a stop cancels them. */
  pending: [AudioScheduledSourceNode, number][];
  /** Foot off: the contactors are out and the car is rolling. */
  coasting?: boolean;
}

export class SynthMotor implements ChezMotor {
  private chain: [GainNode, ...AudioNode[]];
  private run?: Run;
  private fading = new Set<Run>();
  moving = false;

  constructor(
    private ctx: BaseAudioContext,
    out: AudioNode,
    opts: ChezOptions,
  ) {
    this.chain = bus(ctx, out, opts);
  }

  go(): void {
    if (this.moving) return;
    this.moving = true;
    const t = this.ctx.currentTime + 0.01;
    const t0 = t + SWITCH_LEAD;
    this.clunk(t, 0.45);
    this.clunk(t0, 1);
    const r = this.start(t, t0, this.chain[0]);
    r.pending = this.steps(t0, this.chain[0], 1);
    for (const [s, v] of CLIMB) this.at(r, t0 + s, v, s ? 'ramp' : 'set');
    this.run = r;
  }

  stop(): void {
    const r = this.run;
    if (!this.moving || !r) return;
    this.moving = false;
    this.run = undefined;
    const t = this.ctx.currentTime + 0.01;
    const v = climbSpeed(t - r.t0);
    for (const [n, at] of r.pending) if (at > t) n.stop(t);
    this.clunk(t, 1.6);
    for (const p of [r.whine.frequency, r.whineGain.gain, ...r.beds.map((b) => b.gain)]) p.cancelScheduledValues(t);
    this.at(r, t, v, 'set');
    // the current is cut: the whine drops at once, then the car rolls to a stop
    r.whine.frequency.linearRampToValueAtTime(CRUISE_HZ * v * 0.45, t + WIND_DOWN);
    r.whineGain.gain.setTargetAtTime(0.3 * this.whineLevel(v), t, 0.03);
    r.whineGain.gain.setTargetAtTime(0.0001, t + 0.2, WIND_DOWN / 4);
    for (const b of r.beds) b.gain.linearRampToValueAtTime(0, t + WIND_DOWN);
    this.retire(r, t + WIND_DOWN + 0.1);
  }

  coast(): void {
    const r = this.run;
    if (!this.moving || !r || r.coasting) return;
    r.coasting = true;
    const t = this.ctx.currentTime + 0.01;
    const v = climbSpeed(t - r.t0);
    for (const [n, at] of r.pending) if (at > t) n.stop(t);
    for (const p of [r.whine.frequency, r.whineGain.gain, ...r.beds.map((b) => b.gain)]) p.cancelScheduledValues(t);
    this.at(r, t, v, 'set');
    this.coastFrom(r, t, v, this.chain[0]);
  }

  resume(): void {
    const r = this.run;
    if (!this.moving || !r || !r.coasting) return;
    r.coasting = false;
    const t = this.ctx.currentTime + 0.01;
    for (const p of [r.whine.frequency, r.whineGain.gain, ...r.beds.map((b) => b.gain)]) p.cancelScheduledValues(t);
    this.resumeAt(r, t, this.chain[0]);
  }

  /** Foot off at `t` from speed `v`: the contactors drop out (a clunk), the whine falls away while the noise eases. */
  private coastFrom(r: Run, t: number, v: number, dest: AudioNode): void {
    this.clunk(t, 1.3, dest);
    r.whineGain.gain.setTargetAtTime(0.0001, t + 0.1, COAST / 4);
    r.whine.frequency.linearRampToValueAtTime(CRUISE_HZ * v * 0.6, t + COAST);
    r.beds.forEach((b, i) => b.gain.linearRampToValueAtTime(BEDS[i].gain * v ** BEDS[i].power * 0.55, t + COAST));
  }

  /** Foot back on at `t`: the contactor closes again (a ka-chunk) and the whine jumps to the 48 V plateau. */
  private resumeAt(r: Run, t: number, dest: AudioNode): void {
    this.clunk(t, 1.6, dest);
    this.clunk(t + RELAY_LAG, 0.7, dest);
    r.whine.frequency.setValueAtTime(CRUISE_HZ * 0.6, t);
    this.at(r, t + 0.08, RESUME_SPEED, 'ramp');
    this.at(r, t + 1.8, 0.95, 'ramp');
    r.whineGain.gain.setTargetAtTime(this.whineLevel(RESUME_SPEED), t, 0.04);
  }

  passBy(seconds: number, pullAway = false): void {
    const t = this.ctx.currentTime + 0.01;
    const env = this.ctx.createGain();
    // a pull-away starts in front of the window: the ka-chunks, then it drives off and fades
    env.gain.setValueCurveAtTime(pullAway ? passCurve().slice(16) : passCurve(), t, seconds);
    env.connect(this.chain[0]);
    const r = this.start(t, t, env);
    r.nodes.push(env);
    if (pullAway) {
      this.clunk(t, 1, env);
      r.pending = this.steps(t, env, 1);
      for (const [s, v] of CLIMB) this.at(r, t + s, v, s ? 'ramp' : 'set');
      // normal road driving: a lift of the foot to coast, then back on the pedal
      const lift = CLIMB[CLIMB.length - 1][0] + 0.6;
      this.coastFrom(r, t + lift, 1, env);
      this.resumeAt(r, t + Math.min(lift + COAST * 0.9, seconds - 2), env);
      this.retire(r, t + seconds + 0.05);
      return;
    }
    this.at(r, t, 1, 'set');
    const mid = t + seconds / 2;
    const w = seconds * 0.08;
    r.whine.frequency.setValueAtTime(CRUISE_HZ * (1 + DOPPLER), mid - w);
    r.whine.frequency.linearRampToValueAtTime(CRUISE_HZ * (1 - DOPPLER), mid + w);
    this.retire(r, t + seconds + 0.05);
  }

  dispose(): void {
    this.moving = false;
    if (this.run) this.fading.add(this.run);
    this.run = undefined;
    for (const r of this.fading) this.free(r, true);
    this.fading.clear();
    for (const n of this.chain) n.disconnect();
  }

  private whineLevel(v: number): number {
    return WHINE * (0.3 + 0.7 * Math.min(1, v));
  }

  /** The speed `v` at `t` on every part of `r`: set there, or ramped to by then. */
  private at(r: Run, t: number, v: number, how: 'set' | 'ramp'): void {
    const pairs: [AudioParam, number][] = [
      [r.whine.frequency, CRUISE_HZ * Math.max(v, 0.05)],
      [r.whineGain.gain, this.whineLevel(v)],
      ...r.beds.map((b, i): [AudioParam, number] => [b.gain, BEDS[i].gain * Math.min(v, 1) ** BEDS[i].power]),
    ];
    for (const [p, x] of pairs) {
      if (how === 'set') p.setValueAtTime(x, t);
      else p.linearRampToValueAtTime(x, t);
    }
  }

  /** A new run's nodes into `input`, running from `t`, silent until its speed is set. */
  private start(t: number, t0: number, input: AudioNode): Run {
    const c = this.ctx;
    const whine = c.createOscillator();
    whine.setPeriodicWave(whineWave(c));
    const whineGain = c.createGain();
    whine.connect(whineGain).connect(input);
    // a slow wobble in the whine, as the load on the motor changes
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.7;
    const depth = c.createGain();
    depth.gain.value = 6; // cents
    lfo.connect(depth).connect(whine.detune);
    const noise = c.createBufferSource();
    noise.buffer = noiseBuffer(c);
    noise.loop = true;
    const nodes: AudioNode[] = [whineGain, depth];
    const beds = BEDS.map((b) => {
      let from: AudioNode = noise;
      for (const [type, f, q] of b.filters) {
        const filter = c.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = f;
        filter.Q.value = q;
        from = from.connect(filter);
        nodes.push(filter);
      }
      const g = c.createGain();
      from.connect(g).connect(input);
      return g;
    });
    const r: Run = { sources: [whine, lfo, noise], nodes, whine, whineGain, beds, t0, pending: [] };
    for (const p of [whineGain.gain, ...beds.map((b) => b.gain)]) p.setValueAtTime(0, t);
    for (const s of r.sources) s.start(t);
    return r;
  }

  /** The ka-chunk of each speed step from `t0`: the tower's relay, then a second one's smaller clack. */
  private steps(t0: number, dest: AudioNode, k: number): [AudioScheduledSourceNode, number][] {
    return STEPS.flatMap((s) => [
      ...this.clunk(t0 + s, 1.6 * k, dest).map((n): [AudioScheduledSourceNode, number] => [n, t0 + s]),
      ...this.clunk(t0 + s + RELAY_LAG, 0.7 * k, dest).map((n): [AudioScheduledSourceNode, number] => [n, t0 + s + RELAY_LAG]),
    ]);
  }

  /** A contactor at `t`: a snap with a metallic ring (centered near 2 kHz, as recorded), then the armature's thump. */
  private clunk(t: number, k: number, input: AudioNode = this.chain[0]): AudioScheduledSourceNode[] {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const snap = c.createBiquadFilter();
    snap.type = 'bandpass';
    snap.frequency.value = 2200;
    snap.Q.value = 0.7;
    const ring = c.createBiquadFilter();
    ring.type = 'bandpass';
    ring.frequency.value = 2600;
    ring.Q.value = 9;
    const gs = c.createGain();
    gs.gain.setValueAtTime(k * 2.4, t);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    const gr = c.createGain();
    gr.gain.setValueAtTime(k * 3, t);
    gr.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(snap).connect(gs).connect(input);
    src.connect(ring).connect(gr).connect(input);
    const thump = c.createOscillator();
    const gt = c.createGain();
    thump.frequency.setValueAtTime(130, t + 0.045);
    thump.frequency.exponentialRampToValueAtTime(55, t + 0.115);
    gt.gain.setValueAtTime(0, t);
    gt.gain.setValueAtTime(k * 1.6, t + 0.045);
    gt.gain.exponentialRampToValueAtTime(0.001, t + 0.135);
    thump.connect(gt).connect(input);
    src.start(t, Math.random() * 0.5, 0.08);
    thump.start(t);
    thump.stop(t + 0.15);
    thump.onended = () => {
      for (const n of [src, thump, snap, ring, gs, gr, gt]) n.disconnect();
    };
    return [src, thump];
  }

  /** `r` stops at `end` and frees itself then. */
  private retire(r: Run, end: number): void {
    this.fading.add(r);
    for (const s of r.sources) s.stop(end);
    r.sources[0].onended = () => {
      this.free(r, false);
      this.fading.delete(r);
    };
  }

  private free(r: Run, now: boolean): void {
    for (const s of [...r.sources, ...(now ? r.pending.map(([n]) => n) : [])]) {
      if (now) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
      s.disconnect();
    }
    for (const n of [...r.nodes, ...r.beds]) n.disconnect();
  }
}
