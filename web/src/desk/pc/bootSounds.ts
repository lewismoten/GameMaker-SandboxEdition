// The PC's insides coming to life at the power switch: the fans spin up into a steady whir, the
// hard disk's motor winds up, its heads unpark with a clunk and chatter through CONFIG.SYS and
// AUTOEXEC.BAT. Made on the spot (no files), through the PC's own line (retro/computer/pcAudio.ts)
// so switching off cuts them at once. Once DOS is at its prompt (settle) they fade away: a moment
// of nostalgia, not a hum under everything that follows. They follow the Sound effects setting,
// and play only after a click or key press: a desk restored as the page loads switches its PC on
// in silence.
import { audioContext, soundUnlocked } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { channelGain } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { pcOutput } from '../../retro/computer/pcAudio';
import { mulberry32 } from '../../seededRandom';

/** Seconds: the fans and the disk reach speed, the heads unpark, the chatter ends. */
const SPIN_UP = 1.6;
const UNPARK = 2.3;
const CHATTER_END = 5.2;
/** Seconds the whir takes to fade once DOS is at its prompt (or, at the latest, FADE_BY in). */
const FADE = 3;
const FADE_BY = 14;

let noiseBuf: { ctx: BaseAudioContext; buf: AudioBuffer } | undefined;

/** Two seconds of white noise to loop, made once per context. */
function noise(ctx: BaseAudioContext): AudioBuffer {
  if (noiseBuf?.ctx === ctx) return noiseBuf.buf;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const rnd = mulberry32(486);
  for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
  noiseBuf = { ctx, buf };
  return buf;
}

/** Starts the boot's sounds; `settle()` fades them out. Undefined when there is no sound to make. */
export function bootSounds(): { settle(): void } | undefined {
  const ctx = audioContext();
  const level = channelGain('sfx');
  // a press of the power switch that was the page's first gesture: the context is resuming
  const pressed = soundUnlocked() || !!navigator.userActivation?.isActive;
  if (!ctx || !pressed || level === 0) return undefined;
  const t0 = ctx.currentTime + 0.02;
  const master = ctx.createGain();
  master.gain.value = level;
  master.connect(pcOutput(ctx));
  const sources: AudioScheduledSourceNode[] = [];
  const begin = (s: AudioScheduledSourceNode, at = t0) => (s.start(at), sources.push(s));

  // the fans: air through the grilles (filtered noise opening up as they speed up) and the
  // blades' low thrum rising to pitch
  const air = ctx.createBufferSource();
  air.buffer = noise(ctx);
  air.loop = true;
  const airTone = ctx.createBiquadFilter();
  airTone.type = 'lowpass';
  airTone.Q.value = 0.7;
  airTone.frequency.setValueAtTime(120, t0);
  airTone.frequency.exponentialRampToValueAtTime(650, t0 + SPIN_UP);
  const airGain = ctx.createGain();
  airGain.gain.setValueAtTime(0, t0);
  airGain.gain.linearRampToValueAtTime(0.16, t0 + SPIN_UP);
  air.connect(airTone).connect(airGain).connect(master);
  begin(air);

  const blades = ctx.createOscillator();
  blades.type = 'triangle';
  blades.frequency.setValueAtTime(25, t0);
  blades.frequency.exponentialRampToValueAtTime(118, t0 + SPIN_UP);
  const bladeGain = ctx.createGain();
  bladeGain.gain.setValueAtTime(0, t0);
  bladeGain.gain.linearRampToValueAtTime(0.018, t0 + SPIN_UP);
  blades.connect(bladeGain).connect(master);
  begin(blades);

  // the hard disk's motor winding up to speed: a low hum and a faint high whine above it
  for (const [from, to, peak, type] of [
    [40, 90, 0.014, 'triangle'],
    [300, 2160, 0.0035, 'sine'],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t0);
    o.frequency.exponentialRampToValueAtTime(to, t0 + UNPARK);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + UNPARK);
    o.connect(g).connect(master);
    begin(o);
  }

  /** A short tick of the heads: noise through a band at `freq`. */
  const tick = (at: number, len: number, freq: number, peak: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise(ctx);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, at);
    g.gain.exponentialRampToValueAtTime(0.0005, at + len);
    s.connect(band).connect(g).connect(master);
    s.start(at, (at * 7919) % 1.5);
    s.stop(at + len + 0.01);
  };

  // the heads unpark (a dull clunk), then seek in bursts while DOS reads its files
  tick(t0 + UNPARK, 0.05, 700, 0.5);
  tick(t0 + UNPARK + 0.01, 0.03, 1600, 0.25);
  const rnd = mulberry32(1993);
  for (let t = t0 + UNPARK + 0.35; t < t0 + CHATTER_END; t += 0.15 + rnd() * 0.4) {
    const clicks = 2 + Math.floor(rnd() * 6);
    for (let i = 0; i < clicks; i++, t += 0.025 + rnd() * 0.05) tick(t, 0.008 + rnd() * 0.01, 2200 + rnd() * 1800, 0.3 + rnd() * 0.25);
  }

  const fadeAt = (at: number) => {
    master.gain.cancelScheduledValues(at);
    master.gain.setValueAtTime(level, at);
    master.gain.linearRampToValueAtTime(0, at + FADE);
    for (const s of sources) s.stop(at + FADE + 0.05);
  };
  fadeAt(t0 + FADE_BY); // a boot that never reaches the prompt still goes quiet
  let settled = false;
  return {
    settle() {
      if (settled || ctx.currentTime >= t0 + FADE_BY) return;
      settled = true;
      fadeAt(Math.max(ctx.currentTime, t0 + CHATTER_END)); // the chatter finishes first
    },
  };
}
