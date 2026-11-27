// Keep the published reproduction commands aligned with the November 4 run.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('runs four rounds for each recorded seed in the case study', () => {
  const study = readFileSync(new URL('../../docs/research/malformed-file-fuzzing.md', import.meta.url), 'utf8');
  const commands = study.split('## Reproduce')[1].split('\n');
  for (const seed of [1, 2]) {
    expect(commands).toContain(`npm run fuzz:files -- --seed ${seed} --rounds 4`);
  }
});
