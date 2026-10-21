// FINAL.SND and its digitized sounds: a chord for every piece of evidence, the creak of
// the green room door, the click of the safe's dials, footsteps in the dark under the
// stage (each new flagstone the lantern finds), a gasp at a scare, and a gong for a strike.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';

const env = (attack: number, decay: number) => (t: number) => Math.min(1, t / attack) * Math.max(0, 1 - t) ** decay;

const chord = (freqs: number[], spread = 0.04): Synth => {
  const vs = freqs.map((f, i) => {
    const s = osc.sine(f);
    return (t: number) => (t >= i * spread ? s(t) : 0);
  });
  return (t) => vs.reduce((a, s) => a + s(t), 0) / freqs.length;
};

export function buildSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const def = (n: number, name: string, voc: Uint8Array | null, spk: Uint16Array) => {
    set.freqs[n] = spk;
    if (voc) {
      vocs[name] = voc;
      set.digital[n] = name;
    }
  };
  // an "aha": a bright minor-to-major arpeggio
  def(SND.addMoney, 'aha', sample(0.7, chord([587, 698, 880, 1175], 0.06), { envelope: env(0.01, 1.5), gain: 0.8 }), SPEAKER.arpeggio([587, 740, 880, 1175]));
  // the green room door counting your evidence: a long creak
  def(
    SND.subMoney,
    'creak',
    sample(0.6, mix([osc.square((t) => 90 + Math.sin(t * 40) * 20 + t * 60), 0.3], [osc.noise(3), 0.15]), { envelope: env(0.05, 1), gain: 0.6 }),
    speaker((i) => 120 + Math.sin(i) * 30 + i * 4),
  );
  def(SND.addScore, 'chime', sample(0.35, chord([1319, 1760]), { envelope: env(0.005, 2) }), SPEAKER.coin());
  // a scare: a sharp breath and a thud
  def(
    SND.subScore,
    'gasp',
    sample(0.4, mix([osc.noise(9), 0.5], [osc.sine((t) => 220 - t * 300), 0.5]), { envelope: env(0.02, 2.5), gain: 0.7 }),
    SPEAKER.hurt(),
  );
  def(
    SND.kill,
    'whoosh',
    sample(0.5, mix([osc.noise(4), 0.6], [osc.sine((t) => 600 - t * 900), 0.3]), { envelope: env(0.1, 1.2), gain: 0.6 }),
    SPEAKER.fall(1200, 200),
  );
  // a dial clicks round; a counter goes up (the lens, the lantern, a key)
  def(
    SND.addOther,
    'click',
    sample(0.08, mix([osc.noise(5), 0.6], [osc.square(1800), 0.3]), { envelope: env(0.001, 4), gain: 0.7 }),
    speaker((i) => (i < 3 ? 2400 : 0)),
  );
  // a footstep in the dark (and a dial clicking off)
  def(
    SND.subOther,
    'step',
    sample(0.09, mix([osc.noise(11), 0.5], [osc.sine(90), 0.6]), { envelope: env(0.003, 3), gain: 0.45 }),
    speaker((i) => (i < 2 ? 110 : 0)),
  );
  def(
    SND.pickup,
    'rustle',
    sample(0.3, osc.noise(21), { envelope: (t) => Math.sin(t * Math.PI) * (0.6 + 0.4 * Math.sin(t * 60)), gain: 0.5 }),
    SPEAKER.noise(2, 800, 3000),
  );
  // the Commissioner's strike: a gong
  def(
    SND.strike,
    'gong',
    sample(1.6, mix([osc.sine(110), 0.5], [osc.sine(167), 0.3], [osc.sine(231), 0.2], [osc.sine(312), 0.15]), { envelope: env(0.005, 1.2), gain: 0.9 }),
    SPEAKER.fall(400, 80),
  );
  def(
    SND.hurt,
    'thud',
    sample(
      0.2,
      osc.sine((t) => 140 - t * 300),
      { envelope: env(0.002, 2) },
    ),
    SPEAKER.hurt(),
  );
  def(SND.lens, 'hmm', sample(0.45, chord([440, 554, 659], 0.08), { envelope: env(0.02, 1.4), gain: 0.6 }), SPEAKER.warble(700, 120, 1.1));
  return { set, vocs };
}
