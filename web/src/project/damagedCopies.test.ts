// Healthy records, saved the ways the current code saves them, read back with no damage; a
// listing never makes a damaged copy; and the startup clean-up lets go only of copies that
// hold nothing their original lacks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from './files';
import { checkGame } from './health';
import { recoverRecord } from './recover';
import { emptyCompanion } from './companion';
import { makeCheckpoint } from './checkpoint';
import { holdsNothingExtra, redundantCopies } from './damagedCopies';
import { FakeDoc, type FakeEl } from '../../test/fakeDom';
import type { Project } from '../editor/core/project';

vi.mock('../editor/shell/workspace', () => ({
  Workspace: class {
    constructor(
      _host: HTMLElement,
      readonly project: Project,
    ) {}
  },
}));

type Row = Record<string, unknown> & { id: string };

// a stand-in for IndexedDB: one store, values cloned in and out, requests that answer on a later
// tick, and transactions on that store processed in creation order
function fakeIdb(rows: Map<string, Row>) {
  let queue = Promise.resolve();
  const tx = () => {
    const t: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; objectStore: () => unknown } = { objectStore: () => store };
    const requests: (() => void)[] = [];
    const req = <T>(run: () => T) => {
      const r: { result?: T; onsuccess?: () => void } = {};
      requests.push(() => {
        r.result = structuredClone(run());
        r.onsuccess?.();
      });
      return r;
    };
    const store = {
      get: (k: string) => req(() => rows.get(k)),
      getAll: () => req(() => [...rows.values()]),
      put: (v: Row) => req(() => (rows.set(v.id, structuredClone(v)), v.id)),
      add: (v: Row) =>
        req(() => {
          if (rows.has(v.id)) throw new Error('Duplicate project ID');
          rows.set(v.id, structuredClone(v));
          return v.id;
        }),
      delete: (k: string) => req(() => (rows.delete(k), undefined)),
    };
    queue = queue.then(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            for (const request of requests) request();
            t.oncomplete?.();
            resolve();
          }, 0);
        }),
    );
    return t;
  };
  const db = { transaction: tx, objectStoreNames: { contains: () => true } };
  return {
    open: () => {
      const r: { result: unknown; onsuccess?: () => void } = { result: db };
      setTimeout(() => r.onsuccess?.(), 0);
      return r;
    },
  };
}

/** A .gam whose title scene names a picture the game never had, as many imported DOS games do. */
function gamNamingAMissingFile(): Uint8Array {
  const g = newGame('Imported');
  g.scenes[0].files = g.scenes[0].files.map((f, i) => (i === 0 ? 'gone.gif' : f));
  return serializeGame(g);
}

let rows: Map<string, Row>;
let storage: typeof import('./storage');
const run = async <T>(p: Promise<T>): Promise<T> => (await vi.runAllTimersAsync(), p);

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules(); // a fresh connection and a fresh once-a-load clean-up for each test
  rows = new Map();
  vi.stubGlobal('indexedDB', fakeIdb(rows));
  storage = await import('./storage');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const files = (extra: Record<string, Uint8Array> = {}) => {
  const f = new GameFiles();
  f.set('game.gam', serializeGame(newGame('Mine')));
  f.set('x.gif', new Uint8Array([1, 2, 3]));
  for (const [n, b] of Object.entries(extra)) f.set(n, b);
  return f;
};

