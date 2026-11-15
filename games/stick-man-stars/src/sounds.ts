// STICK MAN STARS' sounds: the kit's, a throw swish and a short, code-synthesized lighting chime.
import type { SoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { SPEAKER, sample } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../kit/starter/sounds';

/** The throw's sound number (the kit uses 0 to 12). */
export const SND_THROW = 13;

/** A soft two-note bell, rendered afresh on every build, not recorded or model-generated audio. */
export function houseLitVoc(): Uint8Array {
  return sample(
    0.24,
    (t) => {
      const note = t < 0.09 ? 784 : 1047;
      const local = t < 0.09 ? t : t - 0.09;
      const length = t < 0.09 ? 0.09 : 0.15;
      const envelope = Math.min(1, local / 0.004, (length - local) / 0.008);
      return (envelope * (Math.sin(2 * Math.PI * note * local) + 0.2 * Math.sin(4 * Math.PI * note * local))) / 1.2;
    },
    { gain: 0.65 },
  );
}

export function throwSounds(): SoundSet {
  const set = buildSounds();
  set.freqs[SND_THROW] = SPEAKER.rise(500, 1500);
  // PLAYGAME has one weapon-impact slot, not per-monster sounds. It also acknowledges bot
  // pops and the Big Repo's intermediate lanterns; it never fires for already-lit scenery.
  set.freqs[1] = SPEAKER.arpeggio([784, 1047]);
  set.digital[1] = 'HOUSELIT';
  return set;
}
