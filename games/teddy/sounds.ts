// teddy.snd: thirty PC speaker effects, and digitized .VOC samples for a Sound Blaster
// (a woof, a yip, a clown horn honk...) made with the kit's little synthesizer.
import { newSoundSet, type SoundSet } from '../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../kit/sound';
import { rng } from '../kit/pixels';
import { SND } from './src/ids';

/** A one-pole low-pass over a synth (for growly, dull noises). */
function lowpass(v: Synth, k: number): Synth {
  let y = 0;
  return (t) => (y += (v(t) - y) * k);
}

/** A dog's bark: a falling vocal tone with breath noise, twice ("woof-woof" for Teddy is one). */
function woof(pitch: number, seconds = 0.22): Uint8Array {
  const voice = mix(
    [osc.sine((t) => pitch * (1.25 - t * 2.2)), 0.6],
    [osc.square((t) => pitch * 0.5 * (1.2 - t * 2)), 0.25],
    [lowpass(osc.noise(3), 0.25), 0.5],
  );
  return sample(seconds, voice, { envelope: (u) => Math.min(1, u * 25) * (1 - u) ** 1.2, gain: 0.95 });
}

function honk(): Uint8Array {
  const v = mix([osc.square(370), 0.4], [osc.square(466), 0.35], [osc.sine(185), 0.4]);
  return sample(0.35, lowpass(v, 0.35), { envelope: (u) => Math.min(1, u * 20) * (u < 0.8 ? 1 : (1 - u) * 5) });
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

function noiseBurst(seconds: number, k: number, seed: number, env?: (u: number) => number): Uint8Array {
  return sample(seconds, lowpass(osc.noise(seed), k), { envelope: env, gain: 1 });
}

function scratch(): Uint8Array {
  const n = lowpass(osc.noise(9), 0.4);
  return sample(0.4, n, { envelope: (u) => (Math.sin(u * Math.PI * 7) > 0 ? 1 : 0.15) * (1 - u), gain: 1 });
}

function boing(): Uint8Array {
  return sample(
    0.25,
    osc.sine((t) => 180 + 900 * t + 40 * Math.sin(t * 90)),
    { envelope: (u) => (1 - u) ** 1.5 },
  );
}

function whoosh(): Uint8Array {
  const n = osc.noise(11);
  let y = 0;
  const v: Synth = (t) => (y += (n(t) - y) * (0.05 + 0.4 * Math.sin((t / 0.45) * Math.PI)));
  return sample(0.45, v, { envelope: (u) => Math.sin(u * Math.PI), gain: 1 });
}

function yelp(): Uint8Array {
  return sample(0.18, mix([osc.sine((t) => 900 + 1400 * t * (1 - t * 3)), 0.7], [osc.square((t) => 450 + 700 * t), 0.15]), {
    envelope: (u) => Math.min(1, u * 30) * (1 - u),
  });
}

function snore(): Uint8Array {
  const n = lowpass(osc.noise(13), 0.08);
  return sample(1.2, mix([n, 1], [osc.sine(70), 0.3]), { envelope: (u) => Math.sin(u * Math.PI) * (u < 0.55 ? 1 : 0.6), gain: 1 });
}

function slap(): Uint8Array {
  return noiseBurst(0.12, 0.7, 17, (u) => (1 - u) ** 4);
}

function pop(): Uint8Array {
  return sample(0.12, mix([osc.sine((t) => 1200 - 6000 * t), 0.7], [osc.noise(21), 0.3]), { envelope: (u) => (1 - u) ** 3 });
}

function crunch(): Uint8Array {
  const r = rng(5);
  const n = osc.noise(23);
  const v: Synth = (t) => (Math.floor(t * 60) % 3 === 0 ? n(t) : n(t) * 0.2 * r());
  return sample(0.16, v, { envelope: (u) => (1 - u) ** 2, gain: 0.9 });
}

function chomp(): Uint8Array {
  return sample(0.3, mix([lowpass(osc.noise(29), 0.3), 0.8], [osc.sine(120), 0.4]), {
    envelope: (u) => (u < 0.4 ? Math.min(1, u * 20) : u < 0.5 ? 0 : (1 - u) * 2),
    gain: 1,
  });
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
  put(SND.help, SPEAKER.arpeggio([523, 784, 1047]), 'yum', chime([660, 880, 1320]));
  put(SND.kill, SPEAKER.fall(1600, 400), 'pop', pop());
  put(SND.treat, SPEAKER.coin(), 'crunch', crunch());
  put(SND.gobble, SPEAKER.hurt(), 'chomp', chomp());
  put(SND.life, SPEAKER.arpeggio([523, 659, 784, 1047, 1319]), 'fanfare', chime([523, 659, 784, 1047, 1319], 0.08));
  put(
    SND.score,
    speaker((i) => (i < 6 ? 1568 : 0)),
    'blip',
    chime([1568], 0.05),
  );
  put(SND.lose, SPEAKER.fall(600, 150));
  put(SND.prop, SPEAKER.arpeggio([784, 988, 1175, 1568]), 'tada', chime([784, 988, 1175, 1568], 0.09));
  put(
    SND.gate,
    speaker((i) => (i < 14 ? 370 : i < 18 ? 0 : i < 32 ? 370 : 0)),
    'honk',
    honk(),
  );
  put(
    SND.woof,
    speaker((i) => (i < 10 ? 260 - i * 12 : 0)),
    'woof',
    woof(330),
  );
  put(SND.dig, SPEAKER.noise(4, 80, 400), 'dig', scratch());
  put(
    SND.slap,
    speaker((i) => (i < 4 ? 2400 : 0)),
    'slap',
    slap(),
  );
  put(SND.sit, SPEAKER.arpeggio([1047, 1319, 1568]), 'sparkle', chime([1319, 1568, 2093, 2637], 0.05));
  put(SND.spin, SPEAKER.warble(700, 400, 0.7), 'whoosh', whoosh());
  put(
    SND.roll,
    SPEAKER.noise(6, 60, 220),
    'rumble',
    noiseBurst(0.5, 0.06, 31, (u) => Math.sin(u * Math.PI)),
  );
  put(
    SND.flop,
    SPEAKER.fall(900, 120),
    'flop',
    sample(0.3, mix([osc.sine((t) => 300 - 500 * t), 0.6], [lowpass(osc.noise(37), 0.2), 0.6]), { envelope: (u) => (1 - u) ** 2 }),
  );
  put(SND.hop, SPEAKER.rise(300, 900), 'boing', boing());
  put(
    SND.yelp,
    speaker((i) => (i < 8 ? 1200 + i * 150 : 0)),
    'yip',
    yelp(),
  );
  put(SND.sleep, SPEAKER.fall(500, 90), 'snore', snore());
  put(
    SND.fetch,
    SPEAKER.chirp(),
    'sniff',
    noiseBurst(0.25, 0.5, 41, (u) => (Math.sin(u * Math.PI * 4) > 0 ? 1 : 0.1) * (1 - u)),
  );
  put(20, SPEAKER.zap(), 'pie', sample(0.25, mix([lowpass(osc.noise(43), 0.5), 1]), { envelope: (u) => (u < 0.1 ? u * 10 : (1 - u) ** 2) }));
  put(
    21,
    SPEAKER.warble(1200, 600, 2),
    'squeak',
    sample(
      0.2,
      osc.sine((t) => 1800 + 600 * Math.sin(t * 60)),
      { envelope: (u) => Math.sin(u * Math.PI) },
    ),
  );
  return { set, vocs };
}
