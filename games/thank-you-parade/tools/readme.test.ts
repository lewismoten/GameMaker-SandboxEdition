// Keep contributor instructions in step with the game's command-line tools.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('documents each tool that contributors run directly', () => {
  const readme = readFileSync(new URL('./README.md', import.meta.url), 'utf8');
  for (const command of ['check', 'walkthrough', 'shots', 'levelShots', 'preview']) {
    expect(readme).toContain(`npx vite-node ../games/thank-you-parade/tools/${command}.ts`);
  }
});
