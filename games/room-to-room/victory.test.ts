// Read the caption DOS displays when either final room leads to the victory sequence.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { expect, it } from 'vitest';

it('celebrates finding a way out through either final door', () => {
  const read = (name: string) => readFileSync(fileURLToPath(new URL(`./disk/${name}`, import.meta.url)));
  const slides = parseSlideList(read('won.lst'));
  const caption = slides.find((slide) => slide.name.endsWith('.txt'))!;
  expect(textLines(read(caption.name))).toContain('YOU FOUND A WAY OUT');
});
