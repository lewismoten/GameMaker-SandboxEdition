// OUT LOUD's four voice clips (.VOC), made in code: a little formant synthesizer says a few
// syllables of nonsense, the way a game of 1994 might hum a character's talk. The clips are
// not recordings of anyone. To use your own, record 8-bit mono at 11 kHz into a .VOC file
// with the same name; the game does not care what is in it.
//
//   hello   Kit's "hello", two short syllables (about 0.7 s)
//   welcome the first speaker's line, a bright greeting (about 1.9 s)
//   deeper  the second speaker's line, lower and slower (about 2.0 s)
//   bye     the last speaker's goodbye (about 2.4 s)
import { mumbleVoc, type Syllable } from '@lewismoten/gamemaker-sandbox-tools/kit/mumble';

/** Renders `line` as a .VOC at 11 025 Hz, 8 bits, mono. */
const say = (line: Syllable[], gain = 1.6): Uint8Array => mumbleVoc(line, { gain });

/** The four clips, by file name (without .VOC). */
export const VOICES: Record<'hello' | 'welcome' | 'deeper' | 'bye', Uint8Array> = {
  hello: say([
    ['e', 210, 260, 0.2, 0.03],
    ['o', 300, 230, 0.4],
  ]),
  welcome: say([
    ['e', 260, 300, 0.2, 0.02],
    ['o', 320, 280, 0.25, 0.1],
    ['u', 300, 340, 0.2, 0.02],
    ['a', 340, 380, 0.25, 0.1],
    ['i', 330, 360, 0.2, 0.02],
    ['o', 380, 260, 0.5],
  ]),
  deeper: say(
    [
      ['o', 130, 120, 0.3, 0.06],
      ['a', 150, 125, 0.3, 0.1],
      ['u', 125, 110, 0.3, 0.06],
      ['e', 140, 150, 0.25, 0.04],
      ['o', 150, 95, 0.55],
    ],
    1.9,
  ),
  bye: say([
    ['a', 280, 330, 0.22, 0.04],
    ['i', 330, 300, 0.22, 0.12],
    ['e', 300, 280, 0.2, 0.04],
    ['a', 290, 320, 0.22, 0.12],
    ['o', 320, 280, 0.2, 0.04],
    ['u', 280, 250, 0.2, 0.04],
    ['a', 260, 180, 0.6],
  ]),
};
