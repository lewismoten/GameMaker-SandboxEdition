// DOS-compatible sharing keeps card words, timing, and custom lesson artwork.
import { describe, expect, it } from 'vitest';
import { parseSlideList, serializeSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from './book';
import { buildStarterPalette } from './palette';
import { cardPicture, gif, paper, scoresPicture } from './screens';
import { shareStarterScreens } from './screenSharing';

const book = new Book('bbl');
const hero = new Pixels(20, 40);
function card(gameId: string, title: string): Map<string, Uint8Array> {
  const pal = buildStarterPalette(undefined, gameId);
  return new Map([
    ['room.gif', gif(cardPicture(pal, book, hero, 1, 2, title, 'READ THE SIGN'), pal)],
    ['room.lst', serializeSlideList([{ name: 'room.gif', pause: 3 }])],
  ]);
}
describe('shared Starter screens', () => {
  it('shares GIF bytes across hero palettes while preserving DOS overlay words and pause', () => {
    const a = card('first-steps', 'A walk');
    const b = card('voice', 'Another room');
    shareStarterScreens(a, 'first-steps');
    shareStarterScreens(b, 'voice');
    expect(a.get('room.gif')).toEqual(b.get('room.gif'));
    expect(parseSlideList(a.get('room.lst')!)).toEqual([
      { name: 'room.gif', pause: 0 },
      { name: 'card0.txt', pause: 3 },
    ]);
    expect(new TextDecoder().decode(a.get('card0.txt'))).toBe('LEVEL 1 OF 2\r\n\r\nA WALK\r\n\r\nREAD THE SIGN\r\n');
    expect([...decodeGif(a.get('room.gif')!).palette.slice(0, 3)]).toEqual([0, 0, 0]);
  });
  it('leaves palette lessons and their original lists unchanged', () => {
    const files = card('colors', 'See the colors');
    const before = new Map(files);
    shareStarterScreens(files, 'colors');
    expect(files).toEqual(before);
  });
  it('keeps the GIF-only level cards that the pictures lesson contrasts with text and cartoons', () => {
    const files = card('pictures-and-cartoons', 'A picture');
    const before = new Map(files);
    shareStarterScreens(files, 'pictures-and-cartoons');
    expect(files).toEqual(before);
  });
  it('retains each score caption because DOS cannot draw that custom line separately', () => {
    const pal = buildStarterPalette();
    const image = gif(scoresPicture(pal, book, 'THE FIRST WALKERS'), pal);
    const files = new Map([['scores.gif', image]]);
    shareStarterScreens(files, 'first-steps');
    expect(files.get('scores.gif')).toEqual(image);
    const other = new Map([['scores.gif', gif(scoresPicture(pal, book, 'ANOTHER CAPTION'), pal)]]);
    shareStarterScreens(other, 'voice');
    expect(other.get('scores.gif')).not.toEqual(files.get('scores.gif'));
  });
  it('moves unique page headings into text but preserves the credits page layout', () => {
    const pal = buildStarterPalette();
    const files = new Map([
      ['story.gif', gif(paper(pal, book, 'THE FIRST STEP'), pal)],
      ['story.txt', new TextEncoder().encode('FIRST STEPS\r\n\r\nRead the signs.\r\n')],
      ['story.lst', serializeSlideList([{ name: 'story.gif', pause: 0 }, { name: 'story.txt' }])],
      ['credits.gif', gif(paper(pal, book, 'CREDITS'), pal)],
      ['credits.txt', new TextEncoder().encode('FIRST STEPS\r\n')],
      ['credits.lst', serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }])],
    ]);
    shareStarterScreens(files, 'first-steps');
    expect(new TextDecoder().decode(files.get('story.txt'))).toBe('THE FIRST STEP\r\n\r\nFIRST STEPS\r\n\r\nRead the signs.\r\n');
    expect(new TextDecoder().decode(files.get('credits.txt'))).toBe('FIRST STEPS\r\n');
  });
  it('keeps a full text page from growing another timed page', () => {
    const pal = buildStarterPalette();
    const image = gif(paper(pal, book, 'THE FIRST STEP'), pal);
    const body = new TextEncoder().encode(Array(16).fill('Read the signs.').join('\r\n') + '\r\n');
    const files = new Map([
      ['story.gif', image],
      ['story.txt', body],
      ['story.lst', serializeSlideList([{ name: 'story.gif', pause: 0 }, { name: 'story.txt' }])],
    ]);
    shareStarterScreens(files, 'first-steps');
    expect(files.get('story.gif')).toEqual(image);
    expect(files.get('story.txt')).toBe(body);
  });
  it('keeps artwork added to paper and avoids text filename collisions', () => {
    const pal = buildStarterPalette();
    const p = paper(pal, book, 'THE KEYS');
    p.rect(30, 60, 80, 10, pal.c('red', 2));
    const art = gif(p, pal);
    const files = card('first-steps', 'Walk');
    files.set('keys.gif', art);
    files.set('card0.txt', new Uint8Array([42]));
    shareStarterScreens(files, 'first-steps');
    expect(files.get('keys.gif')).toBe(art);
    expect([...files.get('card0.txt')!]).toEqual([42]);
    expect(parseSlideList(files.get('room.lst')!)[1].name).toBe('card1.txt');
  });
});
