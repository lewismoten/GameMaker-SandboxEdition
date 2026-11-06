// The ⚙ Settings menu's "Back up / restore…" item loads the backup dialog (it once toasted "not ready yet"), and every
// module the menu loads on a click exists. Source-level, since the tests run without a DOM.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const src = readFileSync(join(import.meta.dirname, 'settingsMenu.ts'), 'utf8');

it('Back up / restore… opens openDataBackup, with no "not ready" fallback', () => {
  expect(src).toContain("import('./backup/openDataBackup').then((m) => m.openDataBackup())");
  expect(src).not.toMatch(/not ready yet|import\.meta\.glob/);
  expect(existsSync(join(import.meta.dirname, 'backup/openDataBackup.ts'))).toBe(true);
});

it('every dynamic import in the menu points at a real module', () => {
  for (const [, path] of src.matchAll(/import\('(\.[^']+)'\)/g)) {
    expect(existsSync(join(import.meta.dirname, `${path}.ts`)), path).toBe(true);
  }
});
