// A wheel with empty vector art still draws the pixel symbol on both discs.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../../test/fakeDom';
import { codeWheelPicture } from './codeWheel';

afterEach(() => vi.unstubAllGlobals());

it.each([false, true])('draws pixel glyphs when face art is empty (split=%s)', (split) => {
  const doc = new FakeDoc();
  const paths: FakeEl[] = [];
  vi.stubGlobal('document', {
    createElementNS(_ns: string, tag: string) {
      const node = doc.createElement(tag);
      if (tag === 'path') paths.push(node);
      return node;
    },
  });
  codeWheelPicture({ kind: 'codewheel', title: 'Dial', heading: 'Dial', outer: ['A'], inner: ['A'], glyphs: { A: ['#', '#'] }, faceArt: { A: [] }, split });
  const glyphs = paths.filter((path) => path.attrs.class === 'cw-glyph');
  expect(glyphs).toHaveLength(2);
  for (const glyph of glyphs) expect(glyph.attrs.d.match(/M/g)).toHaveLength(split ? 1 : 2);
});
