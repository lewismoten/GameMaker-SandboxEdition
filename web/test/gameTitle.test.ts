import { describe, expect, it } from 'vitest';
import { splitTitle } from '../src/project/gameTitle';

describe('splitTitle', () => {
  it('splits at a colon or after an exclamation mark', () => {
    expect(splitTitle('Snowbound: The $89 Shovel')).toEqual(['Snowbound', 'The $89 Shovel']);
    expect(splitTitle('KEEP IT BRIEF! The Tiny Pockets Library')).toEqual(['KEEP IT BRIEF!', 'The Tiny Pockets Library']);
    expect(splitTitle('In The Year 2000!')).toEqual(['In The Year 2000!', '']);
    expect(splitTitle('Virus Blaster')).toEqual(['Virus Blaster', '']);
  });
});
