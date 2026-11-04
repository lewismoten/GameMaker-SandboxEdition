// The schema.org VideoGame of an exported page: the site's own (seo/site.ts gameJsonLd, which says it was
// made with Game-Maker: Sandbox Edition) plus what "About this game" tells: author and company, genre,
// license, version, website, the story as the abstract, credits as contributors, and the pictures
// inside the page as screenshots. The page's address isn't known when it is exported, so the pictures
// are described (caption, size, type) but not linked.
import { gameJsonLd } from '../seo/site';
import type { ExportMeta } from './pageSeo';

const MAX_SHOTS = 8;

export function gameLd(m: ExportMeta): Record<string, unknown> {
  const a = m.about ?? {};
  const year = /^\d{4}$/.test(a.year ?? '') ? Number(a.year) : m.year;
  const base = gameJsonLd({
    ...m,
    author: a.author ?? m.author,
    company: a.company ?? m.company,
    year,
    blurb: a.description ?? m.blurb,
  });
  const extra: Record<string, unknown> = {
    genre: a.genre,
    license: a.license,
    softwareVersion: m.version,
    abstract: a.story,
    sameAs: a.website,
    contributor: a.credits?.map((c) => ({ '@type': 'Person', name: c.name, ...(c.role ? { jobTitle: c.role } : {}) })),
    screenshot: m.pictures?.slice(0, MAX_SHOTS).map((p) => ({
      '@type': 'ImageObject',
      caption: p.alt,
      width: p.width,
      height: p.height,
      encodingFormat: 'image/gif',
    })),
  };
  // a game of someone's own, so its year is a real one
  if (a.year && year) base.datePublished = String(year);
  return { ...base, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))) };
}
