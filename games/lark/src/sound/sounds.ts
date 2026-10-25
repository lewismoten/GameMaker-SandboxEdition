// LARK.SND and its .VOCs: PC speaker sounds for every slot, and three digitized ones for a Sound
// Blaster, all synthesized here: Joe's chirp (a little two-note robot "hm!"), a gear catching and
// turning (a click and a soft chime), and a gate giving way (a wooden creak). The tally counter's
// click is points; nothing in the game says ouch.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker } from '../../../kit/sound';
import { SND } from '../ids';

export function buildSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const put = (slot: number, freqs: Uint16Array, voc = '') => {
    set.freqs[slot] = freqs;
    set.digital[slot] = voc;
  };
  put(SND.help, SPEAKER.rise(400, 1200));
  put(SND.kill, SPEAKER.chirp());
  put(SND.money, SPEAKER.coin());
  put(SND.spend, SPEAKER.fall(900, 300));
  put(SND.life, SPEAKER.arpeggio([523, 659, 784, 1047]));
  // the tally counter: two tiny clicks
  put(
    SND.score,
    speaker((i) => (i === 0 || i === 3 ? 2400 : 0)),
  );
  put(SND.lose, SPEAKER.fall(600, 200));
  put(SND.up, SPEAKER.arpeggio([784, 1175]), 'gear');
  put(SND.down, SPEAKER.warble(220, 60, 0.9), 'creak');
  put(
    SND.hop,
    speaker((i) => (i < 6 ? 300 + i * 90 : 0)),
  );
  put(
    SND.bump,
    speaker((i) => (i < 3 ? 120 : 0)),
  );
  put(SND.chirp, SPEAKER.arpeggio([988, 1319]), 'chirp');
  // the drum's boom, thrown: a soft whump
  put(
    SND.boom,
    speaker((i) => (i < 4 ? 160 - i * 25 : 0)),
  );
  // "hm?": a little question, down then up
  put(SND.nope, SPEAKER.arpeggio([660, 523, 784]));
  // a puff of air into the balloon
  put(SND.puff, SPEAKER.rise(300, 900));

  const click = osc.noise(3);
  const vocs: Record<string, Uint8Array> = {
    // "hm!": a square-ish beep that steps up a fourth
    chirp: sample(0.22, mix([osc.square((t) => (t < 0.09 ? 880 : 1175)), 0.35], [osc.sine((t) => (t < 0.09 ? 1760 : 2350)), 0.25]), { rate: 11025 }),
    // a click, then a chime with a little shimmer
    gear: sample(
      0.5,
      (t) =>
        (t < 0.012 ? click(t) : 0) + 0.5 * Math.sin(2 * Math.PI * 1568 * t) * Math.exp(-t * 7) + 0.25 * Math.sin(2 * Math.PI * 2349 * t) * Math.exp(-t * 9),
      {
        rate: 11025,
        envelope: (u) => Math.min(1, u * 80) * (1 - u),
      },
    ),
    // a wooden creak: a low, slowly bending buzz
    creak: sample(0.45, mix([osc.square((t) => 95 + 40 * Math.sin(t * 9)), 0.3], [osc.noise(9), 0.08]), { rate: 8000 }),
  };
  return { set, vocs };
}
