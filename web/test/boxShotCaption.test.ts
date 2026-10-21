import { describe, expect, it } from 'vitest';
import { shotCaption } from '../src/desk/boxes/gameBox';
import type { Game } from '../src/formats/game';

const game = (scenes: [string, string[]][]) => ({ scenes: scenes.map(([desc, files]) => ({ desc, files })) }) as unknown as Game;

describe('box screenshot captions', () => {
  it('names the level the map belongs to', () => {
    expect(shotCaption(game([['Gale Street', ['gale.map', 'snow.bkd']]]), 'GALE.MAP')).toBe('Gale Street');
  });
  it('turns stage codes into stage numbers', () => {
    expect(shotCaption(game([['1a The Data Bus', ['s1a.map']]]), 's1a.map')).toBe('Stage 1: The Data Bus');
  });
  it('is blank for a map no scene uses', () => {
    expect(shotCaption(game([['Gale Street', ['gale.map']]]), 'other.map')).toBe('');
    expect(shotCaption(undefined, 'gale.map')).toBe('');
  });
});
