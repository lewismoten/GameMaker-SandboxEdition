// Checks the recorded town tour before the command reports success.
import type { replay } from '../../kit/walkthrough';

type DemoResult = Pick<Awaited<ReturnType<typeof replay>>, 'scenes' | 'keysLeft' | 'won' | 'error'>;

export function checkDemo(r: DemoResult) {
  if (r.error !== undefined) throw r.error;
  const expected = '2 3 2 3 4 3 4 1';
  const seen = r.scenes.join(' ');
  if (!r.won || seen !== expected || r.keysLeft !== 0) {
    throw new Error(`demoCheck: expected a win through scenes ${expected} with every key played; got ${seen}, won=${r.won}, ${r.keysLeft} keys unplayed`);
  }
}
