// Reinserting a disk retries a failed poster read and reuses the first successful drawing.
import { afterEach, expect, it, vi } from 'vitest';
import { peekGameFile } from '../../project/files';
import { endDesk } from '../lifetime';
import { hideWallPoster, setPosterWall, showWallPoster } from './wallPoster';

vi.mock('../../project/files', () => ({ peekGameFile: vi.fn() }));
vi.mock('../../gfx/gameShots', () => ({ mapShot: vi.fn() }));
vi.mock('../../editor/core/ui', () => ({ h: (tag: string, attrs: object) => ({ tag, ...attrs, style: {} }) }));
vi.mock('./posterUv', () => ({ uvPoster: (canvas: HTMLCanvasElement) => canvas }));

afterEach(() => {
  vi.clearAllMocks();
  endDesk();
  vi.unstubAllGlobals();
});

function setupWall(id: string) {
  const append = vi.fn();
  const wall = { append, querySelector: () => null } as unknown as HTMLElement;
  const game = { id, title: 'Sample', kind: 'gameware' as const, path: 'sample/', gam: 'sample.gam', files: ['title.gif'] };
  setPosterWall(wall, [game]);
  const ctx = {
    measureText: () => ({ width: 1 }),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ctx, toDataURL: () => 'data:image/png,' }) });
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 1;
      naturalHeight = 1;
      onload?: () => void;
      set src(_url: string) {
        this.onload?.();
      }
    },
  );

  return { append, game };
}

it('pins the poster after the archive becomes readable on reinsertion', async () => {
  const { append, game } = setupWall('retry');
  vi.mocked(peekGameFile)
    .mockRejectedValueOnce(new Error('Archive unavailable'))
    .mockResolvedValue(new Uint8Array([1]));
  await Promise.all([showWallPoster(game.id), showWallPoster(game.id)]);
  expect(peekGameFile).toHaveBeenCalledTimes(1);
  expect(append).not.toHaveBeenCalled();
  hideWallPoster();
  await showWallPoster(game.id);
  expect(peekGameFile).toHaveBeenCalledTimes(2);
  expect(append).toHaveBeenCalledWith(expect.objectContaining({ tag: 'figure', 'aria-label': 'Sample poster' }));
  hideWallPoster();
  await showWallPoster(game.id);
  expect(peekGameFile).toHaveBeenCalledTimes(2);
  expect(append).toHaveBeenCalledTimes(2);
});

it('pins a shared drawing only once when the same disk is reinserted before it finishes', async () => {
  const { append, game } = setupWall('reinsert');
  let finishRead!: (gif: Uint8Array) => void;
  vi.mocked(peekGameFile).mockReturnValueOnce(
    new Promise((resolve) => {
      finishRead = resolve;
    }),
  );
  const first = showWallPoster(game.id);
  hideWallPoster();
  const second = showWallPoster(game.id);
  finishRead(new Uint8Array([1]));
  await Promise.all([first, second]);
  expect(peekGameFile).toHaveBeenCalledTimes(1);
  expect(append).toHaveBeenCalledTimes(1);
});
