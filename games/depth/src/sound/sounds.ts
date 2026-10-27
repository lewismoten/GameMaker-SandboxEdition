// DEPTH.SND: PC speaker effects, each backed by a digitized Sound Blaster .VOC synthesized here
// (glassy chimes for light, a laser zap for the ray, a falling de-render for losing a life).
import { newSoundSet, serializeSoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { lowNoise, env } from '../../../kit/synthParts';

const bell = (hz: number, start = 0, len = 1): Synth => {
  const s = osc.sine(hz);
  const s2 = osc.sine(hz * 2.76);
  const s3 = osc.sine(hz * 5.4);
  return (t) => (t < start ? 0 : (s(t) * 0.6 + s2(t) * 0.28 + s3(t) * 0.12) * Math.exp(-(t - start) * (4 / len)));
};

interface SoundFiles {
  set: Uint8Array;
  vocs: Record<string, Uint8Array>;
}

export function buildSounds(): SoundFiles {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const add = (n: number, name: string, freqs: Uint16Array, voc: Uint8Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
    vocs[name] = voc;
  };
  // a photon: a short, soft glass ting (it is the sound heard most, so it stays quiet)
  add(
    SND.score,
    'photon',
    speaker((i) => (i < 4 ? 2093 : i < 10 ? 3136 : 0)),
    sample(0.25, mix([bell(2093, 0, 0.7), 0.22], [bell(3136, 0.04, 0.45), 0.18]), { envelope: () => 1 }),
  );
  // a lens: a rising three-note chime
  add(
    SND.lens,
    'lens',
    SPEAKER.arpeggio([1047, 1319, 1568, 2093]),
    sample(0.7, mix([bell(1047), 0.3], [bell(1319, 0.08), 0.3], [bell(1568, 0.16), 0.3], [bell(2093, 0.24), 0.3]), { envelope: () => 1 }),
  );
  // a gate dissolving: a glassy downward sweep
  add(
    SND.gate,
    'gate',
    SPEAKER.fall(2400, 600),
    sample(0.6, mix([osc.sine((t) => 1800 - t * 1800), 0.4], [lowNoise(3, (t) => 0.6 - t * 0.8), 0.25]), { envelope: env(0.01, 1.2) }),
  );
  // light refilled (a bulb, a friend)
  add(SND.help, 'light', SPEAKER.rise(500, 1500), sample(0.5, mix([bell(784), 0.3], [bell(1175, 0.06), 0.3], [bell(1568, 0.12), 0.3]), { envelope: () => 1 }));
  // a wireframe rendered: a sparkling pop
  add(
    SND.kill,
    'render',
    SPEAKER.noise(7, 600, 3000),
    sample(0.35, mix([lowNoise(9, (t) => 0.9 - t), 0.5], [bell(2637, 0.02, 0.4), 0.3]), { envelope: env(0.005, 1.5) }),
  );
  add(
    SND.life,
    'oneup',
    SPEAKER.arpeggio([784, 988, 1175, 1568]),
    sample(0.6, mix([bell(784), 0.3], [bell(988, 0.1), 0.3], [bell(1568, 0.2), 0.4]), { envelope: () => 1 }),
  );
  add(
    SND.lose,
    'bonk',
    SPEAKER.fall(400, 120),
    sample(
      0.25,
      osc.sine((t) => 300 - t * 600),
      { envelope: env(0.005, 2) },
    ),
  );
  // the ray: a laser zap
  add(
    SND.fire,
    'zap',
    SPEAKER.zap(),
    sample(0.25, mix([osc.square((t) => 1800 * Math.exp(-t * 9) + 300), 0.35], [osc.sine((t) => 3600 * Math.exp(-t * 7)), 0.3]), { envelope: env(0.003, 1.2) }),
  );
  // hurt: a glitchy buzz
  add(
    SND.hurt,
    'glitch',
    SPEAKER.hurt(),
    sample(0.3, mix([osc.square((t) => (Math.floor(t * 40) % 2 ? 160 : 230)), 0.3], [lowNoise(23, 0.3), 0.25]), { envelope: env(0.01, 1.2) }),
  );
  // de-rendering: the picture falling apart, top to bottom
  add(
    SND.die,
    'derender',
    SPEAKER.fall(1800, 150),
    sample(1.1, mix([osc.square((t) => 900 * Math.exp(-t * 2.2) * (1 + 0.1 * Math.sin(t * 90))), 0.25], [lowNoise(29, (t) => 0.5 * (1 - t)), 0.3]), {
      envelope: env(0.02, 0.7),
    }),
  );
  // the felt egg: a soft, warm chord
  add(
    SND.egg,
    'egg',
    SPEAKER.arpeggio([523, 659, 784, 1047, 1319]),
    sample(1.0, mix([bell(523), 0.25], [bell(659, 0.1), 0.25], [bell(784, 0.2), 0.25], [bell(1047, 0.3), 0.25]), { envelope: () => 1 }),
  );
  return { set: serializeSoundSet(set), vocs };
}
