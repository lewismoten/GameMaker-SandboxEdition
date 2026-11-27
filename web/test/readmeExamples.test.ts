// Runs the SDK READMEs' Node examples exactly as written, against the built packages (dist/), and
// checks what each prints against its `// prints:` line, so the READMEs cannot drift from the code.
// Skipped when the packages are not built (npm run build:packages).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(web, '..');
const built = existsSync(join(web, 'packages/engine/dist/formats/game.js')) && existsSync(join(web, 'packages/archives/dist/zip.js'));

/** The first ```ts block after `heading` in a README. */
function block(readme: string, heading: string): string {
  const text = readFileSync(join(web, 'packages', readme), 'utf8');
  const from = text.indexOf(heading);
  expect(from, `${heading} in ${readme}`).toBeGreaterThanOrEqual(0);
  const start = text.indexOf('```ts\n', from) + 6;
  return text.slice(start, text.indexOf('\n```', start)) + '\n';
}

function run(code: string): string {
  return execFileSync('node', ['--input-type=module'], { cwd: root, input: code, encoding: 'utf8' }).trim();
}

it('runs the snippet without a script file', () => {
  expect(run('console.log(process.argv[1] ?? "stdin")')).toBe('stdin');
});

describe.skipIf(!built)('README examples', () => {
  for (const [readme, heading] of [
    ['engine/README.md', '## Read a game file in Node.js'],
    ['archives/README.md', '## ZIP reading and writing'],
  ]) {
    it(`${readme} prints what its comment says`, () => {
      const code = block(readme, heading);
      const expected = /^\/\/ prints: (.*)$/m.exec(code)?.[1];
      expect(expected).toBeTruthy();
      expect(run(code)).toBe(expected);
    });
  }
});
