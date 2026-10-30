// CBL previews use their scene's characters, retain shot resources, and never invent a grid pose.
import { describe, expect, it } from 'vitest';
import { newGame, emptyScene, ADVTYPE, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { charactersForBlocks, characterBlockPicture } from '../src/editor/widgets/characterSets';

function source() {
  const game = newGame(),
    scene = emptyScene(ADVTYPE),
    blocks = newBlockSet('cbl');
  scene.files[5] = 'hero.chr';
  scene.files[6] = 'costume.cbl';
  scene.files[3] = 'shots.mon';
  scene.files[4] = 'shots.mbl';
  game.scenes.push(scene, scene);
  blocks[0].pixels.fill(7);
  blocks[1].pixels.fill(8);
  const bytes = serializeBlocks(blocks),
    files = new GameFiles([
      ['costume.cbl', bytes],
      ['other.cbl', bytes],
      ['test.gam', serializeGame(game)],
      ['hero.chr', serializeCharacter(newCharacter())],
      ['extra.chr', serializeCharacter(newCharacter())],
    ]);
  return { files, bytes };
}
describe('character block poses', () => {
  it('uses linked characters once and keeps their monster file pairing', () => {
    const { files, bytes } = source();
    expect(charactersForBlocks(files, 'COSTUME.CBL').map(({ file, monsters, monsterBlocks }) => [file, monsters, monsterBlocks])).toEqual([
      ['hero.chr', 'shots.mon', 'shots.mbl'],
    ]);
    const picture = characterBlockPicture(files, 'costume.cbl', bytes);
    expect([picture.width, picture.height]).toEqual([20, 40]);
    expect(picture.pixels[0]).toBe(7);
    expect(picture.pixels[400]).toBe(8);
  });
  it('shows only one native picture when there is no linked character', () => {
    const { files, bytes } = source();
    const picture = characterBlockPicture(files, 'other.cbl', bytes);
    expect([picture.width, picture.height]).toEqual([20, 20]);
    expect(picture.pixels.every((pixel) => pixel === 7)).toBe(true);
    expect(charactersForBlocks(files, 'other.cbl')).toEqual([]);
  });
  it('uses a same-name unbound character but never substitutes for a missing scene character', () => {
    const { files, bytes } = source();
    expect(charactersForBlocks(files, 'other.cbl').map((item) => item.file)).toEqual([]);
    files.delete('test.gam');
    files.set('other.chr', files.get('extra.chr')!);
    expect(charactersForBlocks(files, 'other.cbl').map((item) => item.file)).toEqual(['other.chr']);
    const game = newGame(),
      scene = emptyScene(ADVTYPE);
    scene.files[5] = 'missing.chr';
    scene.files[6] = 'other.cbl';
    game.scenes.push(scene);
    files.set('test.gam', serializeGame(game));
    expect(charactersForBlocks(files, 'other.cbl')).toEqual([]);
    expect(characterBlockPicture(files, 'other.cbl', bytes).height).toBe(20);
  });
});
