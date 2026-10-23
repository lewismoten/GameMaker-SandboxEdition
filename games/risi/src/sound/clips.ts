// Digitized clips of the six songs of Veni, Vidi, Risi! (Lewis Moten's group), sung in Latin, as
// Sound Blaster .VOC files. The samples (clips/<name>.pcm: 8-bit unsigned mono) are cut from the
// recordings by games/risi/tools/cutClips.py, which reads the MP3s (not in the repo) and
// regenerates them exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under
// 40,000 bytes; the longer lines are kept at 8000 Hz.
//
// Cue table (seconds of each recording; edges snap to the quietest 10 ms of the voice):
//   name       song                       start    end    rate      what is sung
//   canis      Canis Meus Flatum Dedit     7.47   12.29   8000 Hz   "Canis meus... flatum dedit!"
//   dii        Canis Meus Flatum Dedit    12.75   15.97  11025 Hz   "O dii immortales"
//   flatus     Canis Meus Flatum Dedit    67.50   70.28  11025 Hz   "O flatus, perfidus ventus!"
//   summa      Laudes Ignavi              13.55   16.46  11025 Hz   "Summa laus et gloria"
//   currimus   Laudes Ignavi              75.62   79.20  11025 Hz   "Cucurri-curri-currimus!"
//   victoria   Laudes Ignavi              79.67   83.83   8000 Hz   "Ad victoriam pervenimus!"
//   titus      Titus Torquet Lingua       19.15   23.10   8000 Hz   "Titus tot titulos tetigit"
//   ter        Titus Torquet Lingua       24.97   27.87  11025 Hz   "Titus, titulus ter!"
//   tecta      Titus Torquet Lingua       27.87   32.52   8000 Hz   "Tanta tecta tecti tectis"
//   felis      Felis Fortissimus          39.56   42.95  11025 Hz   "Felis fortissimus, terror nocturnus!"
//   cheddar    Felis Fortissimus          83.98   85.88  11025 Hz   "Ubi est cheddar?"
//   corona     Felis Fortissimus         125.47  128.92  11025 Hz   "...corona casei!"
//   piscis     Canit Piscis Aureus        14.99   19.66   8000 Hz   "O piscis aureus"
//   cantemus   Canit Piscis Aureus       143.32  146.22  11025 Hz   "Cantemus omnes"
//   nemo       Silentium Ridentium        55.51   58.49  11025 Hz   "...nemo ridet."
//   quisridet  Silentium Ridentium        75.47   77.68  11025 Hz   "...sed quis ridet?"
//   ridetisne  Silentium Ridentium       160.18  164.72   8000 Hz   "Ridetisne? Nonne ridetis?"
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '../../../../web/src/formats/voc';

export const CLIPS = {
  canis: 8000,
  dii: 11025,
  flatus: 11025,
  summa: 11025,
  currimus: 11025,
  victoria: 8000,
  titus: 8000,
  ter: 11025,
  tecta: 8000,
  felis: 11025,
  cheddar: 11025,
  corona: 11025,
  piscis: 8000,
  cantemus: 11025,
  nemo: 11025,
  quisridet: 11025,
  ridetisne: 8000,
} as const;
export type ClipName = keyof typeof CLIPS;

const here = dirname(fileURLToPath(import.meta.url));

/** A clip's samples (-1..1) at its own rate. */
export function clipSamples(name: ClipName): Float32Array {
  const pcm = readFileSync(join(here, 'clips', `${name}.pcm`));
  const samples = new Float32Array(pcm.length);
  // encodeVoc writes round(v * 127 + 128), so this gives back the very bytes cutClips.py wrote.
  for (let i = 0; i < pcm.length; i++) samples[i] = (pcm[i] - 128) / 127;
  return samples;
}

/** Samples as a Creative Voice File (checked against Game-Maker's 16-bit size). */
export function vocOf(name: string, samples: Float32Array, rate: number): Uint8Array {
  const voc = encodeVoc(samples, rate);
  if (voc.length >= 40000) throw new Error(`${name}.voc is ${voc.length} bytes; Game-Maker reads 16 bits of size`);
  return voc;
}

/** The clip as a Creative Voice File at its own rate. */
export function clipVoc(name: ClipName): Uint8Array {
  return vocOf(name, clipSamples(name), CLIPS[name]);
}
