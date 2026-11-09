// PASS THE PIE's sound effects (pie.snd): a PC speaker tune for every slot and a synthesized Sound Blaster .VOC for the
// important ones, made in code with the kit's little synthesizer (no recordings, no voices).
//   help  a cheerful chime (a snack)          kill  a punchy "whump-pop" with a crunch (a gadget kicked, a vacuum fed)
//   coin  a bright tick (an acorn)            life  a five-note jingle
//   score a short blip                        gain  a happy two-note (a dish or key picked up)
//   use   a door chime (a gate opens)         jump  a light spring
//   hurt  a cartoon bonk                      die   a deflating slide-whistle "wah-wah"
//   kick  Mr. Plume's whoosh with a snap      toss  Rory's soft "fwip" with a little spin
//   boom  a big bass thud for the boss's phases
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { lowpass } from '@lewismoten/gamemaker-sandbox-tools/kit/synthParts';
import { chime } from '../../kit/teddySounds';

/** Slot numbers: 0 to 8 Game-Maker plays itself when a counter changes; the rest a level's script plays. */
export const SND = {
  help: 0,
  kill: 1,
  coin: 2,
  spend: 3,
  life: 4,
  score: 5,
  lose: 6,
  gain: 7,
  use: 8,
  jump: 9,
  hurt: 10,
  die: 11,
  step: 12,
  kick: 13,
  toss: 14,
  boom: 15,
} as const;

/** WHUMP, pop, crunch: a falling thump, a bright pop on top and a gritty burst of noise. */
function whump(): Uint8Array {
  const v = mix([osc.sine((t) => 240 * Math.exp(-t * 14) + 55), 0.9], [osc.sine((t) => 1500 - 9000 * t), 0.35], [lowpass(osc.noise(31), 0.55), 0.55]);
  return sample(0.2, v, { envelope: (u) => Math.min(1, u * 60) * (1 - u) ** 2.2, gain: 1 });
}

/** A spring: a quick rising boing with a wobble. */
function spring(): Uint8Array {
  return sample(
    0.22,
    osc.sine((t) => 260 + 900 * t + 60 * Math.sin(t * 110)),
    { envelope: (u) => Math.min(1, u * 30) * (1 - u) ** 1.4 },
  );
}

/** A cartoon bonk: a wooden knock that dips in pitch. */
function bonk(): Uint8Array {
  const v = mix(
    [osc.sine((t) => 420 * Math.exp(-t * 9) + 110), 0.8],
    [osc.square((t) => 210 * Math.exp(-t * 9) + 70), 0.2],
    [lowpass(osc.noise(43), 0.4), 0.15],
  );
  return sample(0.2, v, { envelope: (u) => Math.min(1, u * 80) * (1 - u) ** 2, gain: 1 });
}

/** A slide whistle sinking, with two wobbles: "wah-wah". */
function wahWah(): Uint8Array {
  return sample(
    0.7,
    osc.sine((t) => 950 * Math.exp(-t * 1.6) + 140 + 40 * Math.sin(t * 40)),
    { envelope: (u) => Math.min(1, u * 20) * (0.35 + 0.65 * Math.abs(Math.sin(u * Math.PI * 2))) * (1 - u * 0.5) * Math.min(1, (1 - u) * 6), gain: 0.95 },
  );
}

/** Mr. Plume's kick: air rushing up the scale, then a sharp snap right at the end. */
function kick(): Uint8Array {
  const n = osc.noise(51);
  let y = 0;
  const air: Synth = (t) => (y += (n(t) - y) * (0.06 + 0.7 * (t / 0.2) ** 2));
  const snap: Synth = (t) => (t > 0.16 ? n(t) * 1.4 + Math.sin(t * 2 * Math.PI * 900) * 0.6 : 0);
  return sample(0.22, mix([air, 0.9], [snap, 0.7]), { envelope: (u) => (u < 0.72 ? 0.2 + u * 1.1 : u < 0.78 ? 1 : (1 - u) ** 2 * 5), gain: 1 });
}

/** Rory's toss: a soft puff of air with a little rising spin. */
function toss(): Uint8Array {
  const puff = lowpass(osc.noise(57), 0.12);
  const spin = osc.sine((t) => 380 + 700 * t);
  return sample(0.17, mix([puff, 0.9], [(t) => spin(t) * (0.5 + 0.5 * Math.sin(t * 90)), 0.22]), { envelope: (u) => Math.sin(u * Math.PI) ** 1.4, gain: 0.9 });
}

/** A big bass thud: a low note dropping into the floor with a rumble. */
function boom(): Uint8Array {
  const v = mix([osc.sine((t) => 85 * Math.exp(-t * 3) + 32), 1], [lowpass(osc.noise(67), 0.05), 0.5]);
  return sample(0.55, v, { envelope: (u) => Math.min(1, u * 40) * (1 - u) ** 1.6, gain: 1 });
}

export function buildGameSounds(): { set: SoundSet; vocs: Record<string, Uint8Array> } {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const put = (n: number, freqs: Uint16Array, name?: string, voc?: Uint8Array) => {
    set.freqs[n] = freqs;
    if (name && voc) {
      set.digital[n] = name;
      vocs[name] = voc;
    }
  };
  put(SND.help, SPEAKER.arpeggio([659, 880, 1319]), 'chime', chime([660, 880, 1320], 0.08));
  put(
    SND.kill,
    speaker((i) => (i < 3 ? 160 : i < 6 ? 1500 - i * 150 : i < 14 ? 90 + ((i * 53) % 7) * 30 : 0)),
    'whump',
    whump(),
  );
  put(
    SND.coin,
    speaker((i) => (i < 5 ? 2093 : 0)),
    'tick',
    chime([2200], 0.03),
  );
  put(SND.spend, SPEAKER.fall(1200, 500));
  put(SND.life, SPEAKER.arpeggio([523, 659, 784, 1047, 1319]), 'jingle', chime([523, 659, 784, 1047, 1319], 0.075));
  put(
    SND.score,
    speaker((i) => (i < 6 ? 1568 : 0)),
    'blip',
    chime([1568], 0.05),
  );
  put(SND.lose, SPEAKER.fall(700, 140));
  put(SND.gain, SPEAKER.arpeggio([784, 1175]), 'gain', chime([784, 1175], 0.1));
  put(
    SND.use,
    speaker((i) => (i < 12 ? 880 : i < 14 ? 0 : i < 30 ? 659 : 0)),
    'door',
    chime([880, 659], 0.15),
  );
  put(SND.jump, SPEAKER.rise(300, 900), 'spring', spring());
  put(SND.hurt, SPEAKER.hurt(), 'bonk', bonk());
  put(
    SND.die,
    speaker((i) => (i < 30 ? 900 * (1 - i / 36) ** 2 + 120 + (i % 10 < 5 ? 80 : 0) : 0)),
    'wahwah',
    wahWah(),
  );
  put(
    SND.step,
    speaker((i) => (i < 2 ? 1800 : 0)),
  );
  put(
    SND.kick,
    speaker((i) => (i < 12 ? 300 + i * i * 12 : i < 14 ? 3200 : 0)),
    'kick',
    kick(),
  );
  put(
    SND.toss,
    speaker((i) => (i < 10 ? 500 + i * 70 : 0)),
    'fwip',
    toss(),
  );
  put(
    SND.boom,
    speaker((i) => (i < 30 ? 120 - i * 2 : 0)),
    'boom',
    boom(),
  );
  return { set, vocs };
}
