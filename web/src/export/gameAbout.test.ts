// DOS text presentation preserves prose, frames and transport controls, unlike title trimming.
import { expect, it } from 'vitest';
import { dosText } from './gameAbout';
import { readFileIdDiz } from '../project/fileIdDiz';

it('keeps extended CP437 prose and box drawing but honors DOS EOF and line endings', () => {
  const bytes = Uint8Array.of(0xb3, 32, 0x82, 0x81, 0xab, 32, 0xb3, 13, 10, 65, 26, 66);
  expect(dosText(bytes)).toBe('│ éü½ │\nA');
  expect(readFileIdDiz(bytes).about).toEqual({ title: '│ éü½ │', description: 'A' });
});
