// Digitized clips of the sung recording of "Third Goat from the Left" (made with Riffusion), as
// Sound Blaster .VOC files.
// The samples (clips/<name>.wav: 8-bit unsigned mono at 11025 Hz) are cut from the recording by
// games/goat/tools/cutClips.py, which reads the MP3 (not in the repo) and regenerates them
// exactly. Game-Maker reads a VOC's size as 16 bits, so each stays under 40,000 bytes.
//
// Cue table (seconds of the recording; edges snap to the quietest 10 ms of the voice):
//   name       start    end     length  VOC bytes  why
//   hook        47.89   50.08   2.19 s    24178    chorus 1 "Third goat from the left": the one occurrence a speech
//                                                  recognizer heard word for word ("for-gotten" starts at 50.29)
//   hey        165.68  167.40   1.72 s    18996    the last "Hey...", alone after the band stops at 165.5
//   yeah         7.87   11.37   3.50 s    38621    the intro's "Yeah-ay-ay-ay!" melisma, the loudest voice over the band
//                                                  (center-voice to mix ratio 1.5, the song's highest)
//   bleat       78.32   79.45   1.13 s    12492    chorus 2 "li-i-ive!": a held vowel with about a semitone of wobble,
//                                                  the most goat-like of the held notes ("joy" is under half a second)
//   seesyou    155.15  156.52   1.37 s    15138    outro "He sees you." ("Even" starts at 156.7)
//   nightlong  137.49  140.49   3.00 s    33108    final chorus "...all night long." (clearer than the echo at 141.9)
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIPS = ['hook', 'hey', 'yeah', 'bleat', 'seesyou', 'nightlong'] as const;
type ClipName = (typeof CLIPS)[number];

const here = dirname(fileURLToPath(import.meta.url));

/** The clip as a Creative Voice File at 11025 Hz. */
export function clipVoc(name: ClipName): Uint8Array {
  return audioFileToVoc(join(here, 'clips', `${name}.wav`), { sampleRate: 11025, maxBytes: 39999 });
}
