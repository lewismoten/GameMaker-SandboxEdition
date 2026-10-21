// What the address bar keeps, so a reload (or a shared link) comes back to the same place.
//
// Both interfaces use the hash: a path (#/p/<project>/<file>, #/game/cd:nebula, #/desk) and,
// after a ?, small readable settings for the part being looked at (?tab=instruments&scene=3).
// Fine-grained changes (a tab, a selection) replace the current history entry so Back is not
// filled with them; opening another page or file pushes a new entry.

export type ParamValue = string | number | boolean | null | undefined;

export interface HashRoute {
  /** The path's parts, decoded: '#/p/abc/NEBULA.MON' → ['p', 'abc', 'NEBULA.MON']. */
  path: string[];
  /** The settings after the ?, decoded. */
  params: Record<string, string>;
}

/** Splits a hash ('#/p/abc/file.mon?monster=3') into its path and settings. */
export function parseHash(hash: string): HashRoute {
  const raw = hash.replace(/^#/, '');
  const q = raw.indexOf('?');
  const pathPart = q < 0 ? raw : raw.slice(0, q);
  const params: Record<string, string> = {};
  if (q >= 0) for (const [k, v] of new URLSearchParams(raw.slice(q + 1))) params[k] = v;
  const path = pathPart
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  return { path, params };
}

/** Readable in the address bar: letters, digits and a few marks are left as they are. */
const enc = (s: string) => encodeURIComponent(s).replace(/%3A/gi, ':').replace(/%2C/gi, ',');

/** Builds a hash from a path and settings; empty, false and undefined settings are left out. */
export function formatHash(path: readonly string[], params: Record<string, ParamValue> = {}): string {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
    .map(([k, v]) => `${enc(k)}${v === true ? '' : `=${enc(String(v))}`}`)
    .join('&');
  return `#/${path.map(enc).join('/')}${query ? `?${query}` : ''}`;
}

/** The current address's route. */
export const currentRoute = (): HashRoute => parseHash(location.hash);

/** One setting from the current address. */
export const hashParam = (name: string): string | undefined => currentRoute().params[name];

/** A whole-number setting from the current address, or undefined when missing or not a number. */
export function hashNumber(name: string): number | undefined {
  const v = hashParam(name);
  if (v === undefined || !/^-?\d+$/.test(v)) return undefined;
  return Number(v);
}

/** Merges `changes` into the settings (undefined removes one); the path stays. */
export function withParams(route: HashRoute, changes: Record<string, ParamValue>): string {
  const params: Record<string, ParamValue> = { ...route.params };
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined || v === null || v === '' || v === false) delete params[k];
    else params[k] = v;
  }
  return formatHash(route.path, params);
}

/**
 * Changes settings in the address without a new history entry and without a hashchange
 * (so nothing re-renders). Ignored when `onlyUnder` is given and the path has moved on —
 * an editor closing late must not write into the next page's address.
 */
export function setHashParams(changes: Record<string, ParamValue>, onlyUnder?: readonly string[]): void {
  const route = currentRoute();
  if (onlyUnder && onlyUnder.some((p, i) => route.path[i] !== p)) return;
  const next = withParams(route, changes);
  if (next !== (location.hash || '#/')) history.replaceState(history.state, '', `${location.pathname}${location.search}${next}`);
}

/** The path of the current address, so an editor can scope its settings to its own file. */
export const currentPath = (): string[] => currentRoute().path;

export interface ViewState {
  /** A setting, only while the address is still at this view's path. */
  get(name: string): string | undefined;
  /** A whole-number setting, or undefined. */
  num(name: string): number | undefined;
  /** Changes settings (replacing the history entry), only while the address is at this view's path. */
  set(changes: Record<string, ParamValue>): void;
}

/** The settings of one page or editor, kept to its own path (e.g. ['p', id, 'NEBULA.MON']). */
export function viewState(path: readonly string[]): ViewState {
  const here = () => {
    const r = currentRoute();
    return path.every((p, i) => r.path[i] === p) ? r : undefined;
  };
  const get = (name: string) => here()?.params[name];
  return {
    get,
    num: (name) => {
      const v = get(name);
      return v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined;
    },
    set: (changes) => setHashParams(changes, path),
  };
}
