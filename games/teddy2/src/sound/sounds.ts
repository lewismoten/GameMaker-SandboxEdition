// teddy.snd: thirty PC speaker effects, and digitized .VOC samples for a Sound Blaster
// (a woof and Gwinn's boof, a sniff, a yip, a bell, a car horn honk, the wobble ball's
// giggle...) made with the kit's little synthesizer. Both dogs share the one set.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { lowpass } from '../../../kit/synthParts';
import { noiseBurst, woof, yelp, pop, boing, whoosh, crunch, chomp, giggle, honk, snore, scratch, slap, chime } from '../../../kit/teddySounds';

/** Zoomies: a whoosh that runs away up the scale and comes back down. */
function zoom(): Uint8Array {
  const n = osc.noise(51);
  let y = 0;
  const v: Synth = (t) => (y += (n(t) - y) * (0.08 + 0.5 * Math.abs(Math.sin((t / 0.5) * Math.PI * 2))));
  return sample(0.5, mix([v, 0.8], [osc.square((t) => 220 + 500 * Math.abs(Math.sin(t * 6.3))), 0.12]), { envelope: (u) => Math.sin(u * Math.PI), gain: 1 });
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
  return { set, vocs };
}
