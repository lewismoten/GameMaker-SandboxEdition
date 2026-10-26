// Which print is on the desk's mouse pad: the Sandbox BBS one it came with, or one of the
// Square Deal Pad Co. pads from TURBO BUTTON's ad (THE CHEZ, graph paper, night sky, plain
// blue). Remembered in this browser only, as a convenience; a blocked or odd stored value
// falls back to the Sandbox BBS print. Saving sends PAD_CHANGED so an open desk repaints.

export const PAD_PRINTS = [
  { id: 'sandbox', name: 'Sandbox BBS', note: 'the one it came with' },
  { id: 'chez', name: 'THE CHEZ', note: 'in tomato red' },
  { id: 'graph', name: 'Graph paper', note: 'for mapping levels' },
  { id: 'night', name: 'Night sky', note: 'for space games' },
  { id: 'blue', name: 'Plain blue', note: 'for grown-ups' },
] as const;

export type PadPrint = (typeof PAD_PRINTS)[number]['id'];

export const DEFAULT_PAD: PadPrint = 'sandbox';
const KEY = 'gm-desk-pad';
/** Sent on window when the print changes. */
export const PAD_CHANGED = 'gm-pad-change';

export const isPadPrint = (v: unknown): v is PadPrint => PAD_PRINTS.some((p) => p.id === v);

/** The print's name, as the ad lists it. */
export const padName = (id: PadPrint): string => PAD_PRINTS.find((p) => p.id === id)!.name;

export function loadPad(): PadPrint {
  try {
    const v = localStorage.getItem(KEY);
    return isPadPrint(v) ? v : DEFAULT_PAD;
  } catch {
    return DEFAULT_PAD;
  }
}

export function savePad(id: PadPrint): void {
  try {
    if (id === DEFAULT_PAD) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, id);
  } catch {
    // a private window: the pad just won't remember
  }
  window.dispatchEvent(new CustomEvent(PAD_CHANGED, { detail: id }));
}
