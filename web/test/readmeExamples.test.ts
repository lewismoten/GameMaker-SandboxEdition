// Runs the SDK READMEs' Node examples exactly as written, against the built packages (dist/), and
// checks what each prints against its `// prints:` line, so the READMEs cannot drift from the code.
// Skipped when the packages are not built (npm run build:packages).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
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

it.each([true, false])('keeps Play disabled during play and restores it for a valid selection: %s', async (validSelection) => {
  const handlers = new Map<string, () => Promise<void>>();
  const control = {
    disabled: true,
    files: [{ name: 'PLAY.GAM', arrayBuffer: () => new ArrayBuffer(0) }],
    addEventListener(event: string, handler: () => Promise<void>) {
      handlers.set(event, handler);
    },
  };
  let machines = 0;
  let destroyed = 0;
  let finish!: () => void;
  const playing = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const example = block('engine/README.md', 'Pass the files').replace(/^import .*;$/m, '');
  runInNewContext(ts.transpile(example, { target: ts.ScriptTarget.ES2022 }), {
    document: { querySelector: () => control },
    GameFiles: class {
      constructor(private entries: [string, Uint8Array][]) {}
      mainGame() {
        return this.entries[0]?.[0];
      }
    },
    Machine: class {
      audio = { resume: () => Promise.resolve() };
      constructor() {
        machines++;
      }
      destroy() {
        destroyed++;
      }
    },
    runGame: () => playing,
  });
  const select = handlers.get('change')!;
  const click = handlers.get('click')!;
  await select();
  expect(control.disabled).toBe(false);
  const first = click();
  const second = click();
  try {
    expect(machines).toBe(1);
    expect(control.disabled).toBe(true);
    if (!validSelection) control.files = [];
    await select();
    expect(control.disabled).toBe(true);
  } finally {
    finish();
    await Promise.all([first, second]);
  }
  expect(destroyed).toBe(1);
  expect(control.disabled).toBe(!validSelection);
});
