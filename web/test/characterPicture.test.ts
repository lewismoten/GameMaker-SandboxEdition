// Character previews resolve scene bindings, handle bottom-only heroes and orient each half correctly.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { CHARBL, MONBL, newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { characterPicture } from '../src/editor/widgets/characterPicture';

function source() {
  const character = newCharacter();
  const right = newBlockSet('cbl');
  right[0].pixels.fill(2);
  right[1].pixels.fill(255);
  right[1].pixels[0] = 3;
  const wrong = newBlockSet('cbl');
  wrong[0].pixels.fill(9);
  wrong[1].pixels.fill(9);
  const game = newGame('Preview');
  const scene = emptyScene(ADVTYPE);
  scene.files[5] = 'hero.chr';
  scene.files[6] = 'right.cbl';
  game.scenes.push(scene);
  const files = new GameFiles([
    ['wrong.cbl', serializeBlocks(wrong)],
    ['hero.cbl', serializeBlocks(wrong)],
    ['right.cbl', serializeBlocks(right)],
    ['test.gam', serializeGame(game)],
    ['hero.chr', serializeCharacter(character)],
  ]);
  return { files, character };
}

describe('character pictures', () => {
  it('uses the scene CBL before an arbitrary or matching-name CBL, and transforms both halves', () => {
    const { files, character } = source();
    const blocks = parseBlocks(files.get('right.cbl')!, CHARBL);
    blocks[0].pixels[3 * 20 + 2] = 4;
    blocks[1].pixels[4 * 20 + 3] = 5;
    files.set('right.cbl', serializeBlocks(blocks));
    character.sequences[0].frames[0].orient = 0x41;
    files.set('hero.chr', serializeCharacter(character));
    const picture = characterPicture(files, 'hero.chr')!;
    expect([picture.width, picture.height]).toEqual([20, 40]);
    expect(picture.pixels[0]).toBe(2);
    expect(picture.pixels[400]).toBe(255);
    expect(picture.pixels[419]).toBe(3);
    expect(picture.pixels[2 * 20 + 16]).toBe(4);
    expect(picture.pixels[400 + 4 * 20 + 16]).toBe(5);
    expect(picture.pixels.includes(9)).toBe(false);
  });

  it('shows a bottom-only character, skipping birth commands rather than drawing a monster index', () => {
    const { files, character } = source();
    character.sequences[0].frames[0].pic2 = MONBL;
    character.sequences[0].frames[1] = { ...character.sequences[0].frames[0], pic1: CHARBL, pic2: 1, orient: 0 };
    files.set('hero.chr', serializeCharacter(character));
    const picture = characterPicture(files, 'hero.chr')!;
    expect(picture.height).toBe(20);
    expect(picture.pixels[0]).toBe(3);
  });

  it('falls back to movement when idle has no picture, rather than choosing a death pose', () => {
    const { files, character } = source();
    character.sequences[0].frames[0].pic2 = CHARBL + 1;
    character.sequences[1].frames[0] = { ...character.sequences[0].frames[0], pic1: 1, pic2: CHARBL };
    character.sequences[5].frames[0] = { ...character.sequences[0].frames[0], pic1: 0, pic2: 1 };
    const picture = characterPicture(files, 'hero.chr', serializeCharacter(character))!;
    expect(picture.height).toBe(40);
    expect(picture.pixels[0]).toBe(2);
  });

  it('can preview an unsaved character buffer without replacing the stored file', () => {
    const { files, character } = source();
    const before = files.get('hero.chr')!.slice();
    character.sequences[0].frames[0].pic1 = CHARBL;
    expect(characterPicture(files, 'hero.chr', serializeCharacter(character))!.height).toBe(20);
    expect(files.get('hero.chr')).toEqual(before);
  });

  it('uses a paired CBL without a game file, and refuses to guess between unrelated sets', () => {
    const { files, character } = source();
    const paired = new GameFiles([
      ['hero.chr', serializeCharacter(character)],
      ['hero.cbl', files.get('right.cbl')!],
      ['other.cbl', files.get('wrong.cbl')!],
    ]);
    expect(characterPicture(paired, 'hero.chr')!.pixels[0]).toBe(2);
    const unpaired = new GameFiles([
      ['unknown.chr', files.get('hero.chr')!],
      ['a.cbl', files.get('right.cbl')!],
      ['b.cbl', files.get('wrong.cbl')!],
    ]);
    expect(characterPicture(unpaired, 'unknown.chr')).toBeUndefined();
  });
});
