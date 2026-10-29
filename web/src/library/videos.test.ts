// The Library's videos' words: each tour has a transcript the site serves itself, and every
// video its chapters in order inside the video. (Their words are Lewis's own, kept as he said
// them.) The games' walkthrough videos: each under its game with a picture the site serves, a
// stale one never shown, and a secret game's neither in the code nor fetched until it is revealed.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { CatalogEntry } from '../project/files';
import { idHash } from '../project/secretGames';
import { gameVideoShelf, videoById, videoShelf } from './videos';
import { WALK_VIDEOS } from './videosWalk';

const PUBLIC = new URL('../../public/', import.meta.url);
const GAMES = new URL('../../../games/', import.meta.url);

/** Every game folder's id and about.json, the secret ones too (named nowhere here). */
function games(): { id: string; title: string; secret: boolean }[] {
  return readdirSync(GAMES)
    .filter((id) => existsSync(new URL(`${id}/about.json`, GAMES)))
    .map((id) => {
      const about = JSON.parse(readFileSync(new URL(`${id}/about.json`, GAMES), 'utf8')) as { title: string; secret?: boolean };
      return { id, title: about.title, secret: about.secret === true };
    });
}
const entry = (g: { id: string; title: string }) => ({ id: g.id, title: g.title }) as CatalogEntry;
const secretFile = (id: string) => new URL(`videos/walk-${idHash(id).toString(16).padStart(8, '0')}.json`, PUBLIC);

const ids = [...videoShelf().map((v) => (v.open as { id: string }).id), ...WALK_VIDEOS.filter((v) => !v.stale).map((v) => v.id)];
const transcript = (id: string) => JSON.parse(readFileSync(new URL(`videos/${id}.transcript.json`, PUBLIC), 'utf8')) as { t: number; text: string }[];

describe('the videos’ descriptions, chapters and transcripts', () => {
  it('has a transcript for each tour, in order, inside the video', () => {
    for (const id of ids.filter((i) => videoById(i)?.transcript)) {
      const v = videoById(id)!;
      const paras = transcript(id);
      expect(paras.length, id).toBeGreaterThan(0);
      let last = -1;
      for (const p of paras) {
        expect(Number.isInteger(p.t) && p.t > last && p.t < v.seconds, `${id} ${p.t}`).toBe(true);
        expect(p.text.trim()).not.toBe('');
        last = p.t;
      }
    }
  });

  it('lists chapters in order, inside the video', () => {
    for (const id of ids) {
      const v = videoById(id)!;
      expect(v.about.length).toBeGreaterThan(0);
      let last = -1;
      for (const [at, name] of v.chapters ?? []) {
        expect(at > last && at < v.seconds && name.trim() !== '', `${id} ${at}`).toBe(true);
        last = at;
      }
    }
  });
});

describe('the games’ walkthrough videos', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shelves each under its game, with its length and a picture the site serves itself', async () => {
    const listed = games().filter((g) => !g.secret);
    const cards = await gameVideoShelf(listed.map(entry));
    expect(cards.length).toBe(WALK_VIDEOS.filter((v) => !v.stale).length);
    for (const c of cards) {
      const v = WALK_VIDEOS.find((w) => w.id === (c.open as { id: string }).id)!;
      expect(c.owner).toBe(v.game);
      expect(c.ownerTitle).toBe(listed.find((g) => g.id === v.game)!.title);
      expect([c.type, c.seconds]).toEqual(['video', v.seconds]);
      expect(existsSync(new URL(c.picture!.slice(2), PUBLIC)), c.picture).toBe(true);
    }
    expect(new Set(cards.map((c) => c.owner)).size).toBe(cards.length); // one a game
  });

  it('never shows a stale one (an older version of its game)', async () => {
    const stale = WALK_VIDEOS.filter((v) => v.stale);
    expect(stale.length).toBeGreaterThan(0);
    const cards = await gameVideoShelf(
      games()
        .filter((g) => !g.secret)
        .map(entry),
    );
    for (const v of stale) {
      expect(videoById(v.id)).toBeUndefined();
      expect(cards.filter((c) => c.owner === v.game)).toEqual([]);
    }
  });

  it('names no secret game in the code, and fetches a secret game’s only once it is listed (revealed)', async () => {
    const all = games();
    const secret = all.filter((g) => g.secret);
    expect(secret.length).toBeGreaterThan(0);
    const words = secret.flatMap((g) => [g.id, g.title, g.title.split(':')[0]]);
    const named = (text: string) => words.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
    for (const v of WALK_VIDEOS)
      for (const text of [v.game, v.title, ...v.about, ...(v.chapters ?? []).map(([, n]) => n)]) expect(named(text), v.id).toEqual([]);

    const fetched: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      fetched.push(url);
      const file = new URL(url.replace(/^\.\//, ''), PUBLIC);
      return Promise.resolve(
        existsSync(file) ? new Response(readFileSync(file), { headers: { 'content-type': 'application/json' } }) : new Response('', { status: 404 }),
      );
    });
    // nothing found: the catalog doesn't list them, so nothing is asked for and nothing shows
    const hidden = await gameVideoShelf(all.filter((g) => !g.secret).map(entry));
    expect(fetched).toEqual([]);
    for (const g of secret) expect(hidden.some((c) => c.owner === g.id)).toBe(false);
    // once revealed: its own file alone, and its card under it
    const shown = await gameVideoShelf(secret.map(entry));
    expect(fetched.length).toBe(secret.length);
    for (const g of secret) {
      expect(existsSync(secretFile(g.id)), g.id).toBe(true);
      const card = shown.find((c) => c.owner === g.id)!;
      expect(card.ownerTitle).toBe(g.title);
      expect(existsSync(new URL(card.picture!.slice(2), PUBLIC)), card.picture).toBe(true);
      expect(videoById((card.open as { id: string }).id)?.chapters?.length).toBeGreaterThan(0);
    }
  });
});
