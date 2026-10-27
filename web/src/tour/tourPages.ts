// What the guide button needs up front, without the tour itself: which page the address
// shows, which pages have a chapter, whether the visitor turned the guides on for a page
// (kept in this browser), and a tour asked for in the address (#/?tour=all&record).
import { parseHash } from '../urlState';
import type { PageKey } from './steps';

/** The pages with a chapter (tourData.test.ts keeps it in step with chapters/index.ts). */
export const CHAPTER_PAGES: readonly PageKey[] = ['home', 'library', 'achievements', 'cast', 'guide', 'credits', 'editor'];

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

/** A tour the address asks for: ?tour=all (or a chapter's id), with &record for recording mode. */
export interface TourRequest {
  /** 'all', or a chapter's id. */
  chapters: string;
  record: boolean;
}

export function tourRequest(hash: string): TourRequest | undefined {
  const { params } = parseHash(hash);
  if (params.tour === undefined) return undefined;
  return { chapters: params.tour || 'all', record: 'record' in params };
}
