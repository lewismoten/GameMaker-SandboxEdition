// Continuous-course geometry and annotation ownership, without browser raster allocation.
import { describe, expect, it, vi } from 'vitest';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { CourseLayout } from './levelCourse';
import type { Level } from './levelMapLayout';
import { scenePixels } from '../../gfx/levelPicture';
import { GameFiles } from '../../project/files';
import { coursePanelUrls, wholeCourseSize, wholeCourseSvg } from './levelCourseSvg';

type Drawing = { tag: string; attrs: Record<string, string | number>; children: (Drawing | string)[]; append(...children: (Drawing | string)[]): void };
vi.mock('./worldMapArt', () => ({
  SERIF: 'serif',
  el: (tag: string, attrs: Drawing['attrs'], ...children: Drawing['children']): Drawing => ({
    tag,
    attrs,
    children,
    append(...more) {
      this.children.push(...more);
    },
  }),
}));
vi.mock('../../gfx/levelPicture', () => ({ scenePixels: vi.fn() }));

const nodes = (d: Drawing): Drawing[] => [d, ...d.children.flatMap((c) => (typeof c === 'string' ? [] : nodes(c)))];
const words = (d: Drawing): string => d.children.map((c) => (typeof c === 'string' ? c : words(c))).join('');
const colors = { start: 'green', exit: 'blue', end: 'red', join: 'purple' };
function fixture(down = false): Level {
  const course: CourseLayout<Level['marks'][number]> = {
    up: [0, -1],
    right: [1, 0],
    down,
    cells: [],
    scale: 2,
    overlap: 3,
    box: { c0: -10, c1: 20, a0: -30, a1: 70 },
    panels: [
      { c0: -10, c1: 18, a0: -30, a1: 23 },
      { c0: -8, c1: 20, a0: 20, a1: 70 },
    ],
    marks: [{ at: { c: 5, a: 21 }, mark: { kind: 'start', x: 5, y: 21, w: 1, h: 1, text: 'START', scenes: [] } }],
    seams: [
      {
        axis: 'y',
        ends: [
          { c: -8, a: 21 },
          { c: 18, a: 21 },
        ],
      },
    ],
    laps: [{ n: 2, at: { c: 5, a: 21 } }],
    kinks: [],
    shortcuts: [{ from: { c: 5, a: 10 }, to: { c: 6, a: 50 } }],
  };
  if (down) course.panels.reverse();
  return { course } as Level;
}
const draw = (l: Level) =>
  wholeCourseSvg(
    {} as Game,
    l,
    l.course!.panels.map((p) => `${p.a0}.png`),
    7,
    11,
    colors,
    (m) => m.text!,
  ) as unknown as Drawing;

describe('continuous course drawing', () => {
  it('places image pieces in shared coordinates, including shifted sides and overlap', () => {
    const l = fixture();
    const images = nodes(draw(l)).filter((n) => n.tag === 'image');
    expect(images.map((n) => n.attrs)).toMatchObject([
      { href: '-30.png', x: 13, y: 107.6, width: 56, height: 106 },
      { href: '20.png', x: 17, y: 13.6, width: 56, height: 100 },
    ]);
    expect(Number(images[1].attrs.y) + Number(images[1].attrs.height) - Number(images[0].attrs.y)).toBeCloseTo(6);
    expect(wholeCourseSize(l.course!)).toEqual({ w: 72, h: 205.2 });
  });

  it('draws annotations once across former cuts and omits column navigation', () => {
    const d = draw(fixture());
    const text = words(d);
    expect(text.match(/START/g)).toHaveLength(1);
    expect(text.match(/LAP 2/g)).toHaveLength(1);
    expect(text.match(/shortcut A/g)).toHaveLength(2);
    expect(text).not.toMatch(/panel|continues|from the top|from the foot/);
    expect(nodes(d).filter((n) => n.tag === 'clipPath')).toHaveLength(1);
    expect(nodes(d).filter((n) => n.tag === 'line' && n.attrs.stroke === 'purple')).toHaveLength(1);
  });

  it('keeps downhill image positions unchanged and labels the start at the top', () => {
    const d = draw(fixture(true));
    const images = nodes(d).filter((n) => n.tag === 'image');
    expect(images[0].attrs).toMatchObject({ href: '20.png', x: 17, y: 13.6 });
    const start = nodes(d).find((n) => n.tag === 'text' && words(n).includes('start here'))!;
    const end = nodes(d).find((n) => n.tag === 'text' && words(n) === 'the end of the way')!;
    expect(words(start)).toContain('ride down');
    expect(Number(start.attrs.y)).toBeLessThan(Number(end.attrs.y));
  });
});

it('encodes each poster panel once as a data URL', async () => {
  const level = fixture();
  level.course!.panels = [0, 1].map((a0) => ({ c0: 0, c1: 1, a0, a1: a0 + 1 }));
  vi.mocked(scenePixels).mockReturnValue({ width: 1, height: 1, pixels: new Uint8Array(1), palette: new Uint8Array(768) });
  const createCanvas = () => ({
    getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(4 * w * h) }), putImageData: vi.fn() }),
    toBlob: vi.fn((done: BlobCallback) => done(new Blob())),
    toDataURL: vi.fn(() => 'data:image/png;base64,AAAA'),
  });
  const createElement = vi.fn(createCanvas);
  vi.stubGlobal('document', { createElement });
  try {
    const urls = await coursePanelUrls({ scenes: [] } as unknown as Game, new GameFiles(), level);
    expect(urls).toEqual(['data:image/png;base64,AAAA', 'data:image/png;base64,AAAA']);
    expect(createElement).toHaveBeenCalledTimes(2);
    for (const { value: canvas } of createElement.mock.results) {
      expect(canvas.toDataURL).toHaveBeenCalledTimes(1);
      expect(canvas.toBlob).not.toHaveBeenCalled();
    }
  } finally {
    vi.unstubAllGlobals();
  }
});
