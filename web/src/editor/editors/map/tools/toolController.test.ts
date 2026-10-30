// Rectangle gestures preview real blocks without touching the map or undo history until release.
import { describe, expect, it, vi } from 'vitest';
import { MapTools } from './toolController';
import type { Project } from '../../../core/project';
import type { OverlayState } from './overlay';

function editor() {
  const overlay: OverlayState = { grid: false, found: [] };
  const host = {
    project: {} as Project,
    blocksArr: new Uint8Array(10000),
    bbl: () => '',
    blocks: () => [],
    palette: () => new Uint8Array(768),
    imgs: () => [],
    brush: () => 7,
    remember: vi.fn(),
    changed: vi.fn(),
    overlay,
    drawOverlay: vi.fn(),
    setMode: vi.fn(),
  };
  const tools = new MapTools(host, {} as HTMLElement);
  tools.mode = 'rect';
  return { tools, host };
}

describe('rectangle previews', () => {
  it('resizes the proposed blocks and commits just the released rectangle', () => {
    const { tools, host } = editor();
    tools.pointerDown({ x: 2, y: 3 }, 0);
    tools.pointerMove({ x: 3, y: 4 }, 1);
    expect(host.overlay.ghost).toMatchObject({
      x: 2,
      y: 3,
      rows: [
        [7, 7],
        [7, 7],
      ],
    });
    expect(host.blocksArr.some(Boolean)).toBe(false);
    expect(host.remember).not.toHaveBeenCalled();
    tools.pointerMove({ x: 4, y: 3 }, 1);
    expect(host.overlay.ghost?.rows).toEqual([[7, 7, 7]]);
    tools.pointerUp({ x: 4, y: 3 });
    expect([host.blocksArr[302], host.blocksArr[303], host.blocksArr[304]]).toEqual([7, 7, 7]);
    expect(host.blocksArr[402]).toBe(0);
    expect(host.remember).toHaveBeenCalledOnce();
    expect(host.overlay.ghost).toBeUndefined();
  });
  it('discards a pending rectangle on Escape, including a later pointer release', () => {
    const { tools, host } = editor();
    tools.pointerDown({ x: 2, y: 3 }, 0);
    tools.pointerMove({ x: 4, y: 5 }, 1);
    expect(tools.cancel()).toBe(true);
    tools.pointerUp({ x: 4, y: 5 });
    expect(host.blocksArr.some(Boolean)).toBe(false);
    expect(host.remember).not.toHaveBeenCalled();
    expect(host.overlay.ghost).toBeUndefined();
    expect(host.overlay.outline).toBeUndefined();
  });
});
