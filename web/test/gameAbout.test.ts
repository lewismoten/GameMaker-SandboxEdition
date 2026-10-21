// Tests: A game's about text for exports (export/gameAbout.ts).
import { describe, expect, it } from 'vitest';
import { blurbOf, dosText, gameAbout } from '../src/export/gameAbout';

const text = (s: string) => new TextEncoder().encode(s);

describe('gameAbout', () => {
  it('reads DOS text up to the end mark', () => {
    expect(dosText(text('Hi\r\nthere\x1ajunk'))).toBe('Hi\nthere');
  });

  it('joins a story screen, skipping rules and spaced headings', () => {
    expect(blurbOf('S T O R Y\n-----\nOnce upon a ti-\nme there was\na hero.')).toBe('Once upon a time there was a hero.');
  });

  it('finds the story and the shareware notice', () => {
    const about = gameAbout([
      ['GAMES.TXT', text('The galaxy is in danger.')],
      ['README.TXT', text('This is shareware. Please register for $10.')],
      ['game.gam', new Uint8Array(4)],
    ]);
    expect(about).toEqual({ blurb: 'The galaxy is in danger.', notice: 'This is shareware. Please register for $10.' });
  });

  it('does not call a plain readme a notice', () => {
    expect(gameAbout([['readme.txt', text('Use the arrow keys.')]])).toEqual({});
  });
});
