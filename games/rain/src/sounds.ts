// Rain on the Path's sounds: the Starters' PC speaker blips, with a splash on the score slot.
// A block can't name a sound, but Game-Maker plays the score sound when a block adds points, so the
// armed puddle (src/rain.ts) adds one point and SPLASH.VOC plays. Synthesized here: a short burst of
// noise that opens and closes like water thrown up and falling back, and two little drips after it.
import { type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, mix, osc, sample, type Synth } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { gate, lowNoise } from '@lewismoten/gamemaker-sandbox-tools/kit/synthParts';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

export const SPLASH_VOC = 'splash';
const SECONDS = 0.34;

/** A drip: a quick sine sweeping up, as a drop hitting water does. */
function drip(at: number, from: number): Synth {
  const tone = osc.sine((t) => from + (t - at) * 9000);
  return (t) => (t >= at && t < at + 0.05 ? tone(t) * Math.exp(-(t - at) * 70) : 0);
}

function splash(): Synth {
  // noise brightest in the first tenth of a second, then duller as the water falls back
  const body = lowNoise(11, (t) => (t < 0.03 ? 0.75 : Math.max(0.12, 0.75 - (t - 0.03) * 3)));
  const swell: Synth = (t) => body(t) * (t < 0.012 ? t / 0.012 : Math.exp(-(t - 0.012) * 11));
  return mix([gate(swell, 0, 0.3), 0.8], [drip(0.17, 700), 0.35], [drip(0.25, 900), 0.25]);
}

export function buildVocs(): Record<string, Uint8Array> {
  return { [SPLASH_VOC]: sample(SECONDS, splash(), { gain: 0.8, envelope: (u) => (u > 0.92 ? (1 - u) / 0.08 : 1) }) };
}

/** The kit's speaker sounds; the score slot is the splash (a speaker hiss down when there is no Sound Blaster). */
export function buildSoundSet(): SoundSet {
  const set = buildSounds();
  set.freqs[SND.score] = SPEAKER.fall(1400, 300);
  set.digital[SND.score] = SPLASH_VOC;
  return set;
}
