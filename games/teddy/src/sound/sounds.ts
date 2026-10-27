// teddy.snd: thirty PC speaker effects, and digitized .VOC samples for a Sound Blaster
// (a woof, a yip, a car horn honk, the wobble ball's giggle...) made with the kit's little synthesizer.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker } from '../../../kit/sound';
import { SND } from '../ids';
import { lowpass } from '../../../kit/synthParts';
import { noiseBurst, woof, yelp, pop, boing, whoosh, crunch, chomp, giggle, honk, snore, scratch, slap, chime } from '../../../kit/teddySounds';

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
