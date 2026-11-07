// Curated tags win over the rules' guesses; an uncurated row or an unknown game is a suggestion.
import { describe, expect, it } from 'vitest';
import { tagInfo } from './knownGame';

describe('tagInfo', () => {
  const suggest = () => ['platformer', 'shooter'];
  it('uses a curated row as Tags, with its facts', () => {
    expect(tagInfo({ t: ['top-down', 'maze'], l: 13, c: true, b: true }, suggest)).toEqual({ tags: ['top-down', 'maze'], known: true, levels: 13, bot: true });
  });
  it('treats an uncurated row as suggestions, without running the rules again', () => {
    expect(tagInfo({ t: ['maze'], l: 2 }, () => ['never'])).toEqual({ tags: ['maze'], known: false });
  });
  it('runs the rules for an unknown game', () => {
    expect(tagInfo(undefined, suggest)).toEqual({ tags: ['platformer', 'shooter'], known: false });
  });
});
