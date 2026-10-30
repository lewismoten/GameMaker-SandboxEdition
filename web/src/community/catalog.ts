// Reviewed metadata for independently hosted games; listing a game does not fetch its archive.
import entries from './games.json';

export interface CommunityGame {
  id: string;
  title: string;
  author: string;
  url: string;
  summary: string;
  sourceUrl?: string;
  imageUrl?: string;
  archiveUrl?: string;
}
const FIELDS = new Set(['id', 'title', 'author', 'url', 'summary', 'sourceUrl', 'imageUrl', 'archiveUrl']);

/** Used for checked-in metadata and the submission form's generated entry. */
export function parseCommunityGames(value: unknown): CommunityGame[] {
  if (!Array.isArray(value)) throw new Error('Community games must be a JSON array.');
  const seen = new Set<string>();
  return value.map((raw: unknown, i) => {
    const fail = (message: string): never => {
      throw new Error(`Community entry ${i + 1}: ${message}`);
    };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('expected an object.');
    const entry = raw as Record<string, unknown>;
    if (Object.keys(entry).some((key) => !FIELDS.has(key))) return fail('unknown field.');
    const text = (key: string, limit: number): string => {
      const value = entry[key];
      if (typeof value !== 'string' || !value.trim() || value.trim().length > limit) return fail(`${key} must contain 1–${limit} characters.`);
      return value.trim();
    };
    const url = (key: string): string => {
      const value = text(key, 2048);
      try {
        const parsed = new URL(value);
        if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return parsed.href;
      } catch {
        /* The field message below also covers malformed URLs. */
      }
      return fail(`${key} must be a public HTTPS URL without credentials.`);
    };
    const id = text('id', 48);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || seen.has(id)) return fail('id must be unique lowercase words joined by hyphens.');
    seen.add(id);
    const game: CommunityGame = { id, title: text('title', 96), author: text('author', 80), url: url('url'), summary: text('summary', 400) };
    for (const key of ['sourceUrl', 'imageUrl', 'archiveUrl'] as const) if (entry[key] !== undefined) game[key] = url(key);
    return game;
  });
}

export const COMMUNITY_GAMES: readonly Readonly<CommunityGame>[] = Object.freeze(parseCommunityGames(entries).map((entry) => Object.freeze(entry)));
