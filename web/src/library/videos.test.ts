// The Library's videos' words: each has a transcript the site serves itself, its chapters in
// order inside the video. (Their words are Lewis's own, kept as he said them.)
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { videoById, videoShelf } from './videos';

const PUBLIC = new URL('../../public/', import.meta.url);

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
});
