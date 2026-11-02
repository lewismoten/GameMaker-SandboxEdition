// A painter frame keeps native indices/orientations and never mistakes a birth command for pixels.
import { describe, expect, it } from 'vitest';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newGame, emptyScene, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from '../src/project/files';
import { characterAnimations, characterFrameView } from '../src/editor/editors/blocks/characterFrameModel';

function fixture() {
  const game = newGame(),
    chr = newCharacter();
  chr.sequences[5].frames[0] = { ...chr.sequences[0].frames[0], pic1: 2, pic2: 3, orient: 0x41 };
  chr.sequences[5].frames[1] = { ...chr.sequences[0].frames[0], pic1: 4, pic2: 100 };
  chr.sequences[5].frames[2] = { ...chr.sequences[0].frames[0], pic1: 50, pic2: 5, orient: 0x70 };
  const scene = emptyScene(ADVTYPE);
  scene.files[5] = 'hero.chr';
  scene.files[6] = 'hero.cbl';
  game.scenes.push(scene, scene);
  const files = new GameFiles([
    ['hero.chr', serializeCharacter(chr)],
    ['hero.cbl', new Uint8Array()],
    ['other.chr', serializeCharacter(newCharacter())],
    ['other.cbl', new Uint8Array()],
  ]);
  return { game: () => game, files };
}

describe('character painter frames', () => {
  it('follows scene bindings and preserves the native indices around birth commands', () => {
    const project = fixture(),
      bytes = project.files.get('hero.chr')!;
    const animations = characterAnimations(project, 'HERO.CBL');
    expect(animations.map((animation) => [animation.file, animation.sequence])).toEqual([
      ['hero.chr', 0],
      ['hero.chr', 5],
    ]);
    const sequence = animations[1];
    expect(sequence.frames.map((frame) => frame.index)).toEqual([0, 2]);
    expect(sequence.frames.map((frame) => frame.tick)).toEqual([0, 2]);
    expect(sequence.blocks).toEqual([2, 3, 5]);
    expect(sequence.clip.tracks[1].steps.map((step) => step.block)).toEqual([3, 5]);
    const pair = characterFrameView(sequence, 0, 2, 0);
    expect(pair.group.cells).toEqual([2, 3]);
    expect(pair.orientations).toEqual([1, 4]);
    expect(characterFrameView(sequence, 0, 2, 1).key).toBe(pair.key);
    expect(characterFrameView(sequence, 0, 1, 1).group.cells).toEqual([3]);
    expect(characterFrameView(sequence, 0, 1, 1).orientations).toEqual([4]);
    const shoes = characterFrameView(sequence, 1, 2, 0);
    expect(shoes.current).toBe(5);
    expect(shoes.group.cells).toEqual([-1, 5]);
    expect(shoes.orientations).toEqual([0, 7]);
    expect(characterFrameView(sequence, 1, 1, 0).group.cells).toEqual([5]);
    expect(() => characterFrameView(sequence, 2, 1, 0)).toThrow(RangeError);
    expect(project.files.get('hero.chr')).toBe(bytes);
  });
  it('uses an unbound same-name character, but never an unrelated bound character', () => {
    const project = fixture();
    project.game().scenes = [];
    expect(characterAnimations(project, 'hero.cbl').every((animation) => animation.file === 'hero.chr')).toBe(true);
    const scene = emptyScene(ADVTYPE);
    scene.files[6] = 'hero.cbl';
    scene.files[5] = 'missing.chr';
    project.game().scenes.push(scene);
    expect(characterAnimations(project, 'hero.cbl')).toEqual([]);
  });
});
