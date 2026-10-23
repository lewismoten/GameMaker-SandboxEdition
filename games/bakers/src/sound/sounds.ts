// leo.snd: PC speaker effects, with digitized .VOC samples for a Sound Blaster from the kit's
// little synthesizer: the rubber chicken's squawk, a kazoo, a fife playing the first bar of
// Yankee Doodle, a mouse's squeak, the ingredient's sparkle, the Vault's twelve tumblers, and
// a sad trombone for when Doc Leo plays dead (he always does it well).
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';

const saw = (hz: (t: number) => number): Synth => {
  let ph = 0;
  let last = 0;
  return (t) => {
    ph += hz(t) * (t - last);
    last = t;
    return 2 * (ph - Math.floor(ph)) - 1;
  };
};

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

/** A rubber chicken, squeezed: a nasal honk that bends up and chokes off. */
function squawk(): Uint8Array {
  const v = saw((t) => 520 + 380 * Math.sin(Math.min(1, t / 0.18) * Math.PI * 0.9) + 40 * Math.sin(t * 190));
  return sample(0.32, band(v, 0.08, 0.5), { envelope: (u) => Math.min(1, u * 12) * (u < 0.8 ? 1 : (1 - u) * 5), gain: 1 });
}

/** A kazoo: a hummed note through a buzzing membrane. */
function kazoo(): Uint8Array {
  const notes = [392, 392, 523];
  const v = saw((t) => notes[Math.min(2, Math.floor(t / 0.14))] * (1 + 0.01 * Math.sin(t * 40)));
  return sample(0.45, mix([band(v, 0.15, 0.7), 0.8], [osc.noise(11), 0.12]), { envelope: (u) => Math.min(1, u * 10) * (1 - u) ** 0.4, gain: 1 });
}

/** A fife: Yankee Doodle went to town (the first bar, the important part). */
function fife(): Uint8Array {
  const tune = [523, 523, 587, 659, 523, 659, 587];
  const step = 0.13;
  return sample(
    tune.length * step,
    (t) => {
      const i = Math.min(tune.length - 1, Math.floor(t / step));
      const local = t - i * step;
      const env = Math.min(1, local / 0.01) * (local < step - 0.02 ? 1 : 0.2);
      return env * (Math.sin(2 * Math.PI * tune[i] * 2 * t) + 0.2 * Math.sin(2 * Math.PI * tune[i] * 4 * t));
    },
    { envelope: () => 1, gain: 0.6 },
  );
}

/** A mouse, squeaking off in a hurry. */
function squeak(): Uint8Array {
  return sample(
    0.16,
    osc.sine((t) => 2400 + 1600 * Math.sin(t * 60)),
    { envelope: (u) => Math.sin(Math.PI * u), gain: 0.7 },
  );
}

/** An ingredient: a sparkle of bells. */
function sparkle(): Uint8Array {
  const tone =
    (f: number, t0: number): Synth =>
    (t) =>
      t < t0 ? 0 : Math.sin(2 * Math.PI * f * (t - t0)) * Math.exp(-(t - t0) * 7);
  return sample(0.8, mix([tone(1319, 0), 0.35], [tone(1568, 0.08), 0.35], [tone(2093, 0.16), 0.35], [tone(2637, 0.24), 0.3]), { envelope: () => 1, gain: 0.9 });
}

/** A heavy lock: twelve tumblers and a thunk. */
function tumblers(): Uint8Array {
  const noise = osc.noise(21);
  return sample(
    0.9,
    (t) => {
      const k = Math.floor(t / 0.05);
      const local = t - k * 0.05;
      const click = k < 12 ? Math.exp(-local * 300) * noise(t) : 0;
      const thunk = t > 0.62 ? Math.sin(2 * Math.PI * 70 * t) * Math.exp(-(t - 0.62) * 12) : 0;
      return click * 0.7 + thunk;
    },
    { envelope: () => 1, gain: 0.9 },
  );
}

/** A wooden clack (a spoon), and a latch clicking open. */
function clack(): Uint8Array {
  return sample(0.1, mix([osc.sine((t) => 900 - t * 4000), 0.6], [band(osc.noise(5), 0.2, 0.8), 0.5]), { envelope: (u) => (1 - u) ** 4, gain: 1 });
}

function latch(): Uint8Array {
  return sample(0.2, (t) => (t < 0.03 || (t > 0.1 && t < 0.13) ? Math.sin(t * 9000) * 0.8 : 0), { envelope: () => 1, gain: 0.9 });
}

/** Ouch. */
function ouch(): Uint8Array {
  return sample(
    0.2,
    saw((t) => 300 - t * 600),
    { envelope: (u) => (1 - u) ** 2, gain: 0.7 },
  );
}

/** Wah, wah, wah, waaaah. */
function trombone(): Uint8Array {
  const notes = [311, 294, 277, 262];
  const lens = [0.32, 0.32, 0.32, 1.0];
  const total = lens.reduce((a, b) => a + b, 0);
  const v = saw((t) => {
    let at = 0;
    for (let i = 0; i < 4; i++) {
      if (t < at + lens[i]) return notes[i] * (i === 3 ? 1 + 0.03 * Math.sin((t - at) * 35) : 1);
      at += lens[i];
    }
    return notes[3];
  });
  return sample(total, band(v, 0.06, 0.35), {
    envelope: (u) => {
      const t = u * total;
      let at = 0;
      for (let i = 0; i < 4; i++) {
        if (t < at + lens[i]) return Math.min(1, (t - at) / 0.03) * Math.min(1, (at + lens[i] - t) / 0.06);
        at += lens[i];
      }
      return 0;
    },
    gain: 1,
  });
}

