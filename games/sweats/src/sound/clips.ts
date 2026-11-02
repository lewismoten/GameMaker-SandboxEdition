// Digitized lines of the seventeen monologues of "Shakespeare in Sweatpants" (The Bard of
// Bizarre), as Sound Blaster .VOC files. The samples (clips/<name>.wav: lossless 8-bit unsigned mono WAV) are
// cut from the recordings by games/sweats/tools/cutClips.py, which reads the MP3s (not in the
// repo) and regenerates them exactly; its cue table says what each one says. Game-Maker reads a
// VOC's size as 16 bits, so each stays under 40,000 bytes.
import { decodeAudioFile } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

const here = dirname(fileURLToPath(import.meta.url));

/** The rate a clip was cut at (the cue table's slow ones are 8000 Hz). */
function clipRate(name: string): number {
  const rates = JSON.parse(readFileSync(join(here, 'clips', 'rates.json'), 'utf8')) as Record<string, number>;
  return rates[name] ?? 11025;
}

export function hasClip(name: string): boolean {
  return existsSync(join(here, 'clips', `${name}.wav`));
}

/** A clip's samples (-1..1) at its own rate. */
function clipSamples(name: string): Float32Array {
  return decodeAudioFile(join(here, 'clips', `${name}.wav`), { sampleRate: clipRate(name) });
}

/** Samples as a Creative Voice File (checked against Game-Maker's 16-bit size). */
function vocOf(name: string, samples: Float32Array, rate: number): Uint8Array {
  const voc = encodeVoc(samples, rate);
  if (voc.length >= 40000) throw new Error(`${name}.voc is ${voc.length} bytes; Game-Maker reads 16 bits of size`);
  return voc;
}

/** The clip as a Creative Voice File at its own rate. */
export function clipVoc(name: string): Uint8Array {
  return vocOf(name, clipSamples(name), clipRate(name));
}
