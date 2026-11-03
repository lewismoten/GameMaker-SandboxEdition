// A box in the box viewer, kept in the address (#/desk?open=box:<game id>&turn=32,-12,1.5) so a
// reload or a shared link comes back to the same box, turned the way it was left. Opening pushes
// a history entry (Back closes the viewer); stepping to another box and turning replace it.
import { currentRoute, setHashParams, withParams } from '../../urlState';

const PREFIX = 'box:';
/** Marks the history entry the viewer pushed, so closing knows Back is the way out. */
const MARK = 'boxViewer';

/** The open= value for a game's box. */
export const boxOpenValue = (id: string): string => `${PREFIX}${id}`;

/** The game id an open= value names (open=box:<id>), or undefined when it names something else or is malformed. */
export function boxIdFromOpen(open: string | undefined): string | undefined {
  if (!open?.startsWith(PREFIX)) return undefined;
  const id = open.slice(PREFIX.length);
  return /^[\w.-]{1,48}(:[\w.-]{1,48})?$/.test(id) ? id : undefined;
}

/**
 * The box a reload or shared link may open: only one standing on this visitor's shelf. The shelf
 * lists a secret game only once it is revealed, so a crafted link for one that is not (or for
 * any unknown id) opens nothing, and shows nothing.
 */
export const restorableBox = (id: string | undefined, onShelf: Iterable<string>): string | undefined =>
  id !== undefined && [...onShelf].includes(id) ? id : undefined;

/** How a box is turned and zoomed (the viewer's rotation in degrees, and its scale). */
export interface BoxTurn {
  ry: number;
  rx: number;
  zoom: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** 'ry,rx,zoom' for the address; the turn is kept to whole degrees and a zoom to 2 places. */
export const formatBoxTurn = (t: BoxTurn): string => `${Math.round(((t.ry % 360) + 360) % 360)},${Math.round(t.rx)},${Math.round(t.zoom * 100) / 100}`;

/** Reads 'ry,rx,zoom' back, kept inside what the viewer allows; anything else is undefined. */
export function parseBoxTurn(s: string | undefined): BoxTurn | undefined {
  const m = /^(-?\d{1,4}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?),(\d{1,2}(?:\.\d+)?)$/.exec(s ?? '');
  if (!m) return undefined;
  return { ry: Number(m[1]), rx: clamp(Number(m[2]), -80, 80), zoom: clamp(Number(m[3]), 0.4, 4) };
}

/** The box the address names, if any. */
export const boxInAddress = (): string | undefined => boxIdFromOpen(currentRoute().params.open);

/** The turn the address holds. */
export const turnInAddress = (): BoxTurn | undefined => parseBoxTurn(currentRoute().params.turn);

/** Whether the address still shows a box (Back leaves it). */
export const boxIsShown = (): boolean => boxInAddress() !== undefined;

/** Shows a box in the address: `push` adds a history entry (opening by hand), otherwise it replaces (a reload). */
export function showBoxInAddress(id: string, push: boolean): void {
  if (!push) return stepBoxInAddress(id);
  const hash = withParams(currentRoute(), { open: boxOpenValue(id), turn: undefined });
  history.pushState({ [MARK]: true }, '', `${location.pathname}${location.search}${hash}`);
}

/** Steps the address to another box (the turn is forgotten), replacing the entry. */
export const stepBoxInAddress = (id: string): void => setHashParams({ open: boxOpenValue(id), turn: undefined }, ['desk']);

/** Keeps how the box is turned in the address. */
export const turnBoxInAddress = (t: BoxTurn | undefined): void => setHashParams({ turn: t ? formatBoxTurn(t) : undefined }, ['desk']);

/** Takes the box out of the address, replacing the entry. */
export const dropBoxFromAddress = (): void => {
  // also a malformed box:… value, which names no box but should not stay in the address
  if (currentRoute().params.open?.startsWith(PREFIX)) setHashParams({ open: undefined, turn: undefined }, ['desk']);
};

/** Whether this history entry is the one the viewer pushed. */
export const viewerPushedEntry = (): boolean => !!(history.state as Record<string, unknown> | null)?.[MARK];
