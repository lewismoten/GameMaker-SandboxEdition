// A shared destination must keep both incoming heroes' projectile assets.
import { expect, it } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { testGame } from '../editor/check/testGame';
import { newCards, packPocketGame } from './pocketPack';

it('packs projectile definitions and pictures from both routes into a shared scene', async () => {
  const { game, files } = testGame(['S.E']);
  const room = game.scenes[2];
  room.files[0] = 'test.pal';
  files.set('test.pal', new Uint8Array(768));
  const defs = newMonsterSet();
  for (const id of [7, 2]) {
    const branch = structuredClone(room);
    const hero = newCharacter();
    Object.assign(hero.sequences[5].frames[0], { pic1: id, pic2: 100 });
    branch.files[5] = `hero${id}.chr`;
    files.set(branch.files[5], serializeCharacter(hero));
    branch.links[0].toScene = 5;
    game.scenes.push(branch);
    defs[id].pic[0][0] = id === 7 ? 1 : 4;
  }
  room.links[0].toScene = 3;
  room.links[1] = { ...room.links[0], toScene: 4 };
  const shared = structuredClone(room);
  shared.files.splice(3, 4, 'test.mon', 'test.mbl', '', '');
  shared.links = structuredClone(game.scenes[3].links);
  shared.links[0].toScene = 1;
  game.scenes.push(shared);
  files.set('test.mon', serializeMonsters(defs));
  files.set('test.mbl', new Uint8Array(5 * 420));
  files.set('test.gam', serializeGame(game));
  const packed = await packPocketGame({ title: 'Heroes', files: new GameFiles(files) }, new Map(), newCards(), (bytes) => bytes, false);
  expect(
    packed.lines
      .filter((line) => line.startsWith('level '))[3]
      .split(' ')
      .slice(-2),
  ).toEqual(['8', '5']);
});
