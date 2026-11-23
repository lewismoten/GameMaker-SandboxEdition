// "What uses this?": block uses in maps, chains, monsters and heroes; colors in blocks.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { emptyCompanion } from '../../project/companion';
import { normalizeScene, sceneFiles } from '../editors/animation/scene/sceneModel';
import { Project } from './project';
import { blockUses, colorUses, embeddedFiles, fileUses, listRuns, sceneUses } from './uses';
import { newGame, emptyScene, serializeGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { defaultPalette, serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

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
    ['intro.fli', new Uint8Array()],
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

it('reads saved scene sources in order without reading actor paths', () => {
  const p = project();
  p.companion = emptyCompanion();
  const actor = { kind: 'actor', source: { chr: 'hero.chr', cbl: 'hero.cbl' }, path: [{ f: 9 }, { f: 2 }] };
  const tracks = [
    {
      items: [actor, { kind: 'text' }, { kind: 'actor', source: { type: 'mon', mon: 'foes.mon', mbl: 'foes.mbl' } }, { kind: 'block', bbl: 'land.bbl' }, actor],
    },
  ];
  const background = { kind: 'picture', file: 'sky.gif', start: 8 };
  for (const scene of [
    { background, tracks },
    { backgrounds: [background, { kind: 'map', start: 2, map: 'one.map' }, { kind: 'color', start: 0 }, { ...background, file: 'hidden.gif' }], tracks },
  ]) {
    const expected = sceneFiles(normalizeScene(scene), p);
    p.companion.files['intro.fli'] = { scene };
    const path = actor.path;
    Object.defineProperty(actor, 'path', {
      configurable: true,
      get() {
        throw new Error('lookup read actor.path');
      },
    });
    expect(embeddedFiles(p, 'intro.fli')).toEqual(expected);
    expect(fileUses(p, 'hero.chr')).toEqual([{ file: 'intro.fli', text: 'intro.fli Scene Maker source', count: 2 }]);
    Object.defineProperty(actor, 'path', { value: path, configurable: true });
  }
});

it('extracts saved filenames faster than normalizing a motion-heavy scene', () => {
  const p = project();
  const path = Array.from({ length: 200 }, (_, i) => ({ f: (i * 37) % 200, x: i, y: 0 }));
  const items = Array.from({ length: 100 }, () => ({ kind: 'actor', source: { chr: 'hero.chr', cbl: 'hero.cbl' }, path }));
  const scene = { tracks: [{ items }] };
  p.companion = emptyCompanion();
  p.companion.files['intro.fli'] = { scene };
  function medianTime(read: () => string[]): number {
    read();
    const samples = Array.from({ length: 7 }, () => {
      const start = performance.now();
      for (let i = 0; i < 3; i++) read();
      return performance.now() - start;
    });
    return samples.sort((a, b) => a - b)[3];
  }
  const baseline = medianTime(() => sceneFiles(normalizeScene(scene), p));
  expect(medianTime(() => embeddedFiles(p, 'intro.fli'))).toBeLessThan(baseline / 2);
});
