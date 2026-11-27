// Keep the shareware archive names in the repository notice usable on case-sensitive filesystems.
import { readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('spells both Workshop archive names as they appear on the CD', () => {
  const root = resolve(__dirname, '../..');
  const notice = readFileSync(resolve(root, 'NOTICE.md'), 'utf8');
  const names = [...notice.matchAll(/`([^`\n]*gws(?:dos|win)\.zip)`/gi)].map((match) => basename(match[1]));
  const archives = readdirSync(resolve(root, 'cd/sharware/tools')).filter((name) => /^gws(?:dos|win)\.zip$/i.test(name));
  expect(names.sort()).toEqual(archives.sort());
});
