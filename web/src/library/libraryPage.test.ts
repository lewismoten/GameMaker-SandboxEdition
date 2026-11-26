// Keep the TV open while the Library's first shelf request settles.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl, FakeWin } from '../../test/fakeDom';
import { readdirSync } from 'node:fs';
import { isOldSecret, secretVisible } from '../project/secretGames';
import { onCatalogChanged } from '../project/catalogWatch';
import { walkShelf } from './walkShelf';
import { renderLibrary } from './libraryPage';
import { loadShelf, type Shelf } from './listing';
import { makeRoom } from './libraryRoom';

vi.mock('./listing', () => ({ loadShelf: vi.fn() }));
vi.mock('./libraryRoom', () => ({ makeRoom: vi.fn(() => ({ el: document.createElement('div'), setShelf: vi.fn() })) }));
vi.mock('../project/catalogWatch', () => ({ onCatalogChanged: vi.fn(() => () => undefined) }));
vi.mock('../achievements', () => ({ unlockAchievement: vi.fn() }));
vi.mock('./copier', () => ({ makeCopier: () => ({ el: document.createElement('div'), update: vi.fn() }) }));
vi.mock('./ambience', () => ({ startAmbience: vi.fn() }));
vi.mock('./libraryMusic', () => ({ startLibraryMusic: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());

function words(el: FakeEl): string {
  return el.textContent + el.children.map(words).join(' ');
}

function libraryDocument() {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', new FakeWin());
  vi.stubGlobal('location', { hash: '#/library' });
  vi.stubGlobal('history', { replaceState: vi.fn() });
  // clear() attaches the Library root with appendChild.
  doc.body.appendChild = (child) => (doc.body.append(child), child);
  return doc;
}

it.each(['video', 'empty', 'error'])('updates the open TV when loading ends with %s', async (result) => {
  const doc = libraryDocument();
  let resolve!: (s: Shelf) => void;
  let reject!: () => void;
  vi.mocked(loadShelf).mockReturnValueOnce(
    new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    }),
  );
  renderLibrary(document.body);
  const tvButton = doc.createElement('button');
  doc.body.children[0].querySelector = () => tvButton;
  vi.mocked(makeRoom).mock.lastCall![0].go('tv');
  const dialog = doc.body.children[1];
  const initial = words(dialog);
  if (result === 'error') reject();
  else
    resolve({
      games: new Map(),
      thumbs: new Map(),
      items:
        result === 'empty'
          ? []
          : [{ key: 'film', type: 'video', title: 'Film', owner: 'site', ownerTitle: 'Library', icon: '', open: { via: 'video', id: 'film' } }],
    });
  await Promise.resolve();
  await Promise.resolve();
  expect(words(dialog)).toContain(result === 'video' ? 'Film' : result === 'empty' ? 'Nothing is on the TV yet.' : 'could not be loaded');
  expect(initial).toContain('Loading');
  expect(dialog.open).toBe(true);
  dialog.fire('cancel');
  await Promise.resolve();
  expect(doc.activeElement).toBe(tvButton);
});

it('removes a walkthrough button from the open TV when its game is hidden', async () => {
  const doc = libraryDocument();
  const id = readdirSync(new URL('../../../games/', import.meta.url)).find(isOldSecret)!;
  const entry = { id, title: 'Fixture game', kind: 'gameware' as const, gam: 'GAME.GAM', walkthrough: './walkthrough.json', path: './' };
  let gates = 3;
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('{}')));
  vi.mocked(loadShelf).mockImplementation(async () => {
    const entries = secretVisible(id, gates) ? [entry] : [];
    const { items } = await walkShelf(entries);
    return { items, thumbs: new Map(), games: new Map(entries.map((g) => [g.id, g])) };
  });
  renderLibrary(document.body);
  vi.mocked(makeRoom).mock.lastCall![0].go('tv');
  const dialog = doc.body.children[1];
  await vi.waitFor(() => expect(words(dialog)).toContain(entry.title));
  gates = 0;
  vi.mocked(onCatalogChanged).mock.lastCall![0](gates);
  await vi.waitFor(() => expect(words(dialog)).toContain('Nothing is on the TV yet.'));
  expect(words(dialog)).not.toContain(entry.title);
  expect(dialog.open).toBe(true);
  dialog.fire('cancel');
});
