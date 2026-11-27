// Keep the source credit for the history guide's Usenet account in the repository notice.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('credits both archived Usenet posts that the history guide paraphrases', () => {
  const notice = readFileSync(new URL('../../NOTICE.md', import.meta.url), 'utf8');
  const credit = notice.split(/\n\s*\n/).find((paragraph) => paragraph.includes('rec.games.programmer')) ?? '';
  for (const detail of ['Andy Stone', 'Kirk Baum', 'Discmaster', '4743', '4778', 'paraphrase']) {
    expect(credit).toContain(detail);
  }
});
