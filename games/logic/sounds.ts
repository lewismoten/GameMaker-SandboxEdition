// watt.snd: PC speaker effects, plus digitized .VOC samples for a Sound Blaster made with
// the kit's little synthesizer: the clack of a knife switch, a zap, a fizzle, a "boing".
import { newSoundSet, type SoundSet } from '../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../kit/sound';
import { SND } from './ids';

function lowpass(v: Synth, k: number): Synth {
  let y = 0;
  return (t) => (y += (v(t) - y) * k);
}

function chime(notes: number[], each = 0.07): Uint8Array {
  const total = notes.length * each + 0.15;
  const v: Synth = (t) => {
    let s = 0;
    notes.forEach((f, i) => {
      const t0 = i * each;
      if (t >= t0) s += Math.sin(2 * Math.PI * f * (t - t0)) * Math.exp(-(t - t0) * 9) * 0.5;
    });
    return s;
  };
  return sample(total, v, { envelope: () => 1, gain: 0.9 });
}

/** A knife switch: a sharp metal clack with a little ring. */
function clack(): Uint8Array {
  return sample(0.14, mix([lowpass(osc.noise(3), 0.8), 0.7], [osc.sine(2400), 0.25], [osc.sine(170), 0.4]), {
    envelope: (u) => (u < 0.03 ? 1 : (1 - u) ** 5),
    gain: 1,
  });
}

/** Electric buzz: a 60-cycle hum with crackle. */
function zap(): Uint8Array {
  const n = osc.noise(5);
  const v: Synth = (t) => (Math.sin(2 * Math.PI * 120 * t) > 0 ? 0.6 : -0.6) * 0.6 + n(t) * (Math.sin(t * 300) > 0.6 ? 0.7 : 0.1);
  return sample(0.35, v, { envelope: (u) => Math.min(1, u * 40) * (1 - u) ** 0.5, gain: 1 });
}

/** Sad electronics: a falling whine, then sputter. */
function fizzle(): Uint8Array {
  const n = lowpass(osc.noise(7), 0.3);
  const v = mix([osc.square((t) => 900 * Math.exp(-t * 3)), 0.35], [n, 0.6]);
  return sample(0.9, v, { envelope: (u) => (u < 0.6 ? 1 : (Math.sin(u * 90) > 0 ? 1 : 0.2) * (1 - u) * 2.5), gain: 0.9 });
}

function boing(): Uint8Array {
  return sample(
    0.45,
    osc.sine((t) => 160 + 500 * t + 60 * Math.sin(t * 70)),
    { envelope: (u) => (1 - u) ** 1.5 },
  );
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
  put(
    SND.click,
    speaker((i) => (i < 3 ? 2200 : i < 5 ? 600 : 0)),
    'clack',
    clack(),
  );
  put(SND.life, SPEAKER.arpeggio([523, 659, 784, 1047, 1319]), 'fanfare', chime([523, 659, 784, 1047, 1319], 0.08));
  put(SND.score, SPEAKER.coin(), 'ding', chime([1568, 2093], 0.06));
  put(
    SND.zap,
    speaker((i) => (i % 2 ? 120 : 2400)),
    'zap',
    zap(),
  );
  put(SND.fizzle, SPEAKER.fall(1200, 90), 'fizzle', fizzle());
  put(SND.boing, SPEAKER.warble(300, 200, 0.6), 'boing', boing());
  return { set, vocs };
}
