// A little music box, synthesized: each note a plucked steel tooth of a comb (a strong
// fundamental, the bright clamped-bar overtone that dies at once, the click of the pin), in a
// small wooden box (a short echo). It plays "Yankee Doodle" round and round, through the desk
// speakers' volume knob (audio/output.ts).
import { output } from '../audio/output';
import { audioContext, unlock } from '../audio/context';

/** Eighth notes as MIDI numbers; 0 holds the note before. In G, up where music boxes sing. */
const TUNE = [
  // Yankee Doodle went to town, a-riding on a pony,
  79, 79, 81, 83, 79, 83, 81, 74, 79, 79, 81, 83, 79, 0, 78, 0,
  // stuck a feather in his cap and called it macaroni.
  79, 79, 81, 83, 84, 83, 81, 79, 78, 74, 76, 78, 79, 0, 79, 0,
  // Yankee Doodle keep it up, Yankee Doodle dandy,
  88, 90, 88, 86, 88, 90, 91, 0, 86, 88, 86, 84, 83, 0, 79, 0,
  // mind the music and the step, and with the girls be handy.
  88, 90, 88, 86, 88, 90, 91, 88, 86, 79, 78, 81, 79, 0, 79, 0,
];
/** A low tooth on each half bar: the tune's chords, as plainly as a cylinder can. */
const BASS = [67, 67, 62, 67, 67, 67, 62, 67, 72, 67, 62, 67, 72, 67, 62, 67];
const EIGHTH = 0.23;
/** Two bars of rest before it comes round again. */
const LOOP = TUNE.length + 8;

const MUTE_KEY = 'gm-musicbox';

export function musicBoxMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'off';
  } catch {
    return false;
  }
}

function rememberMuted(off: boolean): void {
  try {
    if (off) localStorage.setItem(MUTE_KEY, 'off');
    else localStorage.removeItem(MUTE_KEY);
  } catch {
    /* private mode */
  }
}

export interface MusicBox {
  /** Starts (or carries on) playing, unless muted. */
  play: () => void;
  stop: () => void;
  muted: () => boolean;
  setMuted: (off: boolean) => void;
  dispose: () => void;
}

export function musicBox(): MusicBox {
  let ctx: AudioContext | undefined;
  let master: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  let timer = 0;
  let step = 0;
  let next = 0;
  let playing = false;
  let off = musicBoxMuted();

  const setup = () => {
    if (ctx) return ctx;
    ctx = audioContext();
    if (!ctx) return undefined;
    master = ctx.createGain();
    master.gain.value = 0.22;
    // the box: a short, darkened echo
    const echo = ctx.createDelay(0.5);
    echo.delayTime.value = 0.085;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    master.connect(output(ctx));
    master.connect(echo);
    echo.connect(tone);
    tone.connect(fb);
    fb.connect(echo);
    tone.connect(output(ctx));
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.02), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    return ctx;
  };

  const pluck = (at: number, midi: number, vel: number) => {
    if (!ctx || !master) return;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    for (const [ratio, amp, decay] of [[1, 1, 1.9], [2, 0.12, 0.5], [3, 0.05, 0.25], [6.27, 0.22, 0.09]]) {
      if (f * ratio > ctx.sampleRate / 2.2) continue;
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(amp * vel, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, at + decay * (ratio === 1 ? Math.min(1, 900 / f + 0.45) : 1));
      o.connect(g);
      g.connect(master);
      o.start(at);
      o.stop(at + decay + 0.05);
    }
    if (noise) {
      const n = ctx.createBufferSource();
      n.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 3500;
      const g = ctx.createGain();
      g.gain.value = 0.06 * vel;
      n.connect(hp);
      hp.connect(g);
      g.connect(master);
      n.start(at);
    }
  };

  const schedule = () => {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.35) {
      const i = step % LOOP;
      if (i < TUNE.length) {
        const m = TUNE[i];
        // a cylinder's pins are never quite even
        const t = next + (Math.random() - 0.5) * 0.008;
        if (m) pluck(t, m, 0.75 + Math.random() * 0.2);
        if (i % 4 === 0) pluck(t, BASS[Math.floor(i / 4) % BASS.length], 0.45);
      }
      step++;
      next += EIGHTH;
    }
  };

  const play = () => {
    if (off || playing) return;
    const c = setup();
    if (!c) return;
    unlock();
    playing = true;
    next = c.currentTime + 0.15;
    schedule();
    timer = window.setInterval(schedule, 90);
  };

  const stop = () => {
    playing = false;
    clearInterval(timer);
    // let the last notes ring out
    if (ctx && master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      const c = ctx;
      const m = master;
      setTimeout(() => !playing && c.state !== 'closed' && m.gain.setValueAtTime(0.22, c.currentTime), 600);
    }
  };

  return {
    play: () => {
      if (ctx && master) master.gain.cancelScheduledValues(ctx.currentTime), master.gain.setValueAtTime(0.22, ctx.currentTime);
      play();
    },
    stop,
    muted: () => off,
    setMuted: (v) => {
      off = v;
      rememberMuted(v);
      if (v) stop();
    },
    dispose: () => {
      stop();
      // (the page's AudioContext is shared: only the box's own nodes go)
      const m = master;
      ctx = master = undefined;
      setTimeout(() => m?.disconnect(), 700);
    },
  };
}
