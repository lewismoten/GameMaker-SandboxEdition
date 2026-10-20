// Sorting digital sounds into kinds by listening to them the way a program can: how long
// they are, how their loudness rises and falls, how bright or noisy they are (zero
// crossings) and whether they have a steady, sweeping or speech-like pitch. Plain
// arithmetic on the samples, so the same sound always lands in the same group.

export type SoundGroup = 'blip' | 'zap' | 'boom' | 'voice' | 'tone' | 'long';

export const SOUND_GROUPS: { id: SoundGroup; label: string; icon: string; hint: string }[] = [
  { id: 'blip', label: 'Blips & clicks', icon: '•', hint: 'very short' },
  { id: 'zap', label: 'Zaps & lasers', icon: '⚡', hint: 'pitch sweeps up or down' },
  { id: 'boom', label: 'Explosions & noise', icon: '💥', hint: 'noisy, no clear pitch' },
  { id: 'voice', label: 'Voices & speech', icon: '🗣', hint: 'syllables with a voice-like pitch' },
  { id: 'tone', label: 'Music & tones', icon: '♪', hint: 'a steady, clear pitch' },
  { id: 'long', label: 'Long & ambience', icon: '〰', hint: 'longer than 3 seconds' },
];

export interface SoundProfile {
  seconds: number;
  /** Loudest sample, 0..1. */
  peak: number;
  /** Zero crossings per second over the loud parts: how bright or hissy. */
  zcr: number;
  /** How much the zero-crossing rate wanders between loud frames (0 = steady). */
  zcrSpread: number;
  /** 0..1: how strongly the loud frames repeat themselves (1 = a pure tone, ~0 = noise). */
  periodicity: number;
  /** Median pitch in Hz of the periodic frames, 0 if none. */
  pitch: number;
  /** Change in pitch from the first to the last pitched frame along its trend, in octaves (+ rises). */
  pitchSlope: number;
  /** 0..1: share of frame-to-frame pitch steps that follow the trend (a clean sweep is near 1). */
  pitchSteady: number;
  /** Separate loud bursts (syllables, hits). */
  bursts: number;
  /** Share of the sound spent above half its peak loudness. */
  sustain: number;
  /** Where the loudest frame is, 0 (start) .. 1 (end). */
  peakAt: number;
}

const FRAME_SECONDS = 0.02;

