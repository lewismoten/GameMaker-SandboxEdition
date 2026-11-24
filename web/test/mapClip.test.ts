// Tests: Choosing the part of a map to save as a picture (editors/map/mapClip.ts).
import { describe, expect, it } from 'vitest';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { WHOLE_MAP, clampRect, contentBounds, dragRect, gameView } from '../src/editor/editors/map/mapClip';
import { editorBrowser } from './editorBrowser';

function mapWith(fill: number, cells: [number, number, number][]): Uint8Array {
  const b = new Uint8Array(MLEN * MWID).fill(fill);
  for (const [x, y, v] of cells) b[y * MLEN + x] = v;
  return b;
}

describe('map clipping', () => {
  it('finds the level inside the background fill, with a margin', () => {
    const b = mapWith(7, [
      [20, 30, 1],
      [40, 35, 2],
    ]);
    expect(contentBounds(b)).toEqual({ x: 19, y: 29, w: 23, h: 8 });
  });

  it('keeps pockets of fill inside the level and counts monsters', () => {
    const cells: [number, number, number][] = [];
    for (let x = 10; x <= 20; x++) cells.push([x, 10, 1], [x, 20, 1]);
    for (let y = 10; y <= 20; y++) cells.push([10, y, 1], [20, y, 1]);
    const b = mapWith(0, cells);
    expect(contentBounds(b, [{ x: 50, y: 60 }], 0)).toEqual({ x: 10, y: 10, w: 41, h: 51 });
  });

  it('is the whole map when nothing stands out', () => {
    expect(contentBounds(mapWith(3, []))).toEqual(WHOLE_MAP);
  });

  it('keeps screen-sized crops inside the stored grid near a start point', () => {
    expect(gameView({ x: 50, y: 50 })).toEqual({ x: 42, y: 45, w: 16, h: 10 });
    expect(gameView({ x: 1, y: 98 })).toEqual({ x: 0, y: 90, w: 16, h: 10 });
    expect(gameView({ x: 99, y: 0 }, { w: 3, h: 3 })).toEqual({ x: 52, y: 0, w: 48, h: 30 });
    expect(gameView({ x: MLEN - 1, y: 0 })).toEqual({ x: MLEN - 16, y: 0, w: 16, h: 10 });
  });

  it('names the dialog crop option in the Download picture tooltip', async () => {
    const fixture = await editorBrowser();
    try {
      const { page } = fixture;
      await page.evaluate(`(async () => {
        const { Project } = await import('/src/editor/core/project.ts');
        const { GameFiles } = await import('/src/project/files.ts');
        const { newGame, serializeGame } = await import('/packages/engine/src/formats/game.ts');
        const { newMap, serializeMap } = await import('/packages/engine/src/formats/map.ts');
        const { loadEditor } = await import('/src/editor/editors/registry.ts');
        const files = new GameFiles();
        files.set('a.gam', serializeGame(newGame('Map clipping')));
        files.set('a.map', serializeMap(newMap()));
        const project = new Project('map-clip', 'Map clipping', 'a.gam', files);
        (await loadEditor('map'))(document.querySelector('#host'), project, 'a.map');
      })()`);
      const download = page.getByRole('button', { name: /Download picture/ });
      const title = await download.getAttribute('title');
      await download.click();
      const crop = page.getByRole('dialog').locator('[role="radio"][data-mode="screen"]');
      await crop.waitFor({ state: 'visible' });
      const label = (await crop.innerText()).trim();
      expect(label).not.toBe('');
      expect(title?.toLowerCase()).toContain(label.toLowerCase());
    } finally {
      await fixture.close();
    }
  }, 30_000);

  it('drags and resizes a frame without leaving the map', () => {
    const r = { x: 10, y: 10, w: 20, h: 10 };
    expect(dragRect(r, 'move', 100, -3)).toEqual({ x: 80, y: 7, w: 20, h: 10 });
    expect(dragRect(r, 'se', 5, 5)).toEqual({ x: 10, y: 10, w: 25, h: 15 });
    expect(dragRect(r, 'nw', -20, 50)).toEqual({ x: 0, y: 19, w: 30, h: 1 });
    expect(dragRect(r, 'e', 3, 0, true)).toEqual({ x: 13, y: 10, w: 20, h: 10 });
    expect(clampRect({ x: -5, y: 95, w: 200, h: 10 })).toEqual({ x: 0, y: 90, w: 100, h: 10 });
  });
});
