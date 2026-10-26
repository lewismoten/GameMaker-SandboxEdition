// teddy.snd: thirty PC speaker effects, and digitized .VOC samples for a Sound Blaster
// (a woof and Gwinn's boof, a sniff, a yip, a bell, a car horn honk, the wobble ball's
// giggle...) made with the kit's little synthesizer. All four heroes share the one set; the
// finale adds a charger's zap, a balloon being twisted, the rubber chicken and a rumble.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { rng } from '../../../kit/pixels';
import { SND } from '../ids';

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

/** Zoomies: a whoosh that runs away up the scale and comes back down. */
function zoom(): Uint8Array {
  const n = osc.noise(51);
  let y = 0;
  const v: Synth = (t) => (y += (n(t) - y) * (0.08 + 0.5 * Math.abs(Math.sin((t / 0.5) * Math.PI * 2))));
  return sample(0.5, mix([v, 0.8], [osc.square((t) => 220 + 500 * Math.abs(Math.sin(t * 6.3))), 0.12]), { envelope: (u) => Math.sin(u * Math.PI), gain: 1 });
}

function chomp(): Uint8Array {
  return sample(0.3, mix([lowpass(osc.noise(29), 0.3), 0.8], [osc.sine(120), 0.4]), {
    envelope: (u) => (u < 0.4 ? Math.min(1, u * 20) : u < 0.5 ? 0 : (1 - u) * 2),
    gain: 1,
  });
}

/**
 * The wobble ball's giggle: roll it and the tube inside goes "hee-hee-hee-hoo-hoo", each
 * syllable a reedy chirp that falls in pitch, the whole laugh sliding down and wobbling.
 */
function giggle(): Uint8Array {
  const syl = 0.1;
  const n = 6;
  const v: Synth = (t) => {
    const k = Math.floor(t / syl);
    const u = (t - k * syl) / syl;
    if (k >= n || u > 0.75) return 0;
    const f = (980 - k * 70) * (1.15 - u * 0.4) * (1 + 0.04 * Math.sin(t * 2 * Math.PI * 28));
    const ph = 2 * Math.PI * f * t;
    return (Math.sin(ph) * 0.7 + Math.sign(Math.sin(ph)) * 0.15) * Math.sin((u / 0.75) * Math.PI);
  };
  return sample(n * syl + 0.05, v, { envelope: (u) => 1 - u * 0.4, gain: 0.9 });
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
  // A new nap (life) only comes from the wobble ball, so its sound is the ball's giggle.
  put(
    SND.life,
    speaker((i) => (i < 30 && i % 5 < 4 ? 1100 - Math.floor(i / 5) * 80 - (i % 5) * 60 : 0)),
    'giggle',
    giggle(),
  );
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
    SND.sniff,
    SPEAKER.noise(5, 120, 600),
    'sniff',
    noiseBurst(0.45, 0.5, 41, (u) => (Math.sin(u * Math.PI * 6) > 0 ? 1 : 0.08) * (1 - u * 0.5)),
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
    'grab',
    sample(0.12, mix([osc.sine((t) => 700 + 1800 * t), 0.5], [lowpass(osc.noise(47), 0.6), 0.5]), { envelope: (u) => (1 - u) ** 2 }),
  );
  // Gwinn's BOOF: a big, low, round bark.
  put(
    SND.boof,
    speaker((i) => (i < 12 ? 180 - i * 6 : 0)),
    'boof',
    woof(190, 0.32),
  );
  put(SND.chomp, SPEAKER.noise(3, 100, 300), 'munch', chomp());
  put(SND.zoom, SPEAKER.rise(200, 1400), 'zoom', zoom());
  put(SND.ding, SPEAKER.arpeggio([1760, 1760]), 'ding', chime([1760, 2637], 0.04));
  put(
    SND.squeak,
    SPEAKER.warble(1200, 600, 2),
    'squeak',
    sample(
      0.2,
      osc.sine((t) => 1800 + 600 * Math.sin(t * 60)),
      { envelope: (u) => Math.sin(u * Math.PI) },
    ),
  );
  put(
    SND.splash,
    SPEAKER.noise(5, 200, 900),
    'splash',
    noiseBurst(0.4, 0.55, 53, (u) => Math.min(1, u * 30) * (1 - u) ** 2),
  );
  // THE CHEZ plugged in: a rising electric hum and a click.
  put(
    SND.charge,
    SPEAKER.rise(200, 1600),
    'zap',
    sample(0.35, mix([osc.square((t) => 120 + 900 * t), 0.25], [osc.sine((t) => 240 + 1800 * t), 0.5]), {
      envelope: (u) => Math.min(1, u * 8) * (u < 0.85 ? 1 : (1 - u) * 6),
    }),
  );
  // A balloon twisted into a dog: three rubbery squeaks.
  put(
    SND.twist,
    SPEAKER.warble(900, 500, 3),
    'twist',
    sample(
      0.36,
      osc.sine((t) => 700 + 500 * Math.abs(Math.sin(t * 26))),
      { envelope: (u) => (Math.sin(u * Math.PI * 3) > 0 ? 1 : 0.1) * (1 - u * 0.3) },
    ),
  );
  // The rubber chicken: a strangled, wheezy SQUAWK.
  put(
    SND.squawk,
    SPEAKER.warble(1400, 700, 1.5),
    'squawk',
    sample(0.42, mix([osc.square((t) => 640 + 260 * Math.sin(t * 40) - 300 * t), 0.35], [lowpass(osc.noise(61), 0.5), 0.35]), {
      envelope: (u) => Math.min(1, u * 12) * (1 - u) ** 0.6,
      gain: 0.9,
    }),
  );
  // A drawbridge or a garage door rumbling.
  put(
    SND.rumble,
    SPEAKER.noise(8, 60, 200),
    'rumble',
    sample(0.6, mix([lowpass(osc.noise(67), 0.06), 1], [osc.sine(55), 0.4]), { envelope: (u) => Math.sin(u * Math.PI), gain: 1 }),
  );
  return { set, vocs };
}
