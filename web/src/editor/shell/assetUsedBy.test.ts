import { Project } from '../core/project';
import { GameFiles } from '../../project/files';
import { fileUses } from '../core/uses';
import { assetGames } from './gameProject';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { describe, expect, it } from 'vitest';
import { categoryScenesUsing, scenesUsing, usedByShort, usedByText } from './assetUsedBy';

describe('Overview used-by line', () => {
  const uses: Record<string, { scene: number }[]> = {
    'a.bbl': [{ scene: 0 }, { scene: 1 }],
    'b.bbl': [{ scene: 1 }, { scene: 2 }, { scene: 2 }],
    'c.bbl': [],
  };
  const usesOf = (f: string) => uses[f] ?? [];
  it('counts each scene once across a category', () => {
    expect(scenesUsing(['a.bbl', 'b.bbl', 'c.bbl'], usesOf)).toBe(3);
    expect(scenesUsing(['c.bbl'], usesOf)).toBe(0);
    expect(scenesUsing([], usesOf)).toBe(0);
  });
  it('words it, and stays silent for none', () => {
    expect(usedByText(1)).toBe('used by 1 scene');
    expect(usedByText(3)).toBe('used by 3 scenes');
    expect(usedByText(0)).toBe('');
    expect(usedByShort(1)).toBe('1 scene');
    expect(usedByShort(12)).toBe('12 scenes');
    expect(usedByShort(0)).toBe('');
  });
});

it('counts shared picture scenes separately in each GAM and links their actual owners', () => {
  const main = newGame('Main');
  const second = newGame('Second');
  main.scenes[0].files[0] = 'shared.gif';
  second.scenes[0].files[0] = 'SHARED.GIF';
  second.scenes[0].files[2] = 'shared.gif';
  second.scenes[1].files[0] = 'other.gif';
  const files = new GameFiles([
    ['main.gam', serializeGame(main)],
    ['second.gam', serializeGame(second)],
    ['shared.gif', new Uint8Array()],
    ['other.gif', new Uint8Array()],
  ]);
  const project = new Project('test', 'Two games', 'main.gam', files);
  const games = assetGames(project);
  expect(categoryScenesUsing(['other.gif'], games)).toBe(1);
  expect(categoryScenesUsing(['shared.gif', 'other.gif'], games)).toBe(3);
  expect(fileUses(project, 'shared.gif').map(({ file, scene }) => [file, scene])).toEqual([
    ['main.gam', 0],
    ['second.gam', 0],
    ['second.gam', 0],
  ]);
});
