// The Starters' "How do I…?" lists (games/<id>/manual.json "howDoI"): every entry points at a
// real scene and an in-bounds map spot, and at a "How this level is made" page.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { filterQuestions, lessonPage, levelTitle, LESSON_HEAD, questionsOf, type HowDoIEntry } from './howDoI';

const GAMES = resolve(__dirname, '../../../games');
interface ManualFile {
  title: string;
  pages: { head: string; html: string }[];
  howDoI?: HowDoIEntry[];
}
const starters = readdirSync(GAMES).filter((id) => existsSync(join(GAMES, id, 'manual.json')) && existsSync(join(GAMES, id, 'about.json')));
const manualOf = (id: string): ManualFile => JSON.parse(readFileSync(join(GAMES, id, 'manual.json'), 'utf8'));
const withList = starters.filter((id) => manualOf(id).howDoI);

describe('howDoI lists', () => {
  it('answers the Slow Computers Escape question in its linked lesson', () => {
    const manual = manualOf('slow-computers');
    const question = manual.howDoI?.find((q) => q.id === 'escape');
    expect(question?.q).toBe('Why does Escape restart the level?');
    const lesson = lessonPage({ original: { manual } }, question!.level);
    expect(lesson?.html).toContain('hold Escape until the screen goes black');
    expect(lesson?.html).toContain('release it during the fade');
  });
  it('are on every Starter, 3 to 6 questions each', () => {
    const series = starters.filter((id) => JSON.parse(readFileSync(join(GAMES, id, 'about.json'), 'utf8')).series === 'starter');
    expect(series.length).toBeGreaterThan(0);
    for (const id of series) {
      const n = manualOf(id).howDoI?.length ?? 0;
      expect(n, id).toBeGreaterThanOrEqual(3);
      expect(n, id).toBeLessThanOrEqual(6);
    }
  });

  for (const id of withList) {
    it(`${id}: each entry points at a real scene, an in-bounds spot and a lesson page`, () => {
      const manual = manualOf(id);
      const lessons = manual.pages.filter((p) => p.head === LESSON_HEAD).length;
      const ids = new Set<string>();
      // the built .gam is ignored output: check against it when it has been built, else the scene only has to be a level's (2 or more)
      const disk = join(GAMES, id, 'disk');
      const gam = existsSync(disk) ? readdirSync(disk).find((f) => f.toLowerCase().endsWith('.gam')) : undefined;
      const game = gam ? parseGame(new Uint8Array(readFileSync(join(disk, gam)))) : undefined;
      for (const e of manual.howDoI!) {
        if (id === 'slow-computers' && e.id === 'escape') expect(e.q).toBe('Why does Escape restart the level?');
        else expect(e.q, e.id).toMatch(/^How do I .+\?$/);
        expect(ids.has(e.id), `${id}/${e.id} is listed twice`).toBe(false);
        ids.add(e.id);
        expect(Number.isInteger(e.scene) && e.scene >= 2, `${e.id}: scene ${e.scene}`).toBe(true);
        if (game) {
          expect(e.scene, `${e.id}: scene`).toBeLessThan(game.scenes.length);
          expect(game.scenes[e.scene].gametype, `${e.id}: scene ${e.scene} is not a level`).toBe(ADVTYPE);
        }
        expect(e.x >= 0 && e.x < MLEN && Number.isInteger(e.x), `${e.id}: x ${e.x}`).toBe(true);
        expect(e.y >= 0 && e.y < MWID && Number.isInteger(e.y), `${e.id}: y ${e.y}`).toBe(true);
        expect(e.level >= 1 && e.level <= lessons, `${e.id}: level ${e.level} of ${lessons}`).toBe(true);
      }
    });
  }
});

describe('howDoI helpers', () => {
  const entry = {
    id: 'g',
    title: 'Game',
    original: {
      manual: {
        title: 'Game',
        pages: [
          { head: 'Level 1: First', html: '<p>a</p>' },
          { head: LESSON_HEAD, html: '<p>how 1</p>' },
          { head: 'Level 2: Second', html: '<p>b</p>' },
          { head: LESSON_HEAD, html: '<p>how 2</p>' },
        ],
        howDoI: [{ id: 'k', q: 'How do I make a key?', scene: 2, x: 1, y: 2, level: 2 }],
      },
    },
  };
  it('reads the questions, the lesson page and the level title', () => {
    expect(questionsOf(entry)).toEqual([{ id: 'k', q: 'How do I make a key?', scene: 2, x: 1, y: 2, level: 2, game: 'g', gameTitle: 'Game' }]);
    expect(lessonPage(entry, 2)?.html).toBe('<p>how 2</p>');
    expect(lessonPage(entry, 3)).toBeUndefined();
    expect(levelTitle(entry, 2)).toBe('Second');
  });
  it('searches by every word, in any case', () => {
    const all = questionsOf(entry);
    expect(filterQuestions(all, 'KEY game')).toHaveLength(1);
    expect(filterQuestions(all, 'ladder')).toHaveLength(0);
    expect(filterQuestions(all, '  ')).toHaveLength(1);
  });
});
