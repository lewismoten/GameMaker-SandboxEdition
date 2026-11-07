// Build a single indexed PTH1 preview; ESP32 never decodes source animations.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { titlePixels } from '../gfx/titlePicture';
import { firstLevels, levelPixels } from '../gfx/levelPicture';
import type { PocketSource } from './pocketPack';

export async function pocketThumbnail(
  files: PocketSource['files'],
  gam: string,
  deflate: (b: Uint8Array) => Uint8Array | Promise<Uint8Array>,
): Promise<Uint8Array | undefined> {
  try {
    const game = parseGame(files.get(gam)!);
    let pic = titlePixels(files, game);
    if (!pic) for (const [i, at] of firstLevels(game, 1)) pic = levelPixels(files, game.scenes[i], at, 16, 10);
    if (!pic) return;
    const raw = new Uint8Array(6284),
      view = new DataView(raw.buffer);
    raw.set([80, 84, 72, 49]);
    view.setUint16(4, 96, true);
    view.setUint16(6, 60, true);
    view.setUint16(8, 256, true);
    for (let i = 0; i < 256; i++) {
      const v8 = (c: number) => ((c & 63) << 2) | ((c & 63) >> 4);
      const r = v8(pic.palette[i * 3]),
        g = v8(pic.palette[i * 3 + 1]),
        b = v8(pic.palette[i * 3 + 2]);
      view.setUint16(12 + i * 2, ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3), true);
    }
    for (let y = 0; y < 60; y++)
      for (let x = 0; x < 96; x++) raw[524 + y * 96 + x] = pic.pixels[Math.floor((y * pic.height) / 60) * pic.width + Math.floor((x * pic.width) / 96)];
    const packed = await deflate(raw),
      out = new Uint8Array(4 + packed.length);
    new DataView(out.buffer).setUint32(0, raw.length, true);
    out.set(packed, 4);
    return out;
  } catch {
    return;
  }
}
