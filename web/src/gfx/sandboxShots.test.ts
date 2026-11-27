// The DOS manual can draw a built game picture using only the lean catalog and the PNG.
import { afterEach, expect, it, vi } from 'vitest';
import { sandboxShots } from './sandboxShots';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('draws the manual shot without downloading the catalog file lists', async () => {
  vi.stubEnv('DEV', false);
  const urls: string[] = [];
  vi.stubGlobal('fetch', (url: string) => {
    urls.push(url);
    return Promise.resolve(
      Response.json([{ id: 'maximus', title: 'Maximus', gam: 'MAX.GAM', shots: true, original: { box: { shots: [['w12.map', 36, 40]] } } }]),
    );
  });
  class ShotImage {
    naturalWidth = 320;
    naturalHeight = 200;
    set src(url: string) {
      urls.push(url);
    }
    decode() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('Image', ShotImage);
  const drawImage = vi.fn();
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }) };
  vi.stubGlobal('document', { createElement: () => canvas });

  const shots = await sandboxShots();
  expect(shots).toHaveLength(1);
  expect(shots[0].id).toBe('maximus');
  expect(shots[0].canvas).toBe(canvas);
  expect(drawImage).toHaveBeenCalledWith(expect.any(ShotImage), 0, 0);
  expect(urls).toEqual(['./games/catalog.json', './games/shots/maximus-w12.map-36-40-16x10.png']);
});
