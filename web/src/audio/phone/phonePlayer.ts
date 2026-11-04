// Plays the phone's recorded clips (public/phone/voice, phoneClips.ts) down one shared "phone line":
// a 300 to 3400 Hz band-pass with a little hiss, live in Web Audio, so the clips stay clean files.
// They follow the Voice channel (sound settings) like every voice. A line with no clip, or a clip
// that won't load or decode, is spoken by the browser (audio/voices.ts) instead.
import { audioContext } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { channelGain, onMix } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { output } from '@lewismoten/gamemaker-sandbox-engine/audio/output';
import { speak, type Voice } from '../voices';
import { clipsFor } from './phoneClips';

/** Seconds of quiet kept after the last sound of a clip (the clips end with a longer silent tail). */
const TAIL = 0.05;
/** Seconds between one clip and the next. */
const GAP = 0.12;
/** The line's band, as on a 1994 phone. */
export const BAND = { low: 300, high: 3400 };

/** Where a clip's sound ends: the last sample above a whisper, in seconds. */
export function soundEnd(samples: Float32Array, rate: number, floor = 0.01): number {
  let i = samples.length - 1;
  while (i > 0 && Math.abs(samples[i]) < floor) i--;
  return (i + 1) / rate;
}

interface Chain {
  ctx: AudioContext;
  input: AudioNode;
  level: GainNode;
  hiss: GainNode;
}
let chain: Chain | undefined;

function line(ctx: AudioContext): Chain {
  if (chain?.ctx === ctx) return chain;
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = BAND.low;
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = BAND.high;
  const level = ctx.createGain();
  high.connect(low).connect(level).connect(output(ctx));
  // hiss: white noise through the same band, only while someone is talking
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const hiss = ctx.createGain();
  hiss.gain.value = 0;
  src.connect(hiss).connect(high);
  src.start();
  onMix(() => (level.gain.value = channelGain('voice')));
  level.gain.value = channelGain('voice');
  return (chain = { ctx, input: high, level, hiss });
}

const decoded = new Map<string, Promise<{ buffer: AudioBuffer; seconds: number } | undefined>>();

function load(ctx: AudioContext, clip: string) {
  let p = decoded.get(clip);
  if (!p) {
    p = fetch(`./phone/voice/${clip}.ogg`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((buffer) => ({ buffer, seconds: Math.min(buffer.duration, soundEnd(buffer.getChannelData(0), buffer.sampleRate) + TAIL) }))
      .catch(() => undefined);
    decoded.set(clip, p);
  }
  return p;
}

/** Plays the clips in order; false when they can't (so the caller speaks instead), true when done or hung up. */
async function playClips(clips: string[], signal: AbortSignal): Promise<boolean> {
  const ctx = audioContext();
  if (!ctx || channelGain('voice') <= 0) return false;
  const loaded = await Promise.all(clips.map((c) => load(ctx, c)));
  if (signal.aborted) return true;
  if (loaded.some((c) => !c)) return false;
  const l = line(ctx);
  return new Promise((resolve) => {
    const sources: AudioBufferSourceNode[] = [];
    let at = ctx.currentTime + 0.03;
    for (const c of loaded) {
      const s = ctx.createBufferSource();
      s.buffer = c!.buffer;
      s.connect(l.input);
      s.start(at, 0, c!.seconds);
      sources.push(s);
      at += c!.seconds + GAP;
    }
    l.hiss.gain.setTargetAtTime(0.012, ctx.currentTime, 0.02);
    const finish = () => {
      signal.removeEventListener('abort', finish);
      for (const s of sources) {
        s.onended = null;
        try {
          s.stop();
        } catch {
          // already ended
        }
      }
      l.hiss.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      resolve(true);
    };
    sources[sources.length - 1].onended = finish;
    signal.addEventListener('abort', finish);
  });
}

/** Says a caption piece of `whole` (the line `say` was given): its recorded clips, else the browser's speech. */
export async function speakLine(piece: string, whole: string, v: Voice, signal: AbortSignal): Promise<void> {
  const clips = clipsFor(piece, whole);
  if (clips && (await playClips(clips, signal))) return;
  if (!signal.aborted) await speak(piece, v, signal);
}
