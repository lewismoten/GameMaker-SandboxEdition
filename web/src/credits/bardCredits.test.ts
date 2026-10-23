// The Bard of Bizarre table must say what each game's own credits say: its credits screen
// and LICENSE.TXT (games/<id>/disk), its clip tools, and NOTICE.md's list of the games.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BARD_COLUMNS, BARD_GAMES, type BardColumn } from './bardCredits';

const repo = join(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(join(repo, path), 'latin1').replace(/\s+/g, ' ');

/** What a game's credits text says, per column. */
const SAYS: Record<BardColumn, (text: string, id: string) => boolean> = {
  chatgpt: (t) => /ChatGPT/.test(t),
  riffusionMusic: (t) => /Riffusion/.test(t) && !/no recording came/i.test(t),
  riffusionCover: (t) => /cover[^.;]*(made with|:) Riffusion/i.test(t),
  producerCover: (t) => /Producer\.ai/.test(t),
  claudeArt: (t) => /art[^.;]*(drawn|made)[^.;]* by Claude/i.test(t) || /code, art, [^.;]* by Claude/i.test(t),
  arranged: (t) => /FM arrangement/i.test(t),
  composed: (t) => /music[^.;]*(composed|made)[^.;]* by Claude/i.test(t),
  clips: (t) => /(clips|sampled sounds)[^.]* (made|cut) from/i.test(t),
  // the clip cutter's cue table came from analyze.py's word timings (Whisper, games/kit/song/analyze.py)
  whisper: (_t, id) => {
    const cut = join(repo, 'games', id, 'tools/cutClips.py');
    return existsSync(cut) && /word timings/i.test(readFileSync(cut, 'utf8'));
  },
  photo: (t) => /Doc Leo photo: Lewis Moten/.test(t),
  logo: (t) => /logo: DeepAI/.test(t),
};

describe('credits: The Bard of Bizarre table', () => {
  it('has a row for every Bard game and no other', () => {
    const bard = ['goat', 'mustard', 'needle', 'loaf', 'tickle', 'carl', 'remote', 'reckoning', 'loofah', 'smirked', 'sweats', 'risi'];
    expect(BARD_GAMES.map((g) => g.id).sort()).toEqual(bard.sort());
    for (const g of BARD_GAMES) {
      const about = JSON.parse(readFileSync(join(repo, 'games', g.id, 'about.json'), 'utf8')) as { series?: string; secret?: boolean; title: string };
      expect(about.series, g.id).toBe('bizarre');
      expect(about.secret, g.id).toBeFalsy();
      expect(g.title.replace(/’/g, "'"), g.id).toBe(about.title);
    }
  });

  for (const g of BARD_GAMES)
    it(`${g.id}: every cell agrees with its credits`, () => {
      const text = `${read(`games/${g.id}/disk/credits.txt`)} ${read(`games/${g.id}/disk/license.txt`)}`;
      for (const { key } of BARD_COLUMNS) expect(g.made.includes(key), `${g.id} ${key}`).toBe(SAYS[key](text, g.id));
    });

  it('Whisper is what analyze.py times the words with', () => {
    expect(readFileSync(join(repo, 'games/kit/song/analyze.py'), 'utf8')).toMatch(/import whisper/);
  });

  it('NOTICE.md names every game', () => {
    const notice = read('NOTICE.md');
    for (const g of BARD_GAMES) expect(notice, g.id).toContain(g.title.replace(/’/g, "'").replace(/ \(Left in the Basket\)/, ''));
  });
});
