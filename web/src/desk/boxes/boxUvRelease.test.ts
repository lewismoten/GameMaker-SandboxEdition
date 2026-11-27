// A shelf box replaced while its black-light side waits in the queue: its picture's object URL is
// revoked (releaseUv, releaseFaces), so the queued job must not ask for it (a failed blob: request).
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../../project/files';
import type { BoxFaces } from './gameBox';

vi.mock('./gameBox', () => ({ drawBoxLetters: vi.fn(() => Promise.resolve(undefined)) }));

const requested: string[] = [];
class FakeImage {
  naturalWidth = 1;
  naturalHeight = 1;
  set src(v: string) {
    requested.push(v);
  }
  decode() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  requested.length = 0;
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('window', {}); // no requestIdleCallback: the queue waits 50 ms
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const model = { querySelector: () => null } as unknown as HTMLElement;
const faces = (): BoxFaces => ({ front: 'blob:test/front', back: 'x', left: 'x', right: 'x', top: 'x', bottom: 'x' });

it('asks for a face picture while the box is on the shelf', async () => {
  const { uvGame, dressUv } = await import('./boxUv');
  const f = faces();
  uvGame(f, {} as CatalogEntry);
  dressUv(model, f, ['front']);
  await vi.advanceTimersByTimeAsync(200);
  expect(requested).toContain('blob:test/front');
});

it('does not ask for a picture whose box was released before the queued job ran', async () => {
  const { uvGame, dressUv, releaseUv } = await import('./boxUv');
  const f = faces();
  uvGame(f, {} as CatalogEntry);
  dressUv(model, f, ['front']);
  releaseUv(f); // the shelf swaps in the whole box and lets go of this one
  await vi.advanceTimersByTimeAsync(200);
  expect(requested).not.toContain('blob:test/front');
});

it('revokes the encoded side without attaching it when release happens during encoding', async () => {
  const { uvGame, dressUv, releaseUv } = await import('./boxUv');
  const toBlob = vi.fn<(done: BlobCallback) => void>();
  class Canvas {
    width = 1;
    height = 1;
    toBlob = toBlob;
    getContext() {
      return {
        drawImage: vi.fn(),
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: vi.fn(),
      };
    }
  }
  vi.stubGlobal('HTMLCanvasElement', Canvas);
  vi.stubGlobal('document', { createElement: (tag: string) => (tag === 'canvas' ? new Canvas() : {}) });
  const mask = new Canvas() as unknown as HTMLCanvasElement;
  vi.mocked((await import('./gameBox')).drawBoxLetters).mockResolvedValueOnce({ front: mask, back: mask, left: mask, right: mask, top: mask, bottom: mask });
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:test/glow', revokeObjectURL });
  const face = { append: vi.fn(), querySelector: () => null };
  const box = { querySelector: () => face } as unknown as HTMLElement;
  const f = faces();
  uvGame(f, {} as CatalogEntry);
  dressUv(box, f, ['front']);
  await vi.advanceTimersByTimeAsync(50);
  expect(toBlob).toHaveBeenCalledOnce();
  releaseUv(f);
  toBlob.mock.calls[0][0](new Blob());
  await vi.advanceTimersByTimeAsync(0);
  expect(revokeObjectURL.mock.calls).toEqual([['blob:test/glow']]);
  expect(face.append).not.toHaveBeenCalled();
});
