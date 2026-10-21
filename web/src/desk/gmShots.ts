// Screenshots of the Sandbox Software games, all made with Game-Maker, for the Game-Maker
// SE box art and its Owner's Guide: each drawn from the game's own map (its box's first view).
import { loadCatalog, type CatalogEntry } from '../project/files';
import { mapShot, renderShot } from './boxArt';

export interface GameShot {
  id: string;
  title: string;
  /** What the picture shows off, for a caption. */
  feature: string;
  canvas: HTMLCanvasElement;
}

/** The games, in the order they appear on the box, with what each one shows off. */
export const SANDBOX_SHOTS: [id: string, feature: string, view?: number][] = [
  ['maximus', 'EXPLORE A HUNDRED WORLDS'],
  ['teddy', 'ANIMATE YOUR HERO'],
  ['year2000', 'DESIGN THE FUTURE', 1],
  ['snowbound', 'PAINT SCROLLING MAPS'],
  ['sandcast', 'BUILD CASTLES'],
  ['blaster', 'ARCADE ACTION'],
  ['logic', 'SOLVE PUZZLES'],
  ['sleuth', 'TELL A STORY'],
];

let all: Promise<GameShot[]> | undefined;

/** Every Sandbox game's screenshot, 16 x 10 blocks (a VGA screen), loaded once. */
export function sandboxShots(): Promise<GameShot[]> {
  all ??= loadCatalog()
    .then(async (cat) => {
      const shots = await Promise.all(
        SANDBOX_SHOTS.map(async ([id, feature, view = 0]) => {
          const entry = cat.find((c) => c.id === id);
          const canvas = entry && (await shotOf(entry, view));
          return canvas ? { id, title: shortTitle(entry.title), feature, canvas } : undefined;
        }),
      );
      return shots.filter((s): s is GameShot => !!s);
    })
    .catch(() => []);
  return all;
}

/** The shots if they have already loaded (the box art is drawn synchronously). */
let ready: GameShot[] = [];
export function loadedShots(): GameShot[] {
  return ready;
}

async function shotOf(entry: CatalogEntry, view: number): Promise<HTMLCanvasElement | undefined> {
  const shots = (entry.original?.box as { shots?: [string, number, number][] } | undefined)?.shots ?? [];
  const [m, x, y] = shots[view] ?? shots[0] ?? [];
  const shot = m ? await mapShot(entry, m, x, y, 16, 10).catch(() => undefined) : undefined;
  if (shot) return shot;
  // a map no level uses on its own: where the hero arrives instead
  const c = document.createElement('canvas');
  return (await renderShot(entry, c, 16, 10).catch(() => false)) ? c : undefined;
}

function shortTitle(t: string): string {
  return t.replace(/:.*$/, '').replace(/!$/, '');
}

/** Starts loading at once, so the box art has them by the time the box is opened. */
export function preloadShots(): void {
  void sandboxShots().then((s) => (ready = s));
}
