// Empty games start with the actual CD Library palette; existing imported files stay untouched.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/achievements', () => ({ unlockAchievement: vi.fn(), editedFile: vi.fn() }));
import { Project } from '../src/editor/core/project';
import { libraryDefaultPalette } from '@lewismoten/gamemaker-sandbox-tools/palettes';
import { GameFiles } from '../src/project/files';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

const original = new Uint8Array(readFileSync(new URL('../../cd/gameware/library/default.pal', import.meta.url)));

describe('new game palette', () => {
  it('includes the exact Library DEFAULT.PAL and gives each project its own copy', () => {
    const a = Project.create('Empty A');
    const b = Project.create('Empty B');
    expect(a.files.get('default.pal')).toEqual(original);
    expect(libraryDefaultPalette()).toEqual(original);
    a.files.get('default.pal')![0] = 63;
    expect(b.files.get('default.pal')).toEqual(original);
    expect(libraryDefaultPalette()[0]).toBe(0);
  });

  it('does not add or overwrite palette files when importing an existing game', () => {
    const files = new GameFiles([
      ['old.gam', serializeGame(newGame('Imported'))],
      ['custom.pal', new Uint8Array(768).fill(4)],
    ]);
    const project = Project.fromFiles(files);
    expect(project.files.has('default.pal')).toBe(false);
    expect(project.files.get('custom.pal')).toEqual(new Uint8Array(768).fill(4));
  });
});
