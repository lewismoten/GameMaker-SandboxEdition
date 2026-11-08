// Remembers, per map and per project, the zoom and the block at the middle of the view, so going back
// and forth between maps needs no new zooming or panning. A viewer's own convenience kept in
// localStorage (`gm-map-views`): never in game files, the companion or backups. At most 200 maps are
// kept, least recently looked at first to go. The zoom of the last map looked at is kept too, for a map
// with no saved view.
export interface MapView {
  /** Zoom (1 = 100%). */
  z: number;
  /** The map block at the middle of the view. */
  x: number;
  y: number;
  /** The block at the top left and the view's size in pixels: exact when the window is about the same size again. */
  sx?: number;
  sy?: number;
  w?: number;
  h?: number;
}

const MAP_VIEWS_KEY = 'gm-map-views';
export const MAX_MAP_VIEWS = 200;

interface Saved {
  last?: number;
  /** Most recently looked at last. */
  views: [string, MapView][];
}

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function load(storage: Pick<Storage, 'getItem'>): Saved {
  try {
    const raw = JSON.parse(storage.getItem(MAP_VIEWS_KEY) ?? 'null') as Saved | null;
    if (!raw || !Array.isArray(raw.views)) return { views: [] };
    const views = raw.views.filter((e) => Array.isArray(e) && typeof e[0] === 'string' && e[1] && num(e[1].z) && e[1].z > 0 && num(e[1].x) && num(e[1].y));
    return { last: num(raw.last) && raw.last > 0 ? raw.last : undefined, views: views.slice(-MAX_MAP_VIEWS) };
  } catch {
    return { views: [] };
  }
}

const keyOf = (projectId: string, file: string) => `${projectId}/${file.toUpperCase()}`;

const defaultStorage = (): Storage | undefined => {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
};

/** The saved view of a map, or undefined. */
export function recallView(projectId: string, file: string, storage: Pick<Storage, 'getItem'> | undefined = defaultStorage()): MapView | undefined {
  if (!storage) return undefined;
  const k = keyOf(projectId, file);
  return load(storage).views.find(([key]) => key === k)?.[1];
}

/** The zoom of the map looked at last (any project), or 1. */
export function lastZoom(storage: Pick<Storage, 'getItem'> | undefined = defaultStorage()): number {
  return (storage && load(storage).last) || 1;
}

/** Saves a map's view, making it the most recent. Does nothing when storage is missing or full. */
export function rememberView(
  projectId: string,
  file: string,
  view: MapView,
  storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = defaultStorage(),
): void {
  if (!storage) return;
  const k = keyOf(projectId, file);
  const saved = load(storage);
  const views = saved.views.filter(([key]) => key !== k);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const entry: MapView = { z: Math.round(view.z * 1000) / 1000, x: r2(view.x), y: r2(view.y) };
  if (num(view.sx) && num(view.sy) && num(view.w) && num(view.h))
    Object.assign(entry, { sx: Math.round(view.sx * 1000) / 1000, sy: Math.round(view.sy * 1000) / 1000, w: Math.round(view.w), h: Math.round(view.h) });
  views.push([k, entry]);
  try {
    storage.setItem(MAP_VIEWS_KEY, JSON.stringify({ last: view.z, views: views.slice(-MAX_MAP_VIEWS) } satisfies Saved));
  } catch {
    // storage full or blocked: the view is simply not kept
  }
}
