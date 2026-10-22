// Tests: putting a demo added for this edition into a copy of a game (media/addedDemo.ts).
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../src/project/files';
import { newGame, parseGame, serializeGame } from '../src/formats/game';
import { ADDED_DEMO_NOTE, includeAddedDemo } from '../src/media/addedDemo';
import { titleDemo } from '../src/media/demo';

const files = () => new GameFiles([['test.gam', serializeGame(newGame('Test'))]]);
const rec = new Uint8Array([5, 0, 77]);

describe('including an added demo', () => {
  it('names it in the title scene of a copy, with a note, leaving the original files alone', () => {
    const original = files();
    const copy = includeAddedDemo(original, 'test.gam', rec, { file: 'test.rec', made: 'By a bot.', date: '2026-10-21' });
    expect(parseGame(copy.get('test.gam')!).scenes[0].files[11]).toBe('SEDEMO.REC');
    expect(titleDemo(copy, 'test.gam')).toEqual(rec);
    expect(new TextDecoder().decode(copy.get(ADDED_DEMO_NOTE))).toMatch(/NOT part of the original game/);
    expect(titleDemo(original, 'test.gam')).toBeUndefined();
    expect(original.has(ADDED_DEMO_NOTE)).toBe(false);
  });

  it('keeps the name of a recording the game already had', () => {
    const f = files();
    f.set('houses.rec', rec);
    const copy = includeAddedDemo(f, 'test.gam', rec, { file: 'houses.rec', inGame: true, made: '', date: '' });
    expect(parseGame(copy.get('test.gam')!).scenes[0].files[11]).toBe('HOUSES.REC');
    expect(copy.has('sedemo.rec')).toBe(false);
  });
});
