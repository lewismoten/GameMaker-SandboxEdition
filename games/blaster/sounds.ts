// blaster.snd: PC speaker effects for every slot, and digitized Sound Blaster samples
// (.voc) made with the kit's little synthesizer.
import { newSoundSet, type SoundSet } from '../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker } from '../kit/sound';
import { rng } from '../kit/pixels';
import { SND } from './ids';

/** Noise through a simple one-pole low-pass whose cutoff falls over time. */
function rumble(seed: number, from: number, to: number, seconds: number): (t: number) => number {
  const r = rng(seed);
  let y = 0;
  return (t) => {
    const a = Math.min(1, (from + (to - from) * Math.min(1, t / seconds)) / 11025);
    y += a * (r() * 2 - 1 - y);
    return y * 2.2;
  };
}

export function buildSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const add = (slot: number, name: string, pc: Uint16Array, voc: Uint8Array) => {
    set.freqs[slot] = pc;
    set.digital[slot] = name;
    vocs[name] = voc;
  };
  add(
    SND.repair,
    'repair',
    SPEAKER.arpeggio([523, 784, 1047, 1568]),
    sample(0.32, mix([osc.square((t) => 520 * 2 ** Math.floor(t * 12)), 0.4], [osc.sine(1040), 0.3])),
  );
  add(SND.kill, 'boom', SPEAKER.noise(3, 80, 900), sample(0.45, rumble(3, 5000, 300, 0.45), { gain: 1 }));
  add(SND.money, 'blip', SPEAKER.coin(), sample(0.12, osc.square(1320), { gain: 0.5 }));
  add(SND.moneyDown, 'blip', SPEAKER.fall(800, 300), sample(0.12, osc.square(1320), { gain: 0.5 }));
  add(
    SND.oneUp,
    'oneup',
    SPEAKER.arpeggio([659, 784, 988, 1319, 1568, 1976]),
    sample(
      0.6,
      osc.square((t) => [659, 784, 988, 1319, 1568, 1976][Math.min(5, Math.floor(t * 10))]),
      { gain: 0.45 },
    ),
  );
  add(
    SND.score,
    'bit',
    SPEAKER.chirp(),
    sample(
      0.1,
      osc.square((t) => 1600 + t * 6000),
      { gain: 0.4 },
    ),
  );
  add(
    SND.scoreDown,
    'bit',
    SPEAKER.fall(1200, 400),
    sample(
      0.1,
      osc.square((t) => 1600 + t * 6000),
      { gain: 0.4 },
    ),
  );
  add(SND.charge, 'charge', SPEAKER.rise(300, 2400), sample(0.4, mix([osc.square((t) => 300 + t * 3000), 0.35], [osc.sine((t) => 600 + t * 4000), 0.35])));
  add(SND.chargeDown, 'blip', SPEAKER.fall(1500, 200), sample(0.12, osc.square(1320), { gain: 0.5 }));
  add(SND.hurt, 'zap', SPEAKER.hurt(), sample(0.3, mix([osc.square((t) => 900 - t * 2400), 0.5], [rumble(9, 6000, 2000, 0.3), 0.4])));
  add(SND.die, 'kaboom', SPEAKER.noise(5, 50, 500), sample(1.2, mix([rumble(5, 4000, 120, 1.2), 1], [osc.sine((t) => 90 - t * 50), 0.5]), { gain: 1 }));
  add(
    SND.nova,
    'nova',
    SPEAKER.warble(900, 500, 2),
    sample(0.7, mix([osc.sine((t) => 200 + t * 1600), 0.5], [rumble(11, 1500, 8000, 0.7), 0.45], [osc.square((t) => 100 + t * 800), 0.15])),
  );
  // every other slot: a short tick on the speaker
  for (let i = 0; i < set.freqs.length; i++) if (!set.freqs[i].some(Boolean)) set.freqs[i] = speaker((k) => (k < 3 ? 600 : 0));
  return { set, vocs };
}
