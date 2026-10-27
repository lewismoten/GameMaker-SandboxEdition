// The sound effects the Teddy games share, synthesized as .VOC samples: Teddy's woof and yelp,
// pops, boings, whooshes, crunches and chomps, a giggle, a honk, a snore, a scratch, a slap and a
// chime (Ohm Sweet Ohm rings it too).
import { mix, osc, sample, type Synth } from './sound';
import { lowpass } from './synthParts';
import { rng } from './pixels';

export function noiseBurst(seconds: number, k: number, seed: number, env?: (u: number) => number): Uint8Array {
  return sample(seconds, lowpass(osc.noise(seed), k), { envelope: env, gain: 1 });
}

/** A dog's bark: a falling vocal tone with breath noise, twice ("woof-woof" for Teddy is one). */
export function woof(pitch: number, seconds = 0.22): Uint8Array {
  const voice = mix(
    [osc.sine((t) => pitch * (1.25 - t * 2.2)), 0.6],
    [osc.square((t) => pitch * 0.5 * (1.2 - t * 2)), 0.25],
    [lowpass(osc.noise(3), 0.25), 0.5],
  );
  return sample(seconds, voice, { envelope: (u) => Math.min(1, u * 25) * (1 - u) ** 1.2, gain: 0.95 });
}

export function yelp(): Uint8Array {
  return sample(0.18, mix([osc.sine((t) => 900 + 1400 * t * (1 - t * 3)), 0.7], [osc.square((t) => 450 + 700 * t), 0.15]), {
    envelope: (u) => Math.min(1, u * 30) * (1 - u),
  });
}

export function pop(): Uint8Array {
  return sample(0.12, mix([osc.sine((t) => 1200 - 6000 * t), 0.7], [osc.noise(21), 0.3]), { envelope: (u) => (1 - u) ** 3 });
}

export function boing(): Uint8Array {
  return sample(
    0.25,
    osc.sine((t) => 180 + 900 * t + 40 * Math.sin(t * 90)),
    { envelope: (u) => (1 - u) ** 1.5 },
  );
}

export function whoosh(): Uint8Array {
  const n = osc.noise(11);
  let y = 0;
  const v: Synth = (t) => (y += (n(t) - y) * (0.05 + 0.4 * Math.sin((t / 0.45) * Math.PI)));
  return sample(0.45, v, { envelope: (u) => Math.sin(u * Math.PI), gain: 1 });
}

export function crunch(): Uint8Array {
  const r = rng(5);
  const n = osc.noise(23);
  const v: Synth = (t) => (Math.floor(t * 60) % 3 === 0 ? n(t) : n(t) * 0.2 * r());
  return sample(0.16, v, { envelope: (u) => (1 - u) ** 2, gain: 0.9 });
}

export function chomp(): Uint8Array {
  return sample(0.3, mix([lowpass(osc.noise(29), 0.3), 0.8], [osc.sine(120), 0.4]), {
    envelope: (u) => (u < 0.4 ? Math.min(1, u * 20) : u < 0.5 ? 0 : (1 - u) * 2),
    gain: 1,
  });
}

/**
 * The wobble ball's giggle: roll it and the tube inside goes "hee-hee-hee-hoo-hoo", each
 * syllable a reedy chirp that falls in pitch, the whole laugh sliding down and wobbling.
 */
export function giggle(): Uint8Array {
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

export function honk(): Uint8Array {
  const v = mix([osc.square(370), 0.4], [osc.square(466), 0.35], [osc.sine(185), 0.4]);
  return sample(0.35, lowpass(v, 0.35), { envelope: (u) => Math.min(1, u * 20) * (u < 0.8 ? 1 : (1 - u) * 5) });
}

export function snore(): Uint8Array {
  const n = lowpass(osc.noise(13), 0.08);
  return sample(1.2, mix([n, 1], [osc.sine(70), 0.3]), { envelope: (u) => Math.sin(u * Math.PI) * (u < 0.55 ? 1 : 0.6), gain: 1 });
}

export function scratch(): Uint8Array {
  const n = lowpass(osc.noise(9), 0.4);
  return sample(0.4, n, { envelope: (u) => (Math.sin(u * Math.PI * 7) > 0 ? 1 : 0.15) * (1 - u), gain: 1 });
}

export function slap(): Uint8Array {
  return noiseBurst(0.12, 0.7, 17, (u) => (1 - u) ** 4);
}

export function chime(notes: number[], each = 0.07): Uint8Array {
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