describe('healthy records read back with no damage', () => {
  it('a game saved, given a companion, checkpointed, put back from Recently deleted, imported or with odd files', async () => {
    await run(storage.saveProject('plain', 'Plain', 'game.gam', files()));
    await run(storage.saveProject('notes', 'Notes', 'game.gam', files(), { ...emptyCompanion(), releaseNotes: { '1.0': 'First' } }));
    await run(storage.saveProject('stamped', 'Stamped', 'game.gam', files()));
    await run(makeCheckpoint('stamped', 'one', files()));
    await run(makeCheckpoint('stamped', 'two', files({ 'y.gif': new Uint8Array([9]) })));
    await run(storage.saveProject('stamped', 'Stamped', 'game.gam', files())); // an autosave keeps the list
    rows.set('legacy', {
      ...structuredClone(rows.get('plain')!),
      id: 'legacy',
      checkpoint: { name: 'old', made: 1, files: { 'game.gam': new Uint8Array(4) } },
    });
    const back = structuredClone(rows.get('notes')!);
    await run(storage.putRecord({ ...(back as object), id: 'restored' } as never));
    const imported = new GameFiles();
    imported.set('quest.gam', gamNamingAMissingFile());
    await run(storage.saveProject('imported', 'Imported', 'quest.gam', imported));
    expect(checkGame(imported, 'quest.gam').some((i) => i.kind === 'missing')).toBe(true); // the health check still lists it
    await run(storage.saveProject('odd', 'Odd', 'game.gam', files({ 'empty.txt': new Uint8Array(0), 'old.gam': new Uint8Array([1, 2]) })));
    expect(rows.get('stamped')!.checkpoints).toHaveLength(2);
    for (const [id, raw] of rows) expect([id, recoverRecord(id, raw).damage]).toEqual([id, []]);
  });
  it('still names real damage: a cut-short main .gam and a wrong-type file', () => {
    const raw = { id: 'a', name: 'A', gam: 'game.gam', updated: 1, files: { 'game.gam': new Uint8Array(3), 'x.gif': 'text' } };
    expect(
      recoverRecord('a', raw)
        .damage.map((d) => d.file)
        .sort(),
    ).toEqual(['game.gam', 'x.gif']);
  });
});

describe('damaged copies are made only by opening the game', () => {
  const damaged = () => ({ id: 'a', name: 'A', gam: 'game.gam', updated: 5, files: { 'game.gam': serializeGame(newGame('A')), 'bad.gif': 'oops' } });
  it('a listing, a preview load or a check makes none', async () => {
    rows.set('a', damaged());
    expect((await run(storage.loadProject('a')))!.damage).toHaveLength(1);
    expect(rows.has('a~damaged')).toBe(false);
    await run(storage.loadProject('a', { keepCopy: true }));
    expect(rows.get('a~damaged')).toMatchObject({ name: 'A (damaged copy)', files: { 'bad.gif': 'oops' } });
  });
  it('listProjects leaves kept copies out; listDamagedCopies has them', async () => {
    rows.set('a', damaged());
    rows.set('a~damaged', { ...damaged(), id: 'a~damaged', name: 'A (damaged copy)' });
    expect((await run(storage.listProjects())).map((p) => p.id)).toEqual(['a']);
    expect((await run(storage.listDamagedCopies())).map((p) => p.id)).toEqual(['a~damaged']);
  });
});

function elements(root: FakeEl): FakeEl[] {
  return [root, ...root.children.flatMap(elements)];
}

describe('opening and restoring a damaged project', () => {
  it.each([
    ['cut-short game.gam', 1],
    ['malformed companion JSON', 1],
    ['malformed companion JSON', 2],
  ] as const)('%s with %i Keep activation(s)', async (scenario, clicks) => {
    const doc = new FakeDoc();
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', { setTimeout });
    const ui = await import('../editor/core/ui');
    vi.spyOn(ui, 'toast').mockImplementation(() => {});
    const { showDamagedCopies } = await import('../editor/shell/damagedCopiesDialog');

    const truncated = scenario === 'cut-short game.gam';
    const intact = files();
    const notes = { ...emptyCompanion(), releaseNotes: { '1.0': 'First' } };
    const storedFiles = Object.fromEntries(intact.entries());
    if (truncated) storedFiles['game.gam'] = storedFiles['game.gam'].slice(0, 10);
    const raw = {
      id: 'mine',
      name: 'Mine',
      gam: 'game.gam',
      updated: 5,
      files: storedFiles,
      companion: truncated ? notes : '{"format":',
    };
    rows.set(raw.id, structuredClone(raw));
    const { openStored } = await import('../modernUi');
    const workspace = (await run(openStored(raw.id, document.body)))!;
    const expectedFiles = Object.fromEntries(intact.entries());
    if (truncated) delete expectedFiles['game.gam'];
    for (const [name, bytes] of Object.entries(expectedFiles)) expect(workspace.project.files.get(name)).toEqual(bytes);
    expect(workspace.project.companion).toEqual(truncated ? notes : undefined);
    const message = truncated ? /game\.gam is cut short/i : /editor-only notes.*damaged/i;
    await vi.waitFor(() => expect(elements(doc.body).map((el) => el.textContent)).toContainEqual(expect.stringMatching(message)));

    const dialog = showDamagedCopies(() => {});
    await vi.runAllTimersAsync();
    const button = (label: string) => elements(doc.body).find((el) => el.tag === 'button' && el.attrs['aria-label'] === label)!;
    const keep = button('Keep as a game: Mine (damaged copy)');
    for (let i = 0; i < clicks; i++) keep.fire('click');
    await vi.runAllTimersAsync();
    button('Close').fire('click');
    await dialog;

    expect(await run(storage.listDamagedCopies())).toEqual([]);
    expect(await run(storage.loadRecord(raw.id))).toEqual(raw);
    const games = await run(storage.listProjects());
    const restored = games.find((game) => game.id !== raw.id)!;
    expect(games.map((game) => game.id).sort()).toEqual([raw.id, restored.id].sort());
    expect(await run(storage.loadRecord(restored.id))).toEqual({ ...raw, id: restored.id, name: 'Mine (damaged copy)' });
    const reopened = (await run(storage.loadProject(restored.id)))!;
    expect(Object.fromEntries(reopened.files.entries())).toEqual(expectedFiles);
    expect(reopened.damage).toEqual([expect.objectContaining({ message: expect.stringMatching(message) })]);
  });
});

