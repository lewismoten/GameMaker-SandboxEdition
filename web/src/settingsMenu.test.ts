// The Settings menu opens backup from its labeled button and can resolve its lazy imports.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../test/fakeDom';
import { openDataBackup } from './backup/openDataBackup';
import { settingsItems } from './settingsMenu';

vi.mock('./backup/openDataBackup', () => ({ openDataBackup: vi.fn() }));
vi.mock('./assistant/chat/settingsDialog', () => ({ openAiSetup: vi.fn() }));
vi.mock('./theme', () => ({ themeItem: () => document.createElement('button') }));

afterEach(() => vi.unstubAllGlobals());

const src = readFileSync(join(import.meta.dirname, 'settingsMenu.ts'), 'utf8');

it('Back up / restore… opens the backup dialog', async () => {
  vi.stubGlobal('document', new FakeDoc());
  const items = settingsItems() as unknown as FakeEl[];
  const button = items.find((item) => item.tag === 'button' && item.children.some((child) => child.textContent.trim() === 'Back up / restore…'));
  expect(button).toBeDefined();
  button!.fire('click');
  await vi.dynamicImportSettled();
  expect(openDataBackup).toHaveBeenCalledOnce();
});

it('every dynamic import in the menu points at a real module', () => {
  for (const [, path] of src.matchAll(/import\('(\.[^']+)'\)/g)) {
    expect(existsSync(join(import.meta.dirname, `${path}.ts`)), path).toBe(true);
  }
});
