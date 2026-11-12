import { describe, expect, it } from 'vitest';
import { playerSections } from './kitNotes';
import { panBy } from './svgViewer';

describe('kitNotes', () => {
  it('leaves out the maker command block and the words after it, before the next heading', () => {
    const s = playerSections('# Kit\n\nIntro.\n\n```sh\nnpx run\n```\n\nIt writes files.\n\n## Glue\n\nStep.\n');
    expect(s.flatMap((x) => x.blocks.map((b) => b.tag))).toEqual(['p', 'p']);
    expect(s.map((x) => x.title)).toContain('Glue');
  });
});

describe('panBy', () => {
  it('moves a zoomed picture and stops it leaving the frame', () => {
    expect(panBy({ x: 0, y: 0, zoom: 2 }, 40, -10, 400, 300)).toEqual({ x: 40, y: -10, zoom: 2 });
    expect(panBy({ x: 0, y: 0, zoom: 2 }, 5000, 0, 400, 300).x).toBe(300);
  });
});
