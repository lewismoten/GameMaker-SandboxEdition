// Monster births select scene resources before fallbacks and use monster IDs, not picture IDs.
import { describe, expect, it } from 'vitest';
import { emptyScene, ADVTYPE, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { GameFiles } from '../src/project/files';
import { monsterBirthPictures, monsterBirthSources } from '../src/editor/widgets/monsterBirthSource';

describe('monster birth previews', () => {
  it('uses the scene MON and MBL pair before matching-name resources', () => {
    const game = newGame('Births'),
      scene = emptyScene(ADVTYPE);
    scene.desc = 'Garden';
    scene.files[2] = 'garden.bbl';
    scene.files[3] = 'right.mon';
    scene.files[4] = 'right.mbl';
    game.scenes.push(scene);
    const files = new GameFiles([
      ['garden.mon', new Uint8Array()],
      ['garden.mbl', new Uint8Array()],
      ['right.mon', new Uint8Array()],
      ['right.mbl', new Uint8Array()],
    ]);
    expect(monsterBirthSources({ files, game: () => game }, 'GARDEN.BBL').map(({ mon, mbl }) => [mon, mbl])).toEqual([['right.mon', 'right.mbl']]);
    scene.files[3] = 'missing.mon';
    expect(monsterBirthSources({ files, game: () => game }, 'garden.bbl')).toEqual([]);
  });
  it('follows every scene using a character and deduplicates shared monster sets', () => {
    const game = newGame(),
      files = new GameFiles([
        ['first.mon', new Uint8Array()],
        ['first.mbl', new Uint8Array()],
        ['second.mon', new Uint8Array()],
        ['second.mbl', new Uint8Array()],
      ]);
    for (const [chr, mon] of [
      ['hero.chr', 'first'],
      ['hero.chr', 'second'],
      ['hero.chr', 'first'],
      ['other.chr', 'first'],
    ]) {
      const scene = emptyScene(ADVTYPE);
      scene.files[5] = chr;
      scene.files[3] = `${mon}.mon`;
      scene.files[4] = `${mon}.mbl`;
      game.scenes.push(scene);
    }
    expect(monsterBirthSources({ files, game: () => game }, 'HERO.CHR', 5).map((item) => item.id)).toEqual(['first.mon|first.mbl', 'second.mon|second.mbl']);
    game.scenes[2].files[3] = 'missing.mon';
    expect(monsterBirthSources({ files, game: () => game }, 'hero.chr', 5)).toHaveLength(2);
  });
  it('uses a paired unbound set, but declines ambiguous unrelated pictures', () => {
    const files = new GameFiles([
      ['hero.mon', new Uint8Array()],
      ['other.mbl', new Uint8Array()],
      ['third.mbl', new Uint8Array()],
    ]);
    expect(monsterBirthSources({ files, game: () => newGame() }, 'new.bbl')).toEqual([]);
    files.set('hero.mbl', new Uint8Array());
    expect(monsterBirthSources({ files, game: () => newGame() }, 'new.bbl')[0].mbl).toBe('hero.mbl');
  });
  it('maps monster numbers to their first frame without altering their block pictures', () => {
    const monsters = newMonsterSet(),
      blocks = newBlockSet('mbl');
    monsters[3].used = 1;
    monsters[3].pic[0] = [7, 4];
    blocks[7].pixels.fill(9);
    const mbl = serializeBlocks(blocks);
    const files = new GameFiles([
      ['a.mon', serializeMonsters(monsters)],
      ['a.mbl', mbl],
    ]);
    const result = monsterBirthPictures(files, { id: 'a', label: 'A', mon: 'a.mon', mbl: 'a.mbl' })!;
    expect(result.used[3]).toBe(true);
    expect(result.used[0]).toBe(false);
    expect(result.pictures[3].pixels[0]).toBe(9);
    expect(files.get('a.mbl')).toBe(mbl);
  });
});
