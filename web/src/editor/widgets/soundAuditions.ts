// Playable sound-set parts retain their DOS slot number, including silent and digital-only gaps.
import { parseSoundSet, SOUND_NAMES } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { TICK_RATE } from '@lewismoten/gamemaker-sandbox-engine/audio/cmfPlayer';
import type { GameFiles } from '../../project/files';

export interface SoundAudition {
  slot: number;
  label: string;
  kind: 'speaker' | 'voc';
  seconds: number;
  freqs?: Uint16Array;
  bytes?: Uint8Array;
  samples?: Float32Array;
  file?: string;
}

/** Each slot's PC speaker sound followed by its VOC, when those parts are actually playable. */
export function soundAuditions(bytes: Uint8Array, files: Pick<GameFiles, 'get'>): SoundAudition[] {
  const set = parseSoundSet(bytes);
  return set.freqs.flatMap((freqs, slot) => {
    const label = `${slot}. ${SOUND_NAMES[slot] ?? 'Effect'}`;
    const parts: SoundAudition[] = [];
    if (freqs.some((frequency) => frequency >= 20)) parts.push({ slot, label, kind: 'speaker', freqs, seconds: freqs.length / TICK_RATE });
    const stem = set.digital[slot].trim();
    const file = `${stem}.voc`;
    const voc = stem ? files.get(file) : undefined;
    if (voc && isVoc(voc)) {
      try {
        const decoded = decodeVoc(voc);
        if (decoded.samples.length && decoded.sampleRate > 0)
          parts.push({ slot, label, kind: 'voc', bytes: voc, file, samples: decoded.samples, seconds: decoded.samples.length / decoded.sampleRate });
      } catch {
        // A broken digital companion must not hide the other effects or its PC speaker pair.
      }
    }
    return parts;
  });
}
