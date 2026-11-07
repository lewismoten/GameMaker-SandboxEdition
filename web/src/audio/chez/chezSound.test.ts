// THE CHEZ's shared sound: the lifecycle of both voices with a fake audio context (what starts,
// what stops, what is freed). How it sounds is checked by ear from offline renders.
import { afterEach, describe, expect, it } from 'vitest';
import { CHEZ_SOUND, chezMotor, chezPassBy } from './chezSound';
import { climbSpeed } from './chezSynth';

class FakeParam {
  value = 0;
  events: string[] = [];
  private log(name: string) {
    return () => {
      this.events.push(name);
      return this;
    };
  }
  setValueAtTime = this.log('set');
  linearRampToValueAtTime = this.log('ramp');
  exponentialRampToValueAtTime = this.log('exp');
  setTargetAtTime = this.log('target');
  setValueCurveAtTime = this.log('curve');
  cancelScheduledValues = this.log('cancel');
}

class FakeNode {
  kind: string;
  outs = new Set<FakeNode>();
  freed = false;
  started?: number;
  stopped?: number;
  onended: (() => void) | null = null;
  gain = new FakeParam();
  frequency = new FakeParam();
  detune = new FakeParam();
  Q = new FakeParam();
  playbackRate = new FakeParam();
  type = '';
  loop = false;
  loopEnd = 0;
  buffer: unknown;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(n: FakeNode) {
    this.outs.add(n);
    return n;
  }
  disconnect() {
    this.outs.clear();
    this.freed = true;
  }
  start(t = 0, _offset = 0, duration?: number) {
    this.started = t;
    if (duration !== undefined) this.stop(t + duration);
  }
  stop(t = 0) {
    this.stopped = Math.min(t, this.stopped ?? Infinity);
  }
  setPeriodicWave() {}
}

function fakeContext() {
  const nodes: FakeNode[] = [];
  const make = (kind: string) => () => {
    const n = new FakeNode(kind);
    nodes.push(n);
    return n;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    destination: new FakeNode('destination'),
    createGain: make('gain'),
    createBiquadFilter: make('filter'),
    createOscillator: make('osc'),
    createBufferSource: make('source'),
    createBuffer: (_c: number, n: number, sr: number) => ({ duration: n / sr, getChannelData: () => new Float32Array(n) }),
    createPeriodicWave: () => ({}),
  };
  const sources = () => nodes.filter((n) => n.started !== undefined);
  /** When `n` ends: its stop, or the end of a one-shot buffer. */
  const ends = (n: FakeNode) => {
    const once = !n.loop && n.buffer && (n.buffer as AudioBuffer).duration < 60 ? n.started! + (n.buffer as AudioBuffer).duration : Infinity;
    return Math.min(n.stopped ?? Infinity, once);
  };
  /** Moves the clock to `t` and ends every source stopped by then. */
  const until = (t: number) => {
    ctx.currentTime = t;
    for (const n of sources()) {
      if (ends(n) <= t && n.onended) {
        const f = n.onended;
        n.onended = null;
        f();
      }
    }
  };
  return { ctx, nodes, sources, until, as: ctx as unknown as BaseAudioContext, out: ctx.destination as unknown as AudioNode };
}

afterEach(() => setChezClipLoader(() => Promise.reject(new Error('no clips in tests'))));

describe('CHEZ_SOUND', () => {
  it('is the made-up voice until Lewis picks', () => {
    expect(CHEZ_SOUND).toBe('synth');
  });
});

describe('the climb', () => {
  it('starts slow, climbs through its steps past cruise, then settles at cruise', () => {
    expect(climbSpeed(0)).toBeLessThan(0.1);
    expect(climbSpeed(1.3)).toBeCloseTo(0.4);
    expect(climbSpeed(4.6)).toBeGreaterThan(1);
    expect(climbSpeed(20)).toBe(1);
    for (let s = 0; s < 4.6; s += 0.1) expect(climbSpeed(s + 0.1)).toBeGreaterThanOrEqual(climbSpeed(s));
  });
});

describe('the made-up voice', () => {
  it('is silent until go(); go() starts the motor and clunks; a second go() adds nothing', () => {
    const f = fakeContext();
    const m = chezMotor(f.as, f.out, {});
    expect(f.sources()).toHaveLength(0);
    m.go();
    expect(m.moving).toBe(true);
    const n = f.sources().length;
    expect(f.sources().filter((s) => s.kind === 'osc').length).toBeGreaterThan(2); // the whine, its wobble, the clunks' thumps
    m.go();
    expect(f.sources()).toHaveLength(n);
  });

  it('stop() winds down and frees the run; go() again starts a new one', () => {
    const f = fakeContext();
    const m = chezMotor(f.as, f.out, {});
    m.go();
    f.until(3);
    m.stop();
    expect(
      f
        .sources()
        .filter((s) => s.started! > 3.02)
        .every((s) => s.stopped! <= 3.02),
    ).toBe(true); // no step clunk after the stop
    expect(m.moving).toBe(false);
    const run = f.sources().filter((s) => s.stopped !== undefined && s.stopped > 3);
    expect(run.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...run.map((s) => s.stopped!))).toBeLessThan(6);
    f.until(6);
    expect(f.sources().every((s) => s.freed)).toBe(true);
    m.stop(); // nothing more to stop
    const before = f.sources().length;
    m.go();
    expect(f.sources().length).toBeGreaterThan(before);
  });

  it('dispose() silences and frees everything at once, the output chain too', () => {
    const f = fakeContext();
    const m = chezMotor(f.as, f.out, { outside: true });
    m.go();
    f.until(1);
    m.dispose();
    expect(m.moving).toBe(false);
    const later = f.sources().filter((s) => s.started! > 1);
    expect(later.length).toBeGreaterThan(0); // the speed steps' clunks
    expect(later.every((s) => s.stopped! <= 1 && s.freed)).toBe(true);
    f.until(2);
    expect(f.sources().every((s) => s.freed)).toBe(true);
    expect(f.nodes.filter((n) => n.kind === 'filter' && n.outs.has(f.ctx.destination))).toHaveLength(0);
  });

  it('a pass-by runs at cruise for its time, with no clunks, and frees itself', () => {
    const f = fakeContext();
    chezPassBy(f.as, f.out, 11, { outside: true });
    const s = f.sources();
    expect(s.length).toBe(3); // the whine, its wobble, the noise
    expect(s.every((n) => n.stopped !== undefined && n.stopped > 10.9 && n.stopped < 11.2)).toBe(true);
    f.until(12);
    expect(s.every((n) => n.freed)).toBe(true);
  });
});
