import { describe, expect, it } from 'vitest';
import {
  decodeGame,
  encodeGame,
  fillPage,
  fromBase64,
  GAME_MARK,
  pack,
  scriptJson,
  TITLE_MARK,
  toBase64,
  unpack,
  type SinglePageGame,
} from '../src/export/singlePage';

const files: [string, Uint8Array][] = [
  ['game.gam', new Uint8Array([1, 2, 3])],
  ['empty.snd', new Uint8Array()],
  ['big.pal', Uint8Array.from({ length: 100_000 }, (_, i) => (i * 7) & 255)],
];

describe('one-page export', () => {
  it('packs and unpacks files end to end', () => {
    const { files: index, blob } = pack(files);
    expect(index).toEqual([
      ['game.gam', 3],
      ['empty.snd', 0],
      ['big.pal', 100_000],
    ]);
    expect(unpack(index, blob)).toEqual(files);
    expect(() => unpack(index, blob.slice(0, 50))).toThrow(/cut short/);
  });

  it('round-trips base64, including large inputs', () => {
    const bytes = files[2][1];
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(toBase64(new Uint8Array([255, 0, 128]))).toBe('/wCA');
  });

  it('encodes and decodes a game (gzip when available)', async () => {
    const game = await encodeGame({ id: 'test', title: 'Test', gam: 'game.gam' }, files);
    expect(game.enc).toBe(typeof CompressionStream === 'undefined' ? 'raw' : 'gzip');
    expect(await decodeGame(game)).toEqual(files);
  });

  it('keeps script-breaking text out of the page', () => {
    expect(scriptJson({ a: '</script><!--' })).not.toMatch(/</);
    const game: SinglePageGame = { v: 1, id: 'x', title: 'A & B <$&>', gam: 'g.gam', enc: 'raw', files: [], data: '' };
    const page = fillPage(`<title>${TITLE_MARK}</title><body>${GAME_MARK}<script>run()</script>`, game);
    expect(page).toContain('<title>A &#38; B &#60;$&#38;&#62;</title>');
    expect(page.match(/<\/script>/g)).toHaveLength(2);
    const json = page.match(/id="gm-game">(.*?)<\/script>/)![1];
    expect(JSON.parse(json).title).toBe('A & B <$&>');
    expect(() => fillPage('<html></html>', game)).toThrow(/game slot/);
  });
});
