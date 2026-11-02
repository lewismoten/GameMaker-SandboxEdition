// Map zoom math: continuous zoom limits, wheel steps, the picture's drawing level, and keeping
// the same map point under the pointer (or the viewport center).
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

/** One screen pixel per block (the block is BLEN pixels wide at 100%). */
export const MIN_ZOOM = 1 / BLEN;
export const MAX_ZOOM = 4;

export function clampZoom(zoom: number): number {
  return Number.isFinite(zoom) ? Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) : 1;
}

/** The zoom a URL's `zoom` value asks for: an old preset (0.5, 2) or any number in range; otherwise 100%. */
export function zoomFromUrl(value: string | null | undefined): number {
  const n = Number(value);
  return value && n > 0 ? clampZoom(n) : 1;
}

/** The URL's text for a zoom: short, and nothing at 100%. */
export function zoomToUrl(zoom: number): string | undefined {
  return Math.abs(zoom - 1) < 0.0005 ? undefined : String(Math.round(zoom * 1000) / 1000);
}

/** The new zoom after a wheel or pinch delta (pixels; negative zooms in): continuous, never stepped. */
export function wheelZoom(current: number, deltaY: number, pinch = false): number {
  return clampZoom(current * Math.exp(-deltaY * (pinch ? 0.01 : 0.0015)));
}

/**
 * The scale the map picture is drawn at. Powers of two from 1/16 to 2: the browser scales the
 * picture by at most 2x to the exact zoom (smoothed when zoomed out, crisp pixels at 100% and
 * above), so a zoom change inside one level redraws nothing, like a mipmap.
 */
export function pictureScale(zoom: number): number {
  for (const level of [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]) if (zoom <= level) return level;
  return 2;
}

/** Scroll coordinates before browser edge clamping, in output pixels. */
export function zoomScroll(scroll: number, pointer: number, before: number, after: number): number {
  return ((scroll + pointer) * after) / before - pointer;
}
