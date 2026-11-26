// Keep the recording instructions consistent with the key-and-door demo.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('describes collecting two keys and spending one at the door', () => {
  const instructions = readFileSync(new URL('./gendemo.ts', import.meta.url), 'utf8').split('import ')[0];
  expect(instructions).toMatch(/two (?:gold )?keys/i);
  expect(instructions).toMatch(/spend\w* one .*door/i);
});
