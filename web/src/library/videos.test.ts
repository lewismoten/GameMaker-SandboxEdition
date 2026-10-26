// The Library's videos' words: each has a transcript the site serves itself, its chapters in
// order inside the video, and neither its description, chapters nor transcript names a secret game.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { videoById, videoShelf } from './videos';

const GAMES = new URL('../../../games/', import.meta.url);
const PUBLIC = new URL('../../public/', import.meta.url);

/** Each secret game's id and title (and the title's part before a colon), read from its folder. */
function secretWords(): string[] {
  const words: string[] = [];
  for (const id of readdirSync(GAMES)) {
    const file = new URL(`${id}/about.json`, GAMES);
    if (!existsSync(file)) continue;
    const about = JSON.parse(readFileSync(file, 'utf8')) as { secret?: boolean; title?: string };
    if (about.secret) words.push(id, ...(about.title ? [about.title, about.title.split(':')[0]] : []));
  }
  return words;
}

const ids = videoShelf().map((v) => (v.open as { id: string }).id);
const transcript = (id: string) => JSON.parse(readFileSync(new URL(`videos/${id}.transcript.json`, PUBLIC), 'utf8')) as { t: number; text: string }[];

describe('the videos’ descriptions, chapters and transcripts', () => {
  it('has a transcript for each, in order, inside the video', () => {
    for (const id of ids) {
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

  it('never names a secret game', () => {
    const secrets = secretWords();
    expect(secrets.length).toBeGreaterThan(0);
    const named = (text: string) => secrets.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
    for (const id of ids) {
      const v = videoById(id)!;
      const words = [v.title, ...v.about, ...(v.chapters ?? []).map(([, name]) => name), ...transcript(id).map((p) => p.text)];
      for (const text of words) expect(named(text), id).toEqual([]);
    }
  });
});
