// Applying many short lines must not turn each line into a function argument.
import { expect, it } from 'vitest';
import { diffFile, patchFile } from '@lewismoten/gamemaker-sandbox-tools/delta';

it('applies a large line delta without spreading the inserted lines as arguments', () => {
  const before = new Uint8Array();
  const after = new TextEncoder().encode('x\n'.repeat(150000));
  const delta = diffFile('notes.txt', before, after)!;
  expect(delta.kind).toBe('lines');
  const restored = patchFile(before, delta)!;
  expect(restored.length).toBe(after.length);
  expect(restored.every((value, index) => value === after[index])).toBe(true);
});

it('keeps the prefix and suffix around a line replacement', () => {
  const enc = new TextEncoder();
  const before = enc.encode('first\nold\nlast\n');
  const after = enc.encode('first\nnew\nmore\nlast\n');
  expect(patchFile(before, diffFile('notes.txt', before, after)!)).toEqual(after);
});
