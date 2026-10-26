// The pieces the Library lists once: the claim that they use nothing of the game they are packed
// with (read from the code that draws them, as the suite has no page to draw on), and the merge.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GM_OWNER, SHARED_OWNER, type ShelfItem } from './shelf';
import { mergeShared, SAME_IN_EVERY_BOX } from './shared';

const src = (f: string) => readFileSync(new URL(`../manual/printables/${f}`, import.meta.url), 'utf8');

/** A function's body in gen.ts, from its signature to the next top-level function. */
function body(name: string): { params: string; text: string } {
  const gen = src('gen.ts');
  const m = new RegExp(`export async function ${name}\\(([^)]*)\\)`).exec(gen);
  if (!m) throw new Error(`no ${name} in gen.ts`);
  const rest = gen.slice(m.index + m[0].length);
  const end = rest.search(/\n(export )?(async )?function /);
  return { params: m[1], text: end < 0 ? rest : rest.slice(0, end) };
}

describe('pieces the same in every box', () => {
  it('lists just the BBS ad and the catalog', () => {
    expect([...SAME_IN_EVERY_BOX].sort()).toEqual(['bbs', 'catalog']);
  });

  it('the BBS ad takes no game', () => {
    expect(body('bbsAd').params.trim()).toBe('');
    expect(src('items.ts')).toMatch(/id: 'bbs'[^\n]*render: \(\) => bbsAd\(\)/);
    expect(src('gmItems.ts')).toMatch(/id: 'bbs'[^\n]*render: \(\) => bbsAd\(\)/);
  });

  it('the catalog uses its own game only to mark that game’s entry', () => {
    const uses = body('catalog').text.match(/ctx\.(entry|printables|manual)[^\n]*/g) ?? [];
    // the family, falling back to the game itself (never in a box: the family is the catalog), and the mark
    expect(uses).toHaveLength(2);
    expect(uses[0]).toMatch(/^ctx\.entry\]/);
    expect(uses[1]).toMatch(/^ctx\.entry\.id \? 'this' : ''/);
  });

  it('every other piece a box gets is drawn from its game', () => {
    for (const name of ['postcard', 'keycard', 'warranty', 'newsletter', 'hintOffer']) expect(body(name).text, name).toMatch(/ctx\.(entry|printables|manual)/);
  });
});

const piece = (owner: string, id: string, via: 'box' | 'gm' = 'box'): ShelfItem => ({
  key: `${owner}:${id}`,
  title: id,
  icon: '📄',
  type: 'catalog',
  owner,
  ownerTitle: owner,
  open: via === 'box' ? { via, game: owner, start: id } : { via, start: id },
});

describe('listing them once', () => {
  it('keeps the first, opened where it is, counting its boxes; leaves the rest alone', () => {
    const items = [piece('a', 'catalog'), piece('a', 'keycard'), piece('b', 'catalog'), piece('b', 'bbs'), piece(GM_OWNER, 'catalog', 'gm')];
    const out = mergeShared(items);
    expect(out.map((i) => [i.key, i.owner, i.boxes])).toEqual([
      ['a:catalog', SHARED_OWNER, 3],
      ['a:keycard', 'a', undefined],
      ['b:bbs', 'b', undefined], // in one box only: stays with it
    ]);
    expect(out[0].open).toEqual({ via: 'box', game: 'a', start: 'catalog' });
  });
});
