// The ePub packer (pack.ts) against the structure check (check.ts): a packed book passes, and
// the check catches what a validator would (a compressed mimetype, a missing file, a remote link,
// XML that isn't well-formed).
import { describe, expect, it } from 'vitest';
import { createZip, readZip } from '../../project/zip';
import type { EpubBook } from './book';
import { checkEpub } from './check';
import { packEpub } from './pack';
import { checkXml } from './xmlCheck';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const book = (): EpubBook => ({
  key: 'test/book',
  title: 'A Test & Its <Book>',
  creator: 'Sandbox Software',
  publisher: 'Sandbox Software',
  date: '1995',
  cover: { path: 'images/cover.jpg', type: 'image/jpeg', data: new Uint8Array(100), alt: 'The cover' },
  chapters: [
    {
      id: 'c1',
      title: 'One',
      body: '<h1>One</h1><h2 id="p1">Part</h2><p><img src="images/1.png" alt=""/><a href="c2.xhtml#x">on</a></p>',
      parts: [{ title: 'Part', id: 'p1' }],
    },
    { id: 'c2', title: 'Two', body: '<h1 id="x">Two</h1><p>Fish &amp; chips</p>' },
  ],
  files: [{ path: 'images/1.png', type: 'image/png', data: PNG }],
});

/** The book's files with one changed (or removed, with undefined), packed again in the same order. */
async function edited(bytes: Uint8Array, name: string, text: string | undefined): Promise<Uint8Array> {
  const entries = (await readZip(bytes)).flatMap((e) =>
    e.name !== name ? [{ ...e, store: e.name === 'mimetype' }] : text === undefined ? [] : [{ name, data: new TextEncoder().encode(text) }],
  );
  return createZip(entries);
}

describe('packEpub', () => {
  it('packs a book that passes the structure check', async () => {
    const bytes = await packEpub(book(), new Date('2026-10-27T12:00:00Z'));
    const report = await checkEpub(bytes);
    expect(report.problems).toEqual([]);
    expect(report.files[0].name).toBe('mimetype');
    expect(report.spine).toEqual(['OEBPS/cover.xhtml', 'OEBPS/c1.xhtml', 'OEBPS/c2.xhtml']);
  });

  it('keeps the identifier for the same book', async () => {
    const id = async () => /urn:uuid:[\da-f-]{36}/.exec(new TextDecoder().decode((await readZip(await packEpub(book())))[2].data))?.[0];
    expect(await id()).toBe(await id());
  });

  it('finds what a validator would', async () => {
    const good = await packEpub(book());
    const squashed = await createZip((await readZip(good)).map((e) => (e.name === 'mimetype' ? { ...e, data: new Uint8Array(200).fill(97) } : e)));
    expect((await checkEpub(squashed)).problems.join()).toMatch(/mimetype is compressed/);
    expect((await checkEpub(await edited(good, 'OEBPS/images/1.png', undefined))).problems.join()).toMatch(/images\/1\.png, which is missing/);
    const c2 = new TextDecoder().decode((await readZip(good)).find((e) => e.name === 'OEBPS/c2.xhtml')!.data);
    const remote = c2.replace('<p>Fish', '<p><img src="https://example.com/x.png" alt=""/>Fish');
    expect((await checkEpub(await edited(good, 'OEBPS/c2.xhtml', remote))).problems.join()).toMatch(/refers outside the book/);
    expect((await checkEpub(await edited(good, 'OEBPS/c2.xhtml', c2.replace('&amp;', '&nbsp;')))).problems.join()).toMatch(/entity/);
  });
});

describe('checkXml', () => {
  it('reads well-formed XML and its attributes', () => {
    const r = checkXml('<?xml version="1.0"?><!DOCTYPE html><a x="1 &amp; 2"><b/><!-- c --><c>t</c></a>');
    expect(r.errors).toEqual([]);
    expect(r.elements.map((e) => e.name)).toEqual(['a', 'b', 'c']);
    expect(r.elements[0].attrs.x).toBe('1 & 2');
  });

  it('finds tags out of order, bare ampersands and a second root', () => {
    expect(checkXml('<a><b></a></b>').errors.length).toBeGreaterThan(0);
    expect(checkXml('<a>fish & chips</a>').errors.join()).toMatch(/entity/);
    expect(checkXml('<a/><b/>').errors.join()).toMatch(/second root/);
    expect(checkXml('<a x="1" x="2"/>').errors.join()).toMatch(/repeats/);
  });
});
