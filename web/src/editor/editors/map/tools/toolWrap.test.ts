// Wrapped gestures edit only native cells and retain the physical direction of fast drags.
import { describe, expect, it, vi } from 'vitest';
import { MapTools, type ToolMode } from './toolController';
import type { Project } from '../../../core/project';
import type { OverlayState } from './overlay';
import { captureSelection } from './selection';

function editor(mode: ToolMode) {
  const overlay: OverlayState = { grid: false, found: [], wrap: true };
  const host = {
    project: {} as Project,
    blocksArr: new Uint8Array(10000),
    bbl: () => '',
    blocks: () => [],
    palette: () => new Uint8Array(768),
    imgs: () => [],
    brush: () => 7,
    wrap: () => true,
    remember: vi.fn(),
    changed: vi.fn(),
    overlay,
    drawOverlay: vi.fn(),
    setMode: vi.fn(),
  };
  const tools = new MapTools(host, {} as HTMLElement);
  tools.mode = mode;
  vi.spyOn(tools, 'renderPanel').mockImplementation(() => {});
  return { tools, host };
}

describe('wrapped map gestures', () => {
  it('previews and commits lines and rectangles through the seam without unrelated edits', () => {
    const { tools, host } = editor('line');
    tools.pointerDown({ x: 198, y: 120 }, 0);
    tools.pointerMove({ x: 201, y: 120 }, 1);
    expect(host.blocksArr.some(Boolean)).toBe(false);
    tools.pointerUp({ x: 201, y: 120 });
    expect([...host.blocksArr.entries()].filter(([, v]) => v).map(([i]) => i)).toEqual([2000, 2001, 2098, 2099]);
    const rectangle = editor('rect');
    rectangle.tools.pointerDown({ x: 198, y: 199 }, 0);
    rectangle.tools.pointerMove({ x: 201, y: 201 }, 1);
    expect(rectangle.host.overlay.ghost?.rows).toEqual([
      [7, 7, 7, 7],
      [7, 7, 7, 7],
      [7, 7, 7, 7],
    ]);
    expect(rectangle.host.blocksArr.some(Boolean)).toBe(false);
    rectangle.tools.pointerUp({ x: 201, y: 201 });
    expect(rectangle.host.blocksArr.filter(Boolean)).toHaveLength(12);
    for (const y of [99, 0, 1]) for (const x of [98, 99, 0, 1]) expect(rectangle.host.blocksArr[y * 100 + x]).toBe(7);
    expect(rectangle.host.remember).toHaveBeenCalledOnce();
  });
  it('follows a fast drag longer than half a map rather than choosing the nearest copy', () => {
    const { tools, host } = editor('line');
    tools.pointerDown({ x: 105, y: 120 }, 0);
    tools.pointerMove({ x: 165, y: 120 }, 1);
    tools.pointerUp({ x: 165, y: 120 });
    expect([...host.blocksArr.slice(2000, 2100)]).toEqual(Array.from({ length: 100 }, (_, x) => (x >= 5 && x <= 65 ? 7 : 0)));
    expect(host.blocksArr.filter(Boolean)).toHaveLength(61);
  });
  it('captures a seam selection in visual order and fills its native footprint', () => {
    const { tools, host } = editor('select');
    host.blocksArr.set(Uint8Array.from({ length: 10000 }, (_, i) => i % 251));
    tools.pointerDown({ x: 198, y: 199 }, 0);
    tools.pointerMove({ x: 201, y: 201 }, 1);
    tools.pointerUp({ x: 201, y: 201 });
    const area = tools.selection!;
    expect(area).toEqual({ x: 98, y: 99, w: 4, h: 3, wrap: true });
    expect(captureSelection(host.blocksArr, area).cells).toEqual([99, 0, 1].flatMap((y) => [98, 99, 0, 1].map((x) => (y * 100 + x) % 251)));
    const before = host.blocksArr.slice();
    tools.fillSelection();
    const changed = new Set([99, 0, 1].flatMap((y) => [98, 99, 0, 1].map((x) => y * 100 + x)));
    const expected = before.slice();
    for (const index of changed) expected[index] = 7;
    expect(host.blocksArr).toEqual(expected);
  });
});
