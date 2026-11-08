// The "Color help" choices, kept only in this browser (localStorage gm-color-help): show color
// names, warn about look-alike colors, and preview as others might see it. They are
// preferences, not a record of anyone's eyes, and never leave the device. No DOM.

export type Warn = 'off' | 'rg' | 'by' | 'both';
export type Preview = 'normal' | 'rg' | 'by' | 'all';

export interface ColorHelp {
  names: boolean;
  warn: Warn;
  preview: Preview;
}

export const KEY = 'gm-color-help';
const DEFAULTS: ColorHelp = { names: false, warn: 'off', preview: 'normal' };

const WARNS: Warn[] = ['off', 'rg', 'by', 'both'];
const PREVIEWS: Preview[] = ['normal', 'rg', 'by', 'all'];

/** Reads whatever is stored, ignoring anything that is not one of the known choices. */
export function parse(raw: string | null): ColorHelp {
  try {
    const o = JSON.parse(raw ?? '{}') as Partial<ColorHelp>;
    return {
      names: o.names === true,
      warn: WARNS.includes(o.warn as Warn) ? (o.warn as Warn) : 'off',
      preview: PREVIEWS.includes(o.preview as Preview) ? (o.preview as Preview) : 'normal',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const listeners = new Set<() => void>();
let current: ColorHelp | undefined;

export function getColorHelp(): ColorHelp {
  if (!current) {
    try {
      current = parse(localStorage.getItem(KEY));
    } catch {
      current = { ...DEFAULTS };
    }
  }
  return current;
}

export function setColorHelp(patch: Partial<ColorHelp>): void {
  current = { ...getColorHelp(), ...patch };
  try {
    if (JSON.stringify(current) === JSON.stringify(DEFAULTS)) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private window: the choice holds for this visit */
  }
  listeners.forEach((f) => f());
}

/** Calls `f` after any change; returns the way to stop. */
export function onColorHelp(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** For tests: forget the cached choices. */
export function resetColorHelpCache(): void {
  current = undefined;
}
