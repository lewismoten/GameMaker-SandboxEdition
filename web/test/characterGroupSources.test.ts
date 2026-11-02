// Character frame grouping follows scene bindings and deduplicates pairs across character files.
import { describe, expect, it } from 'vitest';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Project } from '../src/editor/core/project';
import { GameFiles } from '../src/project/files';
import { suggestionsFor } from '../src/editor/editors/blocks/blockClips';

describe('character group sources', () => {
  it('finds each linked native pair once without grouping commands or unrelated characters', () => {
    const first = newCharacter(),
      second = newCharacter(),
      other = newCharacter(),
      game = newGame();
    second.sequences[5].frames[0] = { ...first.sequences[0].frames[0], pic1: 2, pic2: 3 };
    second.sequences[5].frames[1] = { ...first.sequences[0].frames[0], pic1: 4, pic2: 5, orient: 1 };
    second.sequences[5].frames[2] = { ...first.sequences[0].frames[0], pic1: 6, pic2: 100 };
    other.sequences[0].frames[0].pic1 = 8;
    other.sequences[0].frames[0].pic2 = 9;
    for (const [chr, cbl] of [
      ['first.chr', 'hero.cbl'],
      ['second.chr', 'hero.cbl'],
      ['second.chr', 'hero.cbl'],
      ['other.chr', 'other.cbl'],
    ]) {
      const scene = emptyScene(ADVTYPE);
      scene.files[5] = chr;
      scene.files[6] = cbl;
      game.scenes.push(scene);
    }
    const files = new GameFiles([
      ['test.gam', serializeGame(game)],
      ['first.chr', serializeCharacter(first)],
      ['second.chr', serializeCharacter(second)],
      ['other.chr', serializeCharacter(other)],
    ]);
    const contents = () => [...files.entries()].map(([file, bytes]) => [file, Buffer.from(bytes).toString('hex')]);
    const original = contents();
    const project = new Project('groups', 'Groups', 'test.gam', files);
    expect(suggestionsFor(project, 'HERO.CBL', 'cbl', 50).map((suggestion) => suggestion.group)).toEqual([
      { name: 'Idle 1', cols: 1, rows: 2, cells: [0, 1] },
      { name: 'Sequence 5 1', cols: 1, rows: 2, cells: [2, 3] },
    ]);
    expect(contents()).toEqual(original);
    expect(project.companion).toBeUndefined();
  });
});
