// "What uses this?": block uses in maps, chains, monsters and heroes; colors in blocks.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { Project } from './project';
import { blockUses, colorUses, listRuns, sceneUses } from './uses';
import { newGame, emptyScene, serializeGame, ADVTYPE } from '../../formats/game';
import { newBlockSet, serializeBlocks } from '../../formats/blocks';
import { newMap, serializeMap } from '../../formats/map';
import { newMonsterSet, serializeMonsters } from '../../formats/monster';
import { defaultPalette, serializePalette } from '../../formats/palette';

function project(): Project {
  const game = newGame('Test');
  const lvl = emptyScene(ADVTYPE);
  lvl.desc = 'Meadow';
  lvl.files[0] = 'day.pal';
  lvl.files[1] = 'one.map';
  lvl.files[2] = 'land.bbl';
  lvl.files[3] = 'foes.mon';
  lvl.files[4] = 'foes.mbl';
  game.scenes.push(lvl);
  const bbl = newBlockSet('bbl');
  bbl[3].pixels.fill(77);
  bbl[4].pixels[0] = 77;
  bbl[9].nextBl = 3;
  const map = newMap();
  map.blocks.fill(0);
  map.blocks.fill(3, 0, 42);
  const mons = newMonsterSet();
  mons[5].used = 1;
  mons[5].pic[0] = [7, 3];
  mons[5].pic[1] = [100, 0];
  mons[5].pic[2] = [8, 3]; // after the end marker: not shown
  const files = new GameFiles([
    ['test.gam', serializeGame(game)],
    ['day.pal', serializePalette(defaultPalette())],
    ['one.map', serializeMap(map)],
    ['land.bbl', serializeBlocks(bbl)],
    ['foes.mon', serializeMonsters(mons)],
    ['foes.mbl', serializeBlocks(newBlockSet('mbl'))],
  ]);
  return new Project('t', 'Test', 'test.gam', files);
}

describe('uses', () => {
  it('names the scene slots that use a file', () => {
    expect(sceneUses(project(), 'one.map').map((u) => u.text)).toEqual(['Meadow · map']);
  });

  it('finds a background block on maps and in chains', () => {
    const u = blockUses(project(), 'land.bbl', 3);
    expect(u[0]).toMatchObject({ file: 'one.map', count: 42 });
    expect(u[1].text).toBe('Block 9 changes into it');
  });

  it('finds monster blocks up to the end of the animation', () => {
    const p = project();
    expect(blockUses(p, 'foes.mbl', 7)[0].text).toBe('foes.mon: monster 5');
    expect(blockUses(p, 'foes.mbl', 8)).toEqual([]);
  });

  it('lists the blocks that paint with a color', () => {
    expect(colorUses(project(), 'day.pal', 77).map((u) => u.text)).toEqual(['land.bbl: blocks 3–4']);
    expect(listRuns([1, 2, 3, 7, 9, 10])).toBe('1–3, 7, 9–10');
  });
});
