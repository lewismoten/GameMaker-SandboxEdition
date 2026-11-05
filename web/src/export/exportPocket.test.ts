// The Pocket Player download: the same bytes every time, a bundle the firmware's reader accepts (sorted names,
// entries in bounds, game.txt and the .cfg it names), every packed file and card inflating to its stored length.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { exportPocket } from './exportPocket';
import { gmpName, pocketId, readBundle, writeBundle, writeGmp } from './pocketFile';

const folder = (url: URL) => new GameFiles(readdirSync(url).map((n) => [n, new Uint8Array(readFileSync(new URL(n, url)))]));
const peach = () => folder(new URL('../../../cd/gameware/peach/', import.meta.url));
const text = (b: Uint8Array) => String.fromCharCode(...b);
/** A stored file: its length (4 bytes, little endian) then the raw deflate. */
const unpack = (b: Uint8Array) => {
  const out = new Uint8Array(inflateRawSync(b.subarray(4)));
  expect(out.length).toBe(new DataView(b.buffer, b.byteOffset).getUint32(0, true));
  return out;
};

describe('exportPocket', () => {
  it('writes the same bytes twice', async () => {
    const a = await exportPocket(peach(), { title: 'Peach', gam: 'PEACH.GAM' });
    const b = await exportPocket(peach(), { title: 'Peach', gam: 'PEACH.GAM' });
    expect(a.name).toBe('PEACH.GMP');
    expect(b.bytes).toEqual(a.bytes);
  });

  it('is a bundle the firmware reads: game.txt, the .cfg and every file it names', async () => {
    const { bytes } = await exportPocket(peach(), { title: 'Peach', gam: 'PEACH.GAM' });
    const entries = readBundle(bytes);
    const [head, line] = text(entries.get('game.txt')!.bytes).split('\n');
    expect(head).toBe('GMP 1');
    const [id, title, levels] = line.split('|');
    expect([id, title]).toEqual(['peach', 'Peach']);
    const cfg = text(entries.get(`${id}.cfg`)!.bytes)
      .trim()
      .split('\n');
    expect(cfg.filter((l) => l.startsWith('level ')).length).toBe(Number(levels));
    const pak = entries.get('cards.pak')!.bytes;
    for (const l of cfg) {
      const w = l.split(' ');
      if (w[0] === 'level') for (const name of w.slice(1, 6).filter((n) => n !== '-')) unpack(entries.get(name)!.bytes);
      if (w[0] === 'snd') unpack(entries.get(w[2])!.bytes);
      if (w[0] === 'card') {
        const [off, len] = w[3].split('.').map(Number);
        expect(off + len).toBeLessThanOrEqual(pak.length);
        unpack(pak.subarray(off, off + len));
      }
    }
  });

  it('says plainly what the board leaves out', async () => {
    const { notes } = await exportPocket(peach(), { title: 'Peach', gam: 'PEACH.GAM' });
    for (const n of notes) expect(n).toMatch(/^[A-Z].*\.$/);
  });
});

describe('pocketFile', () => {
  it('sorts names as the firmware searches them and reads them back', () => {
    const b = writeBundle([
      ['b.txt', new Uint8Array([2])],
      ['A.txt', new Uint8Array([1, 1])],
      ['a.cfg', new Uint8Array()],
    ]);
    const back = readBundle(b);
    expect([...back.keys()]).toEqual(['A.txt', 'a.cfg', 'b.txt']);
    expect([...back.get('A.txt')!.bytes]).toEqual([1, 1]);
    expect(() => readBundle(new Uint8Array(8))).toThrow();
  });

  it('puts the format, the id line and the version in game.txt', () => {
    const b = readBundle(writeGmp({ id: 'x', title: 'A|B', version: '2.1', levels: 3, cfg: ['title A'], files: new Map(), cards: [] }));
    expect(text(b.get('game.txt')!.bytes)).toBe('GMP 1\nx|A B|3\nversion 2.1\n');
    expect([...b.keys()]).toEqual(['cards.pak', 'game.txt', 'x.cfg']);
  });

  it('names the file 8.3 and keeps ids short enough for the firmware', () => {
    expect(gmpName('sandcastle-knight')).toBe('SANDCAST.GMP');
    expect(gmpName('---')).toBe('GAME.GMP');
    expect(pocketId('My Game!')).toBe('my-game');
    expect(pocketId('x'.repeat(40)).length).toBe(27);
  });
});
