// The game boxes under the black light: their bright lettering and stickers glow, the rest of
// the box sinks to a dim violet. The first time the tube comes on, each box's side is read
// back, every pixel goes through the posters' black-light colors (room/posterUv.ts), and only
// where the box is lettered (drawBoxLetters: titles, taglines, the price sticker, the starburst,
// the award, the badges and seals) does it keep its glow. Made one side at a time in idle
// moments, so the tube's flicker never waits on it, and kept for the visit. The shelf lays
// them over its boxes (shelf.css: half seen by day, fully at night) and the box viewer over
// the box in hand.
import type { CatalogEntry } from '../../project/files';
import { uvColor } from '../room/posterUv';
import { drawBoxLetters, type BoxFaces } from './gameBox';

type Side = keyof BoxFaces;

/** How bright a box's unlettered art stays under the tube, against its glowing lettering. */
const ART = 0.3;

/**
 * A box side's pixels (RGBA) as they look under black light, in place: in black-light colors,
 * at full glow where `letters` (the same size) is printed, by its alpha, and dimmed to `art`
 * elsewhere.
 */
export function uvLettering(px: Uint8ClampedArray, letters: Uint8ClampedArray, art = ART): void {
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = uvColor(px[i], px[i + 1], px[i + 2]);
    const k = art + (1 - art) * (letters[i + 3] / 255);
    px[i] = r * k;
    px[i + 1] = g * k;
    px[i + 2] = b * k;
  }
}

/** Which game a set of faces shows (shelf.ts tells), so its lettering can be drawn again. */
const games = new WeakMap<BoxFaces, CatalogEntry>();
/** The glowing sides made so far, as object URLs. */
const made = new WeakMap<BoxFaces, Map<Side, Promise<string | undefined>>>();

export function uvGame(faces: BoxFaces, entry: CatalogEntry): void {
  games.set(faces, entry);
}

/** Waits for a quiet moment. */
const idle = () => new Promise<void>((done) => ('requestIdleCallback' in window ? requestIdleCallback(() => done(), { timeout: 1500 }) : setTimeout(done, 50)));

/** One job at a time, so a shelf of boxes is spread over many idle moments. */
let queue: Promise<unknown> = Promise.resolve();
const later = <T>(job: () => Promise<T>): Promise<T> => {
  const run = queue.then(idle).then(job);
  queue = run.catch(() => undefined);
  return run;
};

/** The last game's lettering, kept while its other sides are made (the sides are big). */
let lettered: { entry: CatalogEntry; sides: Promise<Record<Side, HTMLCanvasElement> | undefined> } | undefined;
const lettersOf = (entry: CatalogEntry) => {
  if (lettered?.entry !== entry) lettered = { entry, sides: drawBoxLetters(entry).catch(() => undefined) };
  return lettered.sides;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

/** One side of the box under black light, as an object URL. */
async function makeSide(entry: CatalogEntry, faces: BoxFaces, side: Side): Promise<string | undefined> {
  const [letters, img] = await Promise.all([lettersOf(entry), loadImage(faces[side])]);
  const mask = letters?.[side];
  if (!mask) return undefined;
  const c = document.createElement('canvas');
  c.width = mask.width;
  c.height = mask.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const lctx = mask.getContext('2d');
  if (!ctx || !lctx) return undefined;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const pic = ctx.getImageData(0, 0, c.width, c.height);
  uvLettering(pic.data, lctx.getImageData(0, 0, c.width, c.height).data);
  ctx.putImageData(pic, 0, 0);
  const blob = await new Promise<Blob | null>((done) => c.toBlob(done, 'image/webp', 0.9));
  return blob ? URL.createObjectURL(blob) : undefined;
}

function uvSide(faces: BoxFaces, side: Side): Promise<string | undefined> | undefined {
  const entry = games.get(faces);
  if (!entry) return undefined;
  let sides = made.get(faces);
  if (!sides) made.set(faces, (sides = new Map()));
  let url = sides.get(side);
  if (!url) {
    url = later(() => makeSide(entry, faces, side)).catch(() => undefined);
    sides.set(side, url);
  }
  return url;
}

/**
 * Lays the glowing print over these `sides` of a box model (boxViewer.ts boxModel), as each is
 * made; `faces` are the pictures it was built from.
 */
export function dressUv(model: HTMLElement, faces: BoxFaces, sides: readonly Side[]): void {
  for (const side of sides) {
    void uvSide(faces, side)?.then((src) => {
      const face = model.querySelector(`.bface.${side}`);
      if (!src || !face || face.querySelector('.buv')) return;
      face.append(Object.assign(document.createElement('img'), { className: 'buv', src, alt: '', draggable: false }));
    });
  }
}
