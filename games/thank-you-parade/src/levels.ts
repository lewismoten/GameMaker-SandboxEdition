// The six levels in order, each with its own palette (the same blocks at another time of the parade morning).
import { pennyPalette, swap } from './look';
import { type Level } from './lay';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { baseBook, type PBook } from './base';
import { addBandArch, addPark } from './park';
import { addCard, addFlags, addNeighbors, addStreet } from './town';

export type { Level } from './lay';

/** Palette looks: [sky ramp, grass ramp] per level. The first level keeps the plain morning colors. */
const LOOKS = [
  undefined,
  { sky: [6, [100, 120, 150], [214, 224, 236], [160, 180, 204]], grass: [6, [60, 92, 52], [160, 196, 96], [108, 150, 72]] }, // windy, overcast
  { sky: [6, [210, 168, 108], [255, 240, 204], [240, 206, 150]], grass: [6, [60, 92, 52], [160, 196, 96], [108, 150, 72]] }, // the hall's warm light
  { sky: [6, [214, 118, 56], [255, 232, 170], [250, 186, 110]], grass: [6, [86, 112, 30], [210, 224, 90], [150, 176, 52]] }, // golden afternoon
  { sky: [6, [40, 130, 244], [190, 236, 255], [110, 190, 252]], grass: [6, [24, 120, 56], [150, 244, 96], [64, 190, 70]] }, // a clear, bright noon
  { sky: [6, [96, 54, 150], [255, 206, 164], [236, 122, 126]], grass: [6, [40, 84, 64], [150, 190, 100], [84, 140, 84]] }, // sunset
] as const;

/** The base palette (Penny's colors) and the levels. */
export function buildLevels(): { pal: ReturnType<typeof pennyPalette>; levels: Level[] } {
  const pal = pennyPalette();
  const built = [level1(pal), level2(pal), level3(pal), level4(pal), level5(pal), level6(pal)];
  const levels = built.map((l, i) => {
    const look = LOOKS[i];
    return look ? { ...l, pal: swap(pal, { sky: [...look.sky] as never, grass: [...look.grass] as never }) } : l;
  });
  return { pal, levels };
}

/** One block set with every picture the title and the cartoons draw from (never on the disk). */
export function galleryBook(pal: ReturnType<typeof pennyPalette>): PBook {
  const book = baseBook(pal);
  addStreet(book, pal);
  addFlags(book, pal);
  addCard(book, pal);
  addNeighbors(book, pal);
  addPark(book, pal);
  addBandArch(book, pal);
  return book;
}
