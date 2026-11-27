// A slow optional manifest must leave the already-loaded trinket on the shelf.
import { afterEach, expect, it, vi } from 'vitest';
import { trinketShelf } from './trinketShelf';
const { appendTile } = vi.hoisted(() => ({ appendTile: vi.fn<(tile: { title: string }) => void>() }));

vi.mock('../../editor/core/ui', () => ({
  h: vi.fn((_tag: string, attrs: Record<string, unknown>) => ({
    hidden: 'hidden' in attrs,
    title: attrs.title,
    append: attrs.class === 'fl-row' ? appendTile : vi.fn(),
  })),
}));
vi.mock('./trinketTurntable', () => ({ trinketTurntable: () => ({}) }));
vi.mock('./feelieThumbs', () => ({ thumbnail: () => Promise.resolve() }));
vi.mock('./paperFeelies', () => ({ paperFeelieTiles: () => [] }));

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows a trinket before a deferred laser manifest and adds the kit once it arrives', async () => {
  let release!: (res: Response) => void;
  const manifest = new Promise<Response>((resolve) => (release = resolve));
  vi.stubGlobal('fetch', (url: string) => {
    if (url.includes('/trinkets/')) return Response.json({ items: [{ id: 'token', title: 'Token' }] });
    if (url === './laser/sample/manifest.json') return manifest;
    return new Response(null, { status: 404 });
  });
  const shelf = trinketShelf('sample');
  const titles = () => appendTile.mock.calls.map(([tile]) => tile.title);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(shelf.hidden).toBe(false);
  expect(titles()).toEqual(['Token']);
  release(Response.json({ key: 'laser-nickel' }));
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(titles()).toEqual(['Token', 'Wooden nickel']);
});
