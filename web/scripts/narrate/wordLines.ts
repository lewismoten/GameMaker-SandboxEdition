// Builds the recording list for the pronunciation report.
import type { Line } from './lineIndex';

export type Voiced = Line & { speaker?: string };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The sentence a word is tested in. A word alone is too short for both engines (Pocket TTS mumbles
 * it, and Whisper makes up words for a clip under a second), so it sits in the same short frame.
 */
const carrier = (word: string) => `This is ${word}, again.`;

/** A test line per lexicon word and voice that says it: the word in its frame, in that voice. */
export function testLines(lines: Voiced[], words: string[]): (Line & { word: string; speakers: string[] })[] {
  const out = new Map<string, Line & { word: string; speakers: string[] }>();
  for (const word of words) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu');
    for (const l of lines.filter((l) => re.test(l.spoken ?? l.text))) {
      const v = l.voice ?? { sample: 'lewis', semitones: 0, tempo: 1 };
      const pitch = String(v.semitones).replace(/^-/, 'minus-');
      const id = slug(`${word} ${v.sample} ${pitch} ${v.tempo}`);
      const t = out.get(id) ?? { id, chapter: 'words', where: '', text: carrier(word), voice: v, word, speakers: [] };
      if (!t.speakers.includes(l.speaker ?? '')) t.speakers.push(l.speaker ?? '');
      out.set(id, t);
    }
  }
  return [...out.values()];
}