/** A rubber chicken squeezed gently: a squeaky toy, eek-eek. */
function toy(): Uint8Array {
  return sample(
    0.22,
    band(
      saw((t) => (t < 0.1 ? 1400 + t * 4000 : 1700 - (t - 0.1) * 2500)),
      0.1,
      0.6,
    ),
    {
      envelope: (u) => (u < 0.42 ? Math.sin((Math.PI * u) / 0.42) : u > 0.5 ? Math.sin((Math.PI * (u - 0.5)) / 0.5) : 0),
      gain: 0.8,
    },
  );
}

/** Boing: rubber hitting the floor and coming back up. */
function boing(): Uint8Array {
  return sample(
    0.45,
    osc.sine((t) => 140 + 260 * Math.exp(-t * 6) + 30 * Math.sin(t * 70)),
    { envelope: (u) => (1 - u) ** 1.5, gain: 0.9 },
  );
}

/** A music box: the first bar of the march, on little steel tines (a life: pie, or the pastry egg). */
function musicBox(): Uint8Array {
  const notes = [784, 988, 1175, 1175, 1319, 1175];
  const at = [0, 0.12, 0.24, 0.42, 0.54, 0.66];
  return sample(
    1.4,
    (t) => {
      let v = 0;
      notes.forEach((f, i) => {
        const u = t - at[i];
        if (u >= 0) v += (Math.sin(2 * Math.PI * f * u) + 0.3 * Math.sin(2 * Math.PI * f * 4.2 * u)) * Math.exp(-u * 4.5) * 0.3;
      });
      return v;
    },
    { envelope: () => 1, gain: 1 },
  );
}

function fanfare(): Uint8Array {
  const notes = [523, 659, 784, 1047];
  return sample(
    0.6,
    (t) => {
      const i = Math.min(notes.length - 1, Math.floor(t / 0.11));
      return Math.sin(2 * Math.PI * notes[i] * t) > 0 ? 0.5 : -0.5;
    },
    { envelope: (u) => (1 - u) ** 0.5, gain: 0.7 },
  );
}

/** A gulp of root beer float. */
function gulp(): Uint8Array {
  return sample(
    0.3,
    osc.sine((t) => 180 + 220 * Math.sin(t * 22) ** 2),
    { envelope: (u) => Math.sin(Math.PI * u), gain: 0.8 },
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
  put(SND.help, SPEAKER.rise(300, 900), 'gulp', gulp());
  put(
    SND.kill,
    speaker((i) => (i < 10 ? 2400 + (i % 3) * 600 : 0)),
    'squeak',
    squeak(),
  );
  put(SND.ingredient, SPEAKER.arpeggio([1319, 1568, 2093, 2637]), 'sparkle', sparkle());
  put(
    SND.vault,
    speaker((i) => (i < 24 ? (i % 2 ? 900 : 0) : i < 30 ? 70 : 0)),
    'tumblers',
    tumblers(),
  );
  put(SND.life, SPEAKER.arpeggio([784, 988, 1175, 1175, 1319, 1175]), 'musicbox', musicBox());
  void fanfare;
  put(SND.score, SPEAKER.coin());
  put(SND.subScore, SPEAKER.fall(800, 200));
  put(
    SND.key,
    speaker((i) => (i < 4 ? 900 : 0)),
    'clack',
    clack(),
  );
  put(
    SND.unlock,
    speaker((i) => (i < 3 || (i > 8 && i < 11) ? 1800 : 0)),
    'latch',
    latch(),
  );
  put(
    SND.squawk,
    speaker((i) => (i < 20 ? 520 + Math.sin(i / 3) * 380 : 0)),
    'squawk',
    squawk(),
  );
  put(SND.hurt, SPEAKER.hurt(), 'ouch', ouch());
  put(
    SND.die,
    speaker((i) => [311, 294, 277, 262][Math.min(3, Math.floor(i / 6))] * (i >= 18 ? 1 + 0.03 * Math.sin(i) : 1)),
    'trombone',
    trombone(),
  );
  put(
    SND.kazoo,
    speaker((i) => (i < 30 ? (i < 10 ? 392 : i < 20 ? 392 : 523) + (i % 2) * 6 : 0)),
    'kazoo',
    kazoo(),
  );
  put(
    SND.fife,
    speaker((i) => [523, 523, 587, 659, 523, 659][Math.min(5, Math.floor(i / 6))]),
    'fife',
    fife(),
  );
  put(SND.pickup, SPEAKER.chirp());
  put(
    SND.toy,
    speaker((i) => (i < 4 ? 1500 + i * 150 : i > 5 && i < 10 ? 1700 - (i - 6) * 150 : 0)),
    'toy',
    toy(),
  );
  put(
    SND.boing,
    speaker((i) => (i < 16 ? 400 - i * 15 + (i % 2) * 40 : 0)),
    'boing',
    boing(),
  );
  return { set, vocs };
}
