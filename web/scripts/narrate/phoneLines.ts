// The wall phone's lines for scripts/narrate.ts (`--lines phone`) and voice:check: one clip per
// sentence of src/audio/phone/phoneScript.ts, plus the spliced number clips (the talking clock's
// hours, minutes and seconds; the Hint Giant's dollars and cents), each in its caller's voice (phoneCast.ts).
// Clips go in public/phone/voice/<caller>/<id>.ogg. Pure, no models.
import { CAST } from '../../src/audio/phone/phoneCast';
import { SAID, SCRIPT } from '../../src/audio/phone/phoneScript';
import { SENTENCE_PARTS, TIME_TONE, tbId, tlId, type Part } from '../../src/audio/phone/phoneClips';
import { BILL_LEAD } from '../../src/audio/phone/phoneScript';
import type { Line } from './lineIndex';
import { numberWords } from './spoken';

const range = (from: number, to: number, step = 1): number[] => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/** Every clip the phone's splices can ask for, in the talking clock's and the Hint Giant's voices. */
function splicedParts(): (Part & { where: string; spoken?: string })[] {
  const tl = (id: string, text: string, spoken?: string) => ({ cast: 'time-lady', id, text, spoken, where: 'Time: spliced into the time of day' });
  const tb = (id: string, text: string) => ({ cast: 'giant', id, text, where: 'Hint line: spliced into the pretend bill' });
  return [
    tl(tlId.tone, TIME_TONE),
    ...range(1, 59).map((n) => tl(tlId.n(n), numberWords(n))),
    ...range(1, 9).map((n) => tl(tlId.oh(n), `oh ${numberWords(n)}`)),
    tl(tlId.oclock, 'o’clock'),
    ...range(10, 50, 10).map((n) => tl(tlId.sec(n), `and ${numberWords(n)} seconds`)),
    tl(tlId.exactly, 'exactly'),
    tb(tbId.lead, BILL_LEAD),
    ...range(0, 99).map((n) => tb(tbId.n(n), numberWords(n))),
    tb(tbId.dollar, 'dollar'),
    tb(tbId.dollars, 'dollars'),
    tb(tbId.and, 'and'),
    tb(tbId.cent, 'cent'),
    tb(tbId.cents, 'cents'),
  ];
}

export function phoneLines(): Line[] {
  const sentences = SENTENCE_PARTS.map((p) => ({
    ...p,
    spoken: SAID[p.text],
    where: SCRIPT.find((l) => l.voice === p.cast && l.text.includes(p.text))?.where ?? '',
  }));
  return [...sentences, ...splicedParts()].map(({ cast, id, text, spoken, where }) => {
    const v = CAST[cast];
    return { id, chapter: cast, where, text, spoken, voice: { sample: v.sample, semitones: v.semitones, tempo: v.tempo } };
  });
}
