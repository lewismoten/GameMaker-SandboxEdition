// joe.snd: PC speaker effects, with digitized .VOC samples for a Sound Blaster from the
// kit's little synthesizer: a page flutter for a word, a librarian's "shhh", a bubble pop,
// the Word Counter's bell when a story is shelved, and the clunk of an egg cup gate.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';

function band(v: Synth, lo: number, hi: number): Synth {
  let a = 0;
  let b = 0;
  return (t) => {
    const x = v(t);
    a += (x - a) * hi;
    b += (a - b) * lo;
    return a - b;
  };
}

/** A page turning: a soft papery swish. */
function flutter(): Uint8Array {
  const n = band(osc.noise(3), 0.05, 0.6);
  return sample(0.18, (t) => n(t) * (0.6 + 0.4 * Math.sin(t * 90)), { envelope: (u) => Math.sin(Math.PI * u) ** 0.7, gain: 1 });
}

/** Shhhh. */
function shh(): Uint8Array {
  const n = band(osc.noise(9), 0.25, 0.95);
  return sample(0.55, n, { envelope: (u) => Math.min(1, u * 8) * (1 - u) ** 0.8, gain: 0.8 });
}

function pop(): Uint8Array {
  return sample(0.08, mix([osc.sine((t) => 900 - t * 6000), 0.7], [osc.noise(4), 0.3]), { envelope: (u) => (1 - u) ** 3, gain: 1 });
}

/** The Word Counter's bell: ding-ding! */
function bell(): Uint8Array {
  const tone = (f: number, t0: number): Synth => (t) => (t < t0 ? 0 : (Math.sin(2 * Math.PI * f * (t - t0)) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * (t - t0))) * Math.exp(-(t - t0) * 5));
  return sample(0.9, mix([tone(1568, 0), 0.45], [tone(2093, 0.16), 0.45]), { envelope: () => 1, gain: 0.9 });
}

function clunk(): Uint8Array {
  return sample(0.22, mix([osc.sine((t) => 140 - t * 200), 0.8], [band(osc.noise(5), 0.1, 0.4), 0.5]), { envelope: (u) => (u < 0.02 ? 1 : (1 - u) ** 4), gain: 1 });
}

function fanfare(): Uint8Array {
  const notes = [523, 659, 784, 1047];
  return sample(0.6, (t) => {
    const i = Math.min(notes.length - 1, Math.floor(t / 0.11));
    return Math.sin(2 * Math.PI * notes[i] * t) > 0 ? 0.5 : -0.5;
  }, { envelope: (u) => (1 - u) ** 0.5, gain: 0.7 });
}

export function buildSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const put = (n: number, freqs: Uint16Array, name?: string, voc?: Uint8Array) => {
    set.freqs[n] = freqs;
    if (name && voc) {
      set.digital[n] = name;
      vocs[name] = voc;
    }
  };
  put(SND.kill, SPEAKER.chirp(), 'pop', pop());
  put(SND.word, speaker((i) => (i < 6 ? 1800 + i * 200 : 0)), 'flutter', flutter());
  put(SND.shh, SPEAKER.noise(3, 2000, 6000), 'shhh', shh());
  put(SND.life, SPEAKER.arpeggio(), 'fanfare', fanfare());
  put(SND.score, SPEAKER.coin());
  put(SND.shelved, SPEAKER.arpeggio([1568, 2093, 1568, 2093]), 'ding', bell());
  put(SND.unlock, speaker((i) => (i < 8 ? 120 : 0)), 'clunk', clunk());
  return { set, vocs };
}
