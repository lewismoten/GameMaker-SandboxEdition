// "About this game": the author's facts about a game, kept in the companion (companion.ts), so the
// DOS, native and web-page exports' game files never carry them. They feed three things: the
// FILE_ID.DIZ in the DOS ZIP (fileIdDiz.ts), and the visible credits and schema.org data of the
// one-page web export (export/insideGame.ts, export/gameLd.ts). The version stays `gameVersion`.
import type { Companion } from './companion';

export interface Credit {
  role: string;
  name: string;
}

export interface AboutGame {
  title?: string;
  author?: string;
  company?: string;
  /** A four-digit year. */
  year?: string;
  /** One or two sentences: what the game is. */
  description?: string;
  /** The story, longer than the description. */
  story?: string;
  genre?: string;
  website?: string;
  license?: string;
  credits?: Credit[];
}

export const ABOUT_TEXT_KEYS = ['title', 'author', 'company', 'year', 'description', 'story', 'genre', 'website', 'license'] as const;

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The About fields of a companion, cleaned: only known fields, text trimmed, empty ones left out. */
export function aboutOf(c: Companion | undefined): AboutGame {
  const raw = c?.about;
  if (!isObject(raw)) return {};
  const out: AboutGame = {};
  for (const k of ABOUT_TEXT_KEYS) {
    const v = raw[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  if (Array.isArray(raw.credits)) {
    const credits = raw.credits
      .filter(isObject)
      .map((x) => ({ role: typeof x.role === 'string' ? x.role.trim() : '', name: typeof x.name === 'string' ? x.name.trim() : '' }))
      .filter((x) => x.name);
    if (credits.length) out.credits = credits;
  }
  return out;
}

export function isAboutEmpty(a: AboutGame): boolean {
  return !Object.keys(a).length;
}

/** Saves the fields in place; an empty set removes the `about` key. */
export function setAbout(c: Companion, about: AboutGame): void {
  const clean = aboutOf({ ...c, about });
  if (isAboutEmpty(clean)) delete c.about;
  else c.about = clean;
}