/** Measures a sound. Long sounds are measured on at most ~200 frames, evenly spaced. */
export function profileSound(samples: Float32Array, rate: number): SoundProfile {
  const seconds = samples.length / rate;
  const frame = Math.max(32, Math.round(rate * FRAME_SECONDS));
  const count = Math.max(1, Math.floor(samples.length / frame));
  const rms = new Float32Array(count);
  let peak = 0;
  for (let f = 0; f < count; f++) {
    let sum = 0;
    for (let i = f * frame, e = Math.min(samples.length, i + frame); i < e; i++) {
      const v = samples[i];
      sum += v * v;
      if (Math.abs(v) > peak) peak = Math.abs(v);
    }
    rms[f] = Math.sqrt(sum / frame);
  }
  let loudest = 0;
  for (let f = 1; f < count; f++) if (rms[f] > rms[loudest]) loudest = f;
  const top = rms[loudest] || 1e-9;

  // loudness envelope: bursts are rises above 40% after a dip below 15%
  let bursts = 0;
  let above = 0;
  let inBurst = false;
  for (let f = 0; f < count; f++) {
    const r = rms[f] / top;
    if (r >= 0.5) above++;
    if (!inBurst && r >= 0.4) {
      inBurst = true;
      bursts++;
    } else if (inBurst && r < 0.15) inBurst = false;
  }

  // per loud frame: zero crossings and autocorrelation pitch
  const step = Math.max(1, Math.floor(count / 200));
  const zcrs: number[] = [];
  const pitches: { at: number; hz: number }[] = [];
  let perSum = 0;
  let perN = 0;
  const minLag = Math.max(2, Math.floor(rate / 1500));
  const maxLag = Math.min(frame * 2, Math.floor(rate / 60));
  const win = Math.min(samples.length, frame * 2);
  for (let f = 0; f < count; f += step) {
    if (rms[f] < top * 0.1) continue;
    const s = f * frame;
    let z = 0;
    for (let i = s + 1, e = Math.min(samples.length, s + frame); i < e; i++) if (samples[i - 1] < 0 !== samples[i] < 0) z++;
    if (rms[f] >= top * 0.25) zcrs.push((z * rate) / frame);
    // normalized autocorrelation over a window of two frames
    const a = Math.max(0, Math.min(samples.length - win - maxLag, s));
    if (a < 0 || a + win + maxLag > samples.length) continue;
    let e0 = 0;
    for (let i = a; i < a + win; i++) e0 += samples[i] * samples[i];
    if (e0 <= 0) continue;
    let best = 0;
    let bestLag = 0;
    let prev = 1;
    let rising = false;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let c = 0;
      let e1 = 0;
      for (let i = a; i < a + win; i++) {
        c += samples[i] * samples[i + lag];
        e1 += samples[i + lag] * samples[i + lag];
      }
      const r = c / Math.sqrt(e0 * e1 || 1);
      // the first strong peak after the correlation has dipped is the period
      if (r > prev) rising = true;
      if (rising && r > best) {
        best = r;
        bestLag = lag;
      }
      prev = r;
    }
    if (rms[f] >= top * 0.25) {
      perSum += Math.max(0, best);
      perN++;
    }
    if (best > 0.5 && bestLag) pitches.push({ at: f / count, hz: rate / bestLag });
  }
  const mean = zcrs.reduce((n, v) => n + v, 0) / (zcrs.length || 1);
  const spread = zcrs.length ? Math.sqrt(zcrs.reduce((n, v) => n + (v - mean) ** 2, 0) / zcrs.length) / (mean || 1) : 0;
  const median = (xs: number[]) => {
    if (!xs.length) return 0;
    const s = [...xs].sort((x, y) => x - y);
    return s[s.length >> 1];
  };
  const pitch = median(pitches.map((p) => p.hz));
  // pitch trend: a least-squares line through log2(pitch) over the sound's length
  let slope = 0;
  let steady = 0;
  if (pitches.length >= 3) {
    const xs = pitches.map((p) => p.at);
    const ys = pitches.map((p) => Math.log2(p.hz));
    const mx = xs.reduce((n, v) => n + v, 0) / xs.length;
    const my = ys.reduce((n, v) => n + v, 0) / ys.length;
    let sxy = 0;
    let sxx = 0;
    for (let i = 0; i < xs.length; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
    }
    const k = sxx ? sxy / sxx : 0;
    slope = k * (xs[xs.length - 1] - xs[0]);
    // how many steps from one pitched frame to the next go the trend's way (or hold)
    let agree = 0;
    for (let i = 1; i < ys.length; i++) {
      const d = ys[i] - ys[i - 1];
      if (Math.abs(d) < 0.08 || Math.sign(d) === Math.sign(k)) agree++;
    }
    steady = agree / (ys.length - 1);
  }
  return {
    seconds,
    peak,
    zcr: mean,
    zcrSpread: spread,
    periodicity: perN ? perSum / perN : 0,
    pitch,
    pitchSlope: slope,
    pitchSteady: steady,
    bursts,
    sustain: above / count,
    peakAt: count > 1 ? loudest / (count - 1) : 0,
  };
}

/** Which group a measured sound belongs to. */
export function classifyProfile(p: SoundProfile): SoundGroup {
  if (p.seconds < 0.18) return 'blip';
  if (p.seconds > 3) return 'long';
  const tonal = p.periodicity >= 0.75;
  const noisy = p.periodicity < 0.45;
  // a sweep: a big, mostly one-way pitch change; low sweeps must be clean to not be a voice
  const sweep = Math.abs(p.pitchSlope) >= 0.6 && p.pitchSteady >= 0.65 && p.seconds < 2 && p.periodicity >= 0.45;
  if (sweep && (p.pitch >= 250 || (p.pitchSteady >= 0.9 && p.zcrSpread < 0.3))) return 'zap';
  if (noisy) return 'boom';
  if (p.bursts >= 2 && p.pitch >= 70 && p.pitch <= 450 && !tonal) return 'voice';
  if (tonal && p.zcrSpread < 0.35) return 'tone';
  if (p.pitch >= 70 && p.pitch <= 450 && p.zcrSpread >= 0.2) return 'voice';
  if (p.seconds < 0.35) return 'blip';
  return tonal ? 'tone' : 'boom';
}

export function classifySound(samples: Float32Array, rate: number): SoundGroup {
  return classifyProfile(profileSound(samples, rate));
}
