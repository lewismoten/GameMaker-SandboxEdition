import { afterEach, describe, expect, it, vi } from 'vitest';
import { kitOf, loadLaserKits } from './laserKits';

const nickel = { key: 'laser-nickel', game: 'realm', mm: { coin: 38.1 } };
const reply = (body: unknown, type = 'application/json') =>
  Promise.resolve({ ok: true, headers: { get: () => type }, json: () => Promise.resolve(body) } as unknown as Response);

afterEach(() => vi.unstubAllGlobals());

describe('kitOf', () => {
  it('words the wooden nickel from its manifest', () => {
    const kit = kitOf(nickel, './laser/realm/')!;
    expect(kit.summary).toContain('1.5 in');
    expect(kit.previews.map((p) => p.file)).toEqual(['front.png', 'back.png']);
    expect(kit.downloads.map((d) => d.file)).toEqual(['sheet.svg', 'sheet-back.svg', 'front.svg', 'back.svg', '../checklist.svg']);
  });

  it('takes any other kit from its own `kit` entry and drops unsafe file names', () => {
    const kit = kitOf(
      {
        key: 'puzzle-box',
        kit: {
          title: 'Puzzle box',
          summary: 'A laser-cut box.',
          previews: [{ file: 'box.png', alt: 'The box' }],
          downloads: [
            { file: 'panels.svg', label: 'Panels (SVG)' },
            { file: 'https://x.test/a.svg', label: 'elsewhere' },
            { file: '../../etc', label: 'up' },
          ],
        },
      },
      './laser/x/',
    )!;
    expect(kit.title).toBe('Puzzle box');
    expect(kit.downloads.map((d) => d.file)).toEqual(['panels.svg']);
  });

  it('ignores a manifest that is not a kit', () => {
    expect(kitOf({ key: 'other' }, './laser/x/')).toBeNull();
    expect(kitOf(null, './laser/x/')).toBeNull();
  });
});

describe('loadLaserKits', () => {
  it('has no kits when there is no manifest, or the dev server answers with the page', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve({ ok: false } as Response));
    expect(await loadLaserKits('secretgame')).toEqual([]);
    vi.stubGlobal('fetch', () => reply('<html>', 'text/html'));
    expect(await loadLaserKits('x')).toEqual([]);
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    expect(await loadLaserKits('x')).toEqual([]);
  });

  it('reads game `id`’s manifest', async () => {
    const asked: string[] = [];
    vi.stubGlobal('fetch', (u: string) => (asked.push(u), u.includes('stage-box') ? Promise.resolve({ ok: false } as Response) : reply(nickel)));
    const kits = await loadLaserKits('realm');
    expect(asked).toEqual(['./laser/realm/manifest.json', './laser/realm/stage-box/manifest.json']);
    expect(kits).toHaveLength(1);
  });

  it('lists the nickel and the stage box together, the box with its own folder as base', async () => {
    const box = { kit: { title: 'Stage Box', summary: 'A box.', previews: [{ file: 'a.png', alt: 'A' }], downloads: [{ file: 'a.svg', label: 'A' }] } };
    vi.stubGlobal('fetch', (u: string) => reply(u.includes('stage-box') ? box : nickel));
    const kits = await loadLaserKits('sleuth');
    expect(kits.map((k) => k.title)).toEqual(['Wooden nickel', 'Stage Box']);
    expect(kits[1]?.base).toBe('./laser/sleuth/stage-box/');
  });
});
