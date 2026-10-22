// The painted covers on the front of the Sandbox Software boxes, like the artist's renderings
// on real 1995 boxes: each is drawn in code (covers/<id>.ts), loaded only when its box is
// drawn, painted once and kept.
import type { Painter } from './paint';
import { idHash } from '../../../project/secretGames';

const COVERS: Record<string, () => Promise<{ default: Painter }>> = {
  blaster: () => import('./blaster'),
  brief: () => import('./brief'),
  logic: () => import('./logic'),
  maximus: () => import('./maximus'),
  sandcast: () => import('./sandcast'),
  sleuth: () => import('./sleuth'),
  snowbound: () => import('./snowbound'),
  teddy: () => import('./teddy'),
  year2000: () => import('./year2000'),
};

/**
 * The secret games' covers, by idHash, so the desk's code and chunk names name none of them
 * (see project/secretGames): e.g. `0x1234abcd: () => import('./extra')` for a cover in
 * covers/extra.ts. None yet.
 */
const SECRET_COVERS: Record<number, () => Promise<{ default: Painter }>> = {};

/** Where the award laurel and the "hours of play" burst sit, clear of each cover's subject. */
export const SEALS: Record<string, { laurel: 'left' | 'right'; burst: 'left' | 'right' }> = {
  sandcast: { laurel: 'right', burst: 'right' },
  sleuth: { laurel: 'right', burst: 'right' },
  snowbound: { laurel: 'left', burst: 'right' },
  year2000: { laurel: 'right', burst: 'right' },
};

const painted = new Map<string, Promise<HTMLCanvasElement | undefined>>();

/** The game's painted cover at w x h, or undefined when it has none. */
export function coverArt(id: string, w: number, h: number): Promise<HTMLCanvasElement | undefined> {
  const key = `${id}@${w}x${h}`;
  let p = painted.get(key);
  if (!p) {
    const load = COVERS[id] ?? SECRET_COVERS[idHash(id)];
    p = !load
      ? Promise.resolve(undefined)
      : load()
          .then(({ default: paint }) => {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            paint(c.getContext('2d')!, w, h);
            return c;
          })
          .catch(() => undefined);
    painted.set(key, p);
  }
  return p;
}
