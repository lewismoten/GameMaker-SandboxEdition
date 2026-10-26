// The web player's look of XFERPLAY's own screens: with no patches every word, color, time and
// key is exactly what the engine drew before the customizer; with patches, what they set.
import { describe, expect, it } from 'vitest';
import { playerLook, sprintf, STOCK_LOOK } from './playerLook';
import { RGB_BLUE, RGB_PURPLE, RGB_RED, RGB_YELLOW, match } from './showGraphic';

const pal = new Uint8Array(768).map((_, i) => (i * 37) % 64);

describe('the player’s look', () => {
  it('is the CD player’s with no patches', () => {
    const l = STOCK_LOOK;
    expect(['play', 'instructions', 'storyline', 'credits', 'highScores', 'quit'].map((w) => l.text(`str.menu.${w}`))).toEqual([
      'Play',
      'Read Instructions',
      'Read Storyline',
      'See Credits',
      'See Highest Scores',
      'Quit',
    ]);
    expect(l.format('str.invent.score', 1234)).toBe('Score:     1234');
    expect(l.format('str.invent.time', 1, 2.7, 3, 45)).toBe('Elapsed Time: 01:02:03.45');
    expect(l.format('str.hiscore.latest', 500)).toBe(`${String(500).padStart(10)} Your Latest Score`);
    expect(l.format('str.hiscore.place', 3)).toBe('You scored number  3 on the Top Ten!');
    expect(l.format('str.text.missingFile', 'a.txt')).toBe('The file a.txt is');
    expect(l.color(pal, 'color.select.menu')).toBe(match(pal, RGB_BLUE));
    expect(l.color(pal, 'color.select.hsTitle')).toBe(match(pal, RGB_RED));
    expect(l.color(pal, 'color.select.textPages')).toBe(match(pal, RGB_PURPLE));
    expect(l.color(pal, 'color.select.loadSlots')).toBe(match(pal, RGB_YELLOW));
    expect([l.num('layout.menu.markerX'), l.num('layout.menu.firstY'), l.num('layout.menu.spacing'), l.num('border.marker.width')]).toEqual([70, 121, 8, 5]);
    expect([l.seconds('timing.menu.idleSeconds'), l.seconds('timing.highScores'), l.seconds('timing.showGraphic.txt')]).toEqual([30, 30, 90]);
    expect(l.frame('border.invent.outer')).toEqual([10, 10, 310, 190]);
    expect([5, 6, 9, 10].map((k) => l.fkeyOn(k))).toEqual([true, true, true, true]);
  });

  it('shows the patches', () => {
    const l = playerLook({
      'str.menu.play': 'Go',
      'str.invent.lives': 'Failsafes: %d',
      'color.rgb.hsGreen': [0, 63, 0],
      'color.select.menu': 'hsGreen',
      'timing.highScores': -1,
      'table.fkeys.F5': 'off',
      'str.menu.quit': 'Too long for it', // broken patches are ignored
    });
    expect(l.text('str.menu.play')).toBe('Go');
    expect(l.text('str.menu.quit')).toBe('Quit');
    expect(l.format('str.invent.lives', 3)).toBe('Failsafes: 3');
    expect(l.color(pal, 'color.select.menu')).toBe(match(pal, [0, 63, 0]));
    expect(l.seconds('timing.highScores')).toBe(65535);
    expect(l.fkeyOn(5)).toBe(false);
  });

  it('fills formats as sprintf does', () => {
    expect(sprintf('%10ld|%-4d|%02ld|%s', [42, 7, 5, 'x'])).toBe('        42|7   |05|x');
  });
});