describe('the startup clean-up', () => {
  const rec = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    name: id,
    gam: 'game.gam',
    updated: 1,
    files: { 'game.gam': serializeGame(newGame('G')), 'x.gif': new Uint8Array([1, 2, 3]) },
    ...extra,
  });
  const copy = (of: string, extra: Record<string, unknown> = {}) => ({ ...rec(of, extra), id: `${of}~damaged`, name: `${of} (damaged copy)`, updated: 0 });

  it('removes a copy whose original exists, reads clean and has the same bytes', async () => {
    rows.set('a', rec('a'));
    rows.set('a~damaged', copy('a'));
    expect(await run(storage.pruneDamagedCopies())).toBe(1);
    expect([...rows.keys()]).toEqual(['a']);
  });
  it('keeps a copy whose original is gone', () => {
    expect(redundantCopies([copy('a')])).toEqual([]);
  });
  it('keeps a copy whose original is really damaged', () => {
    const broken = rec('a', { files: { 'game.gam': new Uint8Array(3), 'x.gif': new Uint8Array([1, 2, 3]) } });
    expect(redundantCopies([broken, { ...broken, id: 'a~damaged' }])).toEqual([]);
  });
  it('keeps a copy whose files differ from the original, either way', () => {
    expect(holdsNothingExtra(copy('a', { files: { ...rec('a').files, 'x.gif': new Uint8Array([1, 2, 4]) } }), rec('a'), 'a')).toBe(false);
    expect(holdsNothingExtra(copy('a', { files: { ...rec('a').files, 'more.gif': new Uint8Array([7]) } }), rec('a'), 'a')).toBe(false);
    expect(holdsNothingExtra(copy('a'), rec('a', { files: { ...rec('a').files, 'new.gif': new Uint8Array([7]) } }), 'a')).toBe(false);
  });
  it('keeps a copy holding a wrong-type file, a companion or checkpoints the original lacks', () => {
    expect(holdsNothingExtra(copy('a', { files: { ...rec('a').files, 'bad.gif': 'oops' } }), rec('a'), 'a')).toBe(false);
    expect(holdsNothingExtra(copy('a', { companion: emptyCompanion() }), rec('a'), 'a')).toBe(false);
    const cps = [{ id: 'c', name: 'one', made: 1, delta: { 'x.gif': new Uint8Array([1]) } }];
    expect(holdsNothingExtra(copy('a', { checkpoints: cps }), rec('a'), 'a')).toBe(false);
    expect(holdsNothingExtra(copy('a', { checkpoints: cps }), rec('a', { checkpoints: structuredClone(cps) }), 'a')).toBe(true);
  });
  it('removes a copy when the original only gained a companion since', () => {
    expect(holdsNothingExtra(copy('a'), rec('a', { companion: emptyCompanion() }), 'a')).toBe(true);
  });
  it('never touches ordinary games or copies it cannot match', async () => {
    rows.set('b', rec('b'));
    rows.set('c~damaged', copy('c'));
    rows.set('d', rec('d'));
    rows.set('d~damaged', copy('d', { files: { 'game.gam': new Uint8Array([0]) } }));
    expect(await run(storage.pruneDamagedCopies())).toBe(0);
    expect([...rows.keys()].sort()).toEqual(['b', 'c~damaged', 'd', 'd~damaged']);
  });
});
