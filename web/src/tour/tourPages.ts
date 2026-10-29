// What the guide button needs up front, without the tour itself: which page the address
// shows, which pages have a chapter, whether the visitor turned the guides on for a page
// (kept in this browser), and a tour asked for in the address (#/?tour=all&record, or on the
// DOS page dos.html?tour=dos).
import { parseHash } from '../urlState';
import type { PageKey } from './steps';

/** The pages with a chapter (tourData.test.ts keeps it in step with chapters/index.ts). */
export const CHAPTER_PAGES: readonly PageKey[] = ['home', 'library', 'achievements', 'cast', 'guide', 'credits', 'editor', 'desk', 'dos'];

const PAGES: Record<string, PageKey> = {
  game: 'home',
  help: 'guide',
  library: 'library',
  achievements: 'achievements',
  cast: 'cast',
  credits: 'credits',
  magazine: 'magazine',
  p: 'editor',
  mac: 'mac',
  windows: 'windows',
  linux: 'linux',
  desk: 'desk',
};

/** Whether this is the DOS page (dos.html), not index.html. */
export const onDosPage = (): boolean => /\/dos\.html$/.test(location.pathname);

/** The page shown now: the DOS page, or what index.html's address shows. */
export const pageHere = (): PageKey | undefined => (onDosPage() ? 'dos' : pageOf(location.hash));

/** The page an address shows in today's web (or the desk). */
export function pageOf(hash: string): PageKey | undefined {
  const [kind] = parseHash(hash).path;
  return kind === undefined ? 'home' : PAGES[kind];
}

const KEY = 'gm-tour-on';

function onPages(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** The guides wait on this page for the visitor (they turned them on here); off by default. */
export const guidesOn = (page: PageKey | undefined): boolean => !!page && onPages().includes(page);

export function setGuidesOn(page: PageKey, on: boolean): void {
  const pages = onPages().filter((p) => p !== page);
  if (on) pages.push(page);
  try {
    localStorage.setItem(KEY, JSON.stringify(pages));
  } catch {
    /* not remembered */
  }
}

/**
 * A tour the address asks for: ?tour=all (or a chapter's id, or several ids with commas), with
 * &record for recording mode and &cont when a tour carries on from another page (its title card
 * comes straight up, and its sound starts without asking for a click when the browser allows).
 */
export interface TourRequest {
  /** 'all', or chapters' ids ('dos', 'desk,dos'). */
  chapters: string;
  record: boolean;
  cont: boolean;
}

/** From index.html's hash (#/?tour=all), or the DOS page's query (dos.html?tour=dos). */
export function tourRequest(hash: string, search = ''): TourRequest | undefined {
  const params: Record<string, string> = { ...Object.fromEntries(new URLSearchParams(search)), ...parseHash(hash).params };
  if (params.tour === undefined) return undefined;
  return { chapters: params.tour || 'all', record: 'record' in params, cont: 'cont' in params };
}
