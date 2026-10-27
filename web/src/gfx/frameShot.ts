// Box shots and manual screenshots that are a moment of play (gfx/shotFrame.ts): the picture
// scripts/shotFrames.ts drew in public/frames/, or the shot's map view when there is none (a
// secret game, or a frame not drawn yet).
import type { CatalogEntry } from '../project/files';
import { mapShot } from './gameShots';
import { framePath, shotFrame, type WantedFrame } from './shotFrame';

/** The frame's picture on a canvas of its own (the 312 x 196 the game shows while playing), or undefined when the site has none. */
export async function frameShot(entry: CatalogEntry, frame: WantedFrame): Promise<HTMLCanvasElement | undefined> {
  const img = new Image();
  img.src = `./${framePath(entry.id, frame)}`;
  try {
    await img.decode();
  } catch {
    return undefined;
  }
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c;
}

/** A box shot ([map, x, y] or [map, x, y, frame]) as a VGA screen, 16 x 10 blocks. */
export async function boxShot(entry: CatalogEntry, shot: readonly [string, number, number, ...unknown[]]): Promise<HTMLCanvasElement | undefined> {
  const [map, x, y] = shot;
  const frame = shotFrame(shot);
  return (frame && (await frameShot(entry, { map, ...frame }))) || mapShot(entry, map, x, y, 16, 10);
}
