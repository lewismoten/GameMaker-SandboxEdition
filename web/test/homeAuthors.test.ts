// The Gameware and Shareware tabs' groups by maker (src/editor/shell/homeAuthors.ts).
import { describe, expect, it } from 'vitest';
import { byMaker } from '../src/editor/shell/homeAuthors';
import type { HomeGame } from '../src/editor/shell/homeCards';

const game = (id: string, company?: string, author?: string, gam: string | null = `${id}.gam`) =>
  ({ key: `cd:${id}`, entry: { id, company, author, gam } }) as unknown as HomeGame;

describe('byMaker', () => {
  it('puts RSD first, then the makers with most games, ties by name, each in the order given', () => {
    const groups = byMaker([
      game('bcuda', 'GameLynk'),
      game('donut', 'A-J Games'),
      game('sample', 'Recreational Software Designs', 'Joan Stone'),
      game('outerlim', 'KD Software', 'Sheldon Chase'),
      game('glub', 'A-J Games'),
      game('orb', undefined, 'Josh Turcotte'),
      game('library', undefined, undefined, null),
      game('warrior', 'KD Software', 'Sheldon Chase'),
    ]);
    expect(groups.map((g) => [g.name, g.games.map((x) => x.entry!.id)])).toEqual([
      ['Recreational Software Designs', ['sample', 'library']],
      ['A-J Games', ['donut', 'glub']],
      ['KD Software', ['outerlim', 'warrior']],
      ['GameLynk', ['bcuda']],
      ['Josh Turcotte', ['orb']],
    ]);
  });
});
