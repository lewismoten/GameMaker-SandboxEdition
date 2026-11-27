// Plays the phone's recorded clips (public/phone/voice, phoneClips.ts) down one shared "phone line":
// a 300 to 3400 Hz band-pass with a little hiss, live in Web Audio, so the clips stay clean files.
// They follow the Voice channel (sound settings) like every voice. A line with no clip, or a clip
// that won't load or decode, uses browser speech online. Offline, missing recordings keep
// their written captions and reading time, without a substituted voice.
import { availableOffline } from '../../offline/availability';
import { audioContext } from '@lewismoten/gamemaker-sandbox-engine/audio/context';
import { channelGain, onMix } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';
import { output } from '@lewismoten/gamemaker-sandbox-engine/audio/output';
import { speak, type Voice } from '../voices';
import { castOf, clipGroupsFor } from './phoneClips';
import { CAST } from './phoneCast';

/** Seconds of quiet kept after the last sound of a clip (the clips end with a longer silent tail). */
const TAIL = 0.05;
/** Seconds between the parts of one sentence (a spliced time or bill). */
const GAP = 0.12;
/** Seconds of quiet between one sentence and the next, as a person takes a breath (a voice may set its own: the Hint Giant takes his time). */
const SENTENCE_GAP = 0.5;
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
      .catch(() => {
        decoded.delete(clip);
        return undefined;
      });
    decoded.set(clip, p);
  }
  return p;
}

/** Plays the clips in order; false when they can't (so the caller speaks instead), true when done or hung up. */
async function playClips(groups: string[][], pause: number, signal: AbortSignal): Promise<boolean> {
  const clips = groups.flat();
  if (!clips.length) return true;
  const ctx = audioContext();
  if (!ctx || channelGain('voice') <= 0) return false;
  // the pause after each clip: a breath at the end of a sentence, a short gap inside a splice
  const after = groups.flatMap((g) => g.map((_, i) => (i === g.length - 1 ? pause : GAP)));
  const loaded = await Promise.all(clips.map((c) => load(ctx, c)));
  if (signal.aborted) return true;
  if (loaded.some((c) => !c)) return false;
  const l = line(ctx);
  return new Promise((resolve) => {
    const sources: AudioBufferSourceNode[] = [];
    let at = ctx.currentTime + 0.03;
    loaded.forEach((c, i) => {
      const s = ctx.createBufferSource();
      s.buffer = c!.buffer;
      s.connect(l.input);
      s.start(at, 0, c!.seconds);
      sources.push(s);
      at += c!.seconds + after[i];
    });
    l.hiss.gain.setTargetAtTime(0.012, ctx.currentTime, 0.02);
    let breath: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      clearTimeout(breath);
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
    // the line keeps its hiss through the breath after the last sentence, then the next piece speaks
    sources[sources.length - 1].onended = () => (breath = setTimeout(finish, pause * 1000));
    signal.addEventListener('abort', finish);
  });
}

/** Says a caption piece of `whole` (the line `say` was given): its recorded clips, else the browser's speech. */
export async function speakLine(piece: string, whole: string, v: Voice, signal: AbortSignal, missing?: () => void): Promise<void> {
  const groups = clipGroupsFor(piece, whole);
  const cast = castOf(whole);
  const pause = (cast ? CAST[cast]?.pause : undefined) ?? SENTENCE_GAP;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const available = groups && (await Promise.all(groups.flat().map((clip) => availableOffline(`./phone/voice/${clip}.ogg`)))).every(Boolean);
    if (available && (await playClips(groups, pause, signal))) return;
    missing?.();
    // Keep captions readable without substituting a different voice for absent recordings.
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, Math.min(8000, Math.max(1200, piece.length * 45)));
      if (signal.aborted) finish();
      else signal.addEventListener('abort', finish, { once: true });
    });
    return;
  }
  if (groups && (await playClips(groups, pause, signal))) return;
  if (!signal.aborted) await speak(piece, v, signal);
}
