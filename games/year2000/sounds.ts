// Y2K.SND: a PC speaker tune for every effect, and a digitized Sound Blaster sample
// (.VOC) for each, made with the kit's little synthesizer.
import { newSoundSet, type SoundSet } from '../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker } from '../kit/sound';
import { rng } from '../kit/pixels';
import { SND } from './ids';

export function buildSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const put = (n: number, name: string, beeps: Uint16Array, voc: Uint8Array) => {
    set.freqs[n] = beeps;
    set.digital[n] = name;
    vocs[name] = voc;
  };
  const r = rng(2000);

  // A food pill: gulp, then a happy rising sparkle.
  put(
    SND.heal,
    'gulp',
    SPEAKER.arpeggio([523, 659, 784, 1047, 1319]),
    sample(0.45, mix([osc.sine((t) => (t < 0.1 ? 180 - t * 600 : 500 + t * 1800)), 0.8], [osc.sine((t) => 1400 + t * 2000), 0.25]), { attack: 0.01 }),
  );
  // A robot zapped: a crackle that drops away.
  put(
    SND.kill,
    'fizzle',
    speaker((i) => (i < 10 ? 400 + r() * 3000 : i < 30 ? 2400 * 0.88 ** (i - 10) : 0)),
    sample(0.4, mix([osc.noise(3), 0.6], [osc.square((t) => 1600 * 0.02 ** t), 0.4]), { attack: 0.002 }),
  );
  // A quarter: the ka-ching of a coin return.
  put(SND.coin, 'kaching', SPEAKER.coin(), sample(0.35, mix([osc.square((t) => (t < 0.06 ? 988 : 1319)), 0.5], [osc.sine(2637), 0.3]), { attack: 0.002 }));
  // A quarter spent: clunk, then the "doo-dee-doo" of the phone company.
  put(
    SND.insert,
    'dialtone',
    speaker((i) => (i < 4 ? 120 : i < 8 ? 0 : i < 16 ? 950 : i < 24 ? 1400 : i < 32 ? 1800 : 0)),
    sample(
      0.6,
      (t) =>
        t < 0.05 ? osc.noise(5)(t) : t < 0.2 ? Math.sin(2 * Math.PI * 950 * t) : t < 0.35 ? Math.sin(2 * Math.PI * 1400 * t) : Math.sin(2 * Math.PI * 1800 * t),
      { envelope: (u) => (u < 0.9 ? 1 : (1 - u) * 10) * 0.6 },
    ),
  );
  // A Hover-Cola (extra life): fizz and a fanfare.
  put(
    SND.life,
    'oneup',
    SPEAKER.arpeggio([392, 523, 659, 784, 1047, 1319]),
    sample(0.7, mix([osc.square((t) => [392, 523, 659, 784, 1047][Math.min(4, Math.floor(t * 9))]), 0.4], [osc.noise(9), 0.08]), {
      attack: 0.005,
      envelope: (u) => 1 - u * 0.7,
    }),
  );
  // Points (an arcade game played): a bleepy jingle.
  put(
    SND.score,
    'arcade',
    speaker((i) => [1047, 0, 1319, 0, 1568, 0, 2093][Math.floor(i / 5)] ?? 0),
    sample(
      0.45,
      osc.square((t) => [1047, 1319, 1568, 2093][Math.min(3, Math.floor(t * 9))]),
      { attack: 0.002, gain: 0.5 },
    ),
  );
  put(
    SND.subScore,
    'bonk',
    SPEAKER.fall(600, 100),
    sample(
      0.25,
      osc.square((t) => 300 - t * 800),
      { gain: 0.5 },
    ),
  );
  // A page (or key, or battery): a paper rustle and a blip.
  put(
    SND.pickup,
    'rustle',
    speaker((i) => (i < 10 ? 300 + r() * 500 : i < 14 ? 0 : i < 26 ? 1200 + (i - 14) * 80 : 0)),
    sample(0.32, (t) => (t < 0.14 ? osc.noise(11)(t) * 0.7 : Math.sin(2 * Math.PI * (1200 + t * 3000) * t) * 0.6), { attack: 0.003 }),
  );
  // A door opened with a key: a robotic "access granted" chirp-chirp.
  put(
    SND.open,
    'access',
    speaker((i) => (i < 8 ? 1500 : i < 12 ? 0 : i < 20 ? 2000 : i < 24 ? 0 : i < 34 ? 600 : 0)),
    sample(
      0.5,
      osc.square((t) => (t < 0.12 ? 1500 : t < 0.18 ? 0 : t < 0.3 ? 2000 : 600)),
      { gain: 0.45, envelope: () => 1 },
    ),
  );
  // The Laser-Tag Zapper: pew!
  put(
    SND.zap,
    'pew',
    SPEAKER.zap(),
    sample(0.22, mix([osc.square((t) => 2600 * 0.08 ** (t / 0.22)), 0.55], [osc.sine((t) => 1800 * 0.1 ** (t / 0.22)), 0.4]), { attack: 0.001 }),
  );
  // Ouch: a rubbery boing.
  put(
    SND.hurt,
    'boing',
    SPEAKER.warble(300, 150, 1.6),
    sample(
      0.35,
      osc.sine((t) => 220 + Math.sin(t * 60) * 90 * (1 - t * 2)),
      { attack: 0.003 },
    ),
  );
  // Knocked out: a slide whistle all the way down.
  put(
    SND.die,
    'slide',
    SPEAKER.fall(1800, 120),
    sample(
      1.1,
      osc.sine((t) => 1800 * 0.08 ** (t / 1.1) + Math.sin(t * 40) * 20),
      { attack: 0.01, envelope: (u) => 1 - u },
    ),
  );
  return { set, vocs };
}
