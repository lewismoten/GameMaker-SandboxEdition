// Somebody in the house picks up the kitchen phone in the middle of an upload: the click of
// the extension, the line going ragged, then a voice yelling about the noise (spoken by the
// wall phone's speech voices, audio/voices.ts). The modems lose each other and the
// call drops. Returns what was said, for the screen.
import { pcOutput } from '../computer/pcAudio';
import { dataNoise, Line } from './modem';

export interface Overheard {
  who: string;
  words: string;
}

const YELLS: [who: 'mom' | 'dad', words: string][] = [
  ['mom', 'Hello? Hello?! What is that screeching? Is that the computer again? Get off the phone, I need to make a call!'],
  ['dad', 'Hello? HELLO? What in the world is that racket? Are you on that bulletin board again? I am expecting a call from work!'],
  ['mom', 'Hello? Who is this? Oh, for crying out loud, it is that modem again! I have been trying to call Grandma all evening!'],
];

/** The click of an extension lifted, and the line's crackle after it (seconds of sound). */
function click(ctx: AudioContext): number {
  const t = ctx.currentTime + 0.02;
  // the click: a short burst of noise, loud
  const n = Math.ceil(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.6;
  src.connect(g).connect(pcOutput(ctx));
  src.start(t);
  // the line: the modems' data at the line's speed, broken up, crackling and a hum under it
  const line = new Line(ctx);
  dataNoise(line, t + 0.1, 1.6, undefined, 0.2);
  line.hiss(t + 0.35, 0.25, 0.3, 900);
  line.hiss(t + 0.9, 0.4, 0.28, 2600);
  line.tones([120, 180], t + 0.1, 3.5, 0.05);
  setTimeout(() => line.out.disconnect(), 4000);
  return 1.2;
}

/**
 * Plays the pickup and starts the yelling; resolves once the yelling has started (the
 * call drops while they are still at it).
 */
export async function pickUpExtension(ctx: AudioContext | undefined): Promise<Overheard> {
  const [who, words] = YELLS[Math.floor(Math.random() * YELLS.length)];
  const wait = ctx ? click(ctx) : 0.6;
  const { speak, VOICES } = await import('../../audio/voices');
  const v = VOICES[who];
  await new Promise((r) => setTimeout(r, wait * 1000));
  // louder and faster than on the phone: they are upset
  void speak(words, { ...v, rate: v.rate * 1.1, pitch: v.pitch * 1.05 }, new AbortController().signal);
  return { who: v.who, words };
}
