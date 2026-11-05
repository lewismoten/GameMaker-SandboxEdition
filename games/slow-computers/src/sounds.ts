// SLOW COMPUTERS' sounds. Every effect is a PC speaker blip (the kit's), except two that are Sound Blaster
// .VOC files, because the lesson is how long a .VOC takes to read from the disk:
//   BLIP.VOC     a quarter second: about 2.7 KB, read in a blink
//   LONGSND.VOC  five and a half seconds of bells: about 60 KB (a .VOC must stay under 64 KB)
// Game-Maker plays a score sound when a block adds to the score, and a coin sound when one adds money.
// A block cannot name a sound itself, so the short pad adds a point and the long pad adds a coin.
import { newSoundSet, type SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { osc, sample, type Synth } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { SND } from '../../kit/starter/ids';
import { buildSounds } from '../../kit/starter/sounds';

export const SHORT_VOC = 'blip';
export const LONG_VOC = 'longsnd';

/** Bells walking up and down a pentatonic scale, 0.2 s apiece, each ringing out. */
function bells(): Synth {
  const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const walk = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 2, 4, 5, 3, 1, 0, 3, 5, 2, 4, 1, 5, 0, 2, 3, 4, 5, 3, 0];
  const NOTE = 0.18;
  const tones = scale.map((f) => osc.sine(f));
  const over = scale.map((f) => osc.sine(f * 2));
  return (t) => {
    const k = Math.min(walk.length - 1, Math.floor(t / NOTE));
    const u = t - k * NOTE;
    const ring = Math.exp(-u * 11);
    return (tones[walk[k]](t) * 0.7 + over[walk[k]](t) * 0.2) * ring;
  };
}

export function buildVocs(): Record<string, Uint8Array> {
  return {
    [SHORT_VOC]: sample(
      0.25,
      osc.sine((t) => 660 + t * 1400),
      { gain: 0.5 },
    ),
    [LONG_VOC]: sample(5.4, bells(), { gain: 0.55, envelope: (u) => (u < 0.01 ? u / 0.01 : u > 0.95 ? (1 - u) / 0.05 : 1) }),
  };
}

/** The sound set: the kit's speaker sounds, with the two .VOC files on the score and coin slots. */
export function buildSoundSet(): SoundSet {
  const set = buildSounds();
  set.digital[SND.score] = SHORT_VOC;
  set.digital[SND.coin] = LONG_VOC;
  return set;
}
