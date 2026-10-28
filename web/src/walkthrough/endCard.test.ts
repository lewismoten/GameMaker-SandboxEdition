// A partial walkthrough's closing card: its words, wrapped to the 320x200 screen, drawn over the
// dimmed last frame; and the YouTube text says the walkthrough is partial.
import { describe, expect, it } from 'vitest';
import { drawEndCard, endCardLines } from './endCard';
import { youtubeText } from './format';

describe('the closing card', () => {
  it('says the bot got this far, then where, wrapped to the screen', () => {
    expect(endCardLines({})).toEqual(['The bot got this far.']);
    const lines = endCardLines({ ending: 'It found no way through The Very Long Name Of A Cave Beneath The Hill.' });
    expect(lines.slice(0, 2)).toEqual(['The bot got this far.', '']);
    expect(lines.length).toBeGreaterThan(3);
    expect(lines.every((l) => l.length <= 36)).toBe(true);
    expect(lines.slice(2).join(' ')).toBe('It found no way through The Very Long Name Of A Cave Beneath The Hill.');
  });

  it('dims the frame and writes on it', () => {
    const rgba = new Uint8ClampedArray(320 * 200 * 4).fill(200);
    drawEndCard(rgba, ['The bot got this far.']);
    expect(rgba[0]).toBe(60);
    // somewhere in the middle row a letter is lit in yellow
    const row = Array.from({ length: 320 }, (_, x) => rgba[(97 * 320 + x) * 4 + 2]);
    expect(row.some((b) => b === 85)).toBe(true);
  });

  it('a partial walkthrough is called one on YouTube', () => {
    const yt = youtubeText({
      gameTitle: 'Cave',
      url: 'u',
      chapters: [],
      fps: 60,
      frames: 600,
      bot: true,
      partial: true,
      ending: 'It found no way through Walled.',
      byHand: true,
    });
    expect(yt.title).toBe('Cave — Partial Walkthrough, No Commentary');
    expect(yt.description).toContain('as far as the walkthrough bot got');
    expect(yt.description).toContain('It found no way through Walled.');
    expect(yt.description).toContain('played by a person');
  });
});
