// Scene 0's DOS menu assets: SD-only card tags, stored pixels, pauses, patches and absent-slot fallbacks.
import { describe, expect, it } from 'vitest';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { newCards, packPocketGame } from './pocketPack';

const deflate = (b: Uint8Array) => new Uint8Array(deflateRawSync(b, { level: 9 }));
const palette = new Uint8Array(768).map((_, i) => i % 64);
const image = (pixel: number) => ({ width: 320, height: 200, palette, pixels: new Uint8Array(64000).fill(pixel) });
async function pack(card: boolean, slots = true, patch = false) {
  const game = newGame('Menu test');
  if (slots) {
    game.scenes[0].files[2] = 'MENU.LST';
    game.scenes[0].files[7] = 'CREDITS.LST';
    game.scenes[0].files[8] = 'SCORE.GIF';
  }
  const score = image(2);
  if (patch) {
    score.pixels.fill(1);
    score.pixels[1234] = 2;
  }
  const files = new GameFiles([
    ['test.gam', serializeGame(game)],
    ['menu.lst', new TextEncoder().encode('menu.gif\n')],
    ['menu.gif', encodeGif(image(1))],
    ['credits.lst', new TextEncoder().encode('credits.gif\ncredits.txt 7\n')],
    ['credits.gif', encodeGif(image(3))],
    ['credits.txt', new TextEncoder().encode('Game credits')],
    ['score.gif', encodeGif(score)],
  ]);
  const pak = newCards();
  const packed = await packPocketGame({ title: 'Menu test', files }, new Map(), pak, deflate, card);
  const bytes = Buffer.concat(pak.parts);
  const unpack = (ref: string) => {
    const [off, len] = ref.split('.').map(Number);
    expect(off + len).toBeLessThanOrEqual(bytes.length);
    const stored = bytes.subarray(off, off + len);
    const raw = new Uint8Array(inflateRawSync(stored.subarray(4)));
    expect(raw.length).toBe(stored.readUInt32LE());
    return raw;
  };
  return { ...packed, bytes, unpack };
}

describe('Pocket DOS menu cards', () => {
  it('packs slots 2/7/8 on SD with firmware references, pixels, text and DOS pauses', async () => {
    const p = await pack(true);
    expect(p.why).toEqual([]);
    const cards = p.lines.filter((l) => l.startsWith('card ')).map((l) => l.split(' '));
    expect(cards.map((w) => [w[1], w[2], w[4]])).toEqual([
      ['m', 'g', '0'],
      ['c', 'g', '65535'],
      ['c', 't', '7'],
      ['b', 'g', '0'],
    ]);
    for (const [i, pixel] of [
      [0, 1],
      [1, 3],
      [3, 2],
    ]) {
      const raw = p.unpack(cards[i][3]);
      expect(raw.subarray(0, 768)).toEqual(palette);
      expect(raw.subarray(768)).toEqual(image(pixel).pixels);
    }
    expect(new TextDecoder().decode(p.unpack(cards[2][3]))).toBe('Game credits');
    expect(p.menuBytes).toBe(p.bytes.length);
  });

  it('keeps LittleFS bytes and config identical whether the extra slots exist or not', async () => {
    const withSlots = await pack(false);
    const without = await pack(false, false);
    expect(withSlots.lines).toEqual(without.lines);
    expect(withSlots.bytes).toEqual(without.bytes);
    expect(withSlots.menuBytes).toBe(0);
  });

  it('leaves absent SD slots out for the firmware fallbacks', async () => {
    const p = await pack(true, false);
    expect(p.lines).toEqual(['title Menu test']);
    expect(p.menuBytes).toBe(0);
    expect(p.bytes.length).toBe(0);
  });

  it('uses a firmware picture patch when the score backdrop differs in a small rectangle', async () => {
    const p = await pack(true, true, true);
    const base = p.lines.find((l) => l.startsWith('card m '))!.split(' ');
    const score = p.lines.find((l) => l.startsWith('card b '))!.split(' ');
    expect(score[2]).toBe('p');
    expect(score.slice(5).join('.')).toBe(base[3]);
    const patch = p.unpack(score[3]);
    const view = new DataView(patch.buffer, patch.byteOffset);
    expect([0, 2, 4, 6].map((at) => view.getUint16(at, true))).toEqual([274, 3, 1, 1]);
    expect(patch[8]).toBe(2);
  });
});
