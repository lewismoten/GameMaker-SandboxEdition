// Each voice that says a lexicon word needs its own recording path.
import { expect, it } from 'vitest';
import { clipPath } from './lineIndex';
import { testLines } from './wordLines';

it('records opposite pitches separately and groups speakers at the same pitch', () => {
  const lines = [2, -2, 2].map((semitones, i) => ({
    id: String(i),
    chapter: 'tour',
    text: 'PNG',
    speaker: String(i),
    voice: { sample: 'guide', semitones, tempo: 1 },
  }));
  const recordings = testLines(lines, ['PNG']);
  expect(new Set(recordings.map(clipPath)).size).toBe(2);
  expect(recordings.map(({ voice, speakers }) => [voice?.semitones, speakers])).toEqual([
    [2, ['0', '2']],
    [-2, ['1']],
  ]);
});
