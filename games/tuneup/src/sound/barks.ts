// Teddy's and Gwinn's real barks: Lewis Moten's own recordings of his dogs (the guided tour's
// web/public/tour/sfx/teddy-bark-1..4.ogg and gwinn-bark-1.ogg; NOTICE.md), converted once with
// FFmpeg to 8-bit mono 11025 Hz WAVs in barks/ so the build reads them natively:
//   ffmpeg -i <clip>.ogg -ac 1 -ar 11025 -af aresample=dither_method=none -c:a pcm_u8 \
//     -map_metadata -1 -fflags +bitexact -flags:a +bitexact barks/<name>.wav
// Each is about half a second, a VOC of about 5,900 bytes.
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BARKS = ['teddy1', 'teddy2', 'teddy3', 'teddy4', 'gwinn1'] as const;
export type Bark = (typeof BARKS)[number];

const here = dirname(fileURLToPath(import.meta.url));

/** A bark as a Creative Voice File at 11025 Hz. */
export function barkVoc(name: Bark): Uint8Array {
  return audioFileToVoc(join(here, 'barks', `${name}.wav`), { sampleRate: 11025, maxBytes: 8000 });
}
