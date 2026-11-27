// Both shopping routes use the same victory slide.
import { readFileSync } from 'node:fs';
import { parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { expect, it } from 'vitest';

it('celebrates opening both gates even when the heart is still for sale', () => {
  const disk = new URL('../disk/', import.meta.url);
  const slides = parseSlideList(readFileSync(new URL('won.lst', disk)));
  const caption = slides.find((slide) => slide.name.endsWith('.txt'))!;
  expect(textLines(readFileSync(new URL(caption.name, disk)))).toContain('BOTH GATES ARE OPEN');
});
