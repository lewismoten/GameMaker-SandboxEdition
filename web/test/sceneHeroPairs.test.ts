// Scene slots can inherit different art at a shared destination.
import { expect, it } from 'vitest';
import { ADVTYPE, emptyScene, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { sceneHeroPairs } from '../../games/kit/sceneHeroPairs';
import { buildPlumeBlocks } from '../../games/pass-the-pie/src/plume';
import { buildRoryBlocks } from '../../games/pass-the-pie/src/rory';
import { basePal, buildPalette } from '../../games/pass-the-pie/src/palette';
import { buildPlume, buildRory } from '../../games/pass-the-pie/src/plumeChar';
import { SEQ } from '../../games/kit/starter/ids';
import { frameCount } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

it('follows both incoming links when a hero inherits differently named block sets', () => {
  const game = newGame();
  game.scenes.push(emptyScene(ADVTYPE), emptyScene(ADVTYPE), emptyScene(ADVTYPE));
  for (const [i, target] of [2, 3].entries()) {
    game.scenes[0].links[i].toScene = target;
    game.scenes[target].files[6] = `art${i}.cbl`;
    game.scenes[target].links[0].toScene = 4;
  }
  game.scenes[4].files[5] = 'hero.chr';
  expect(sceneHeroPairs(game).get('hero.chr')).toEqual(new Set(['art0.cbl', 'art1.cbl']));
});

it.each([
  ['Plume', buildPlumeBlocks, buildPlume],
  ['Rory', buildRoryBlocks, buildRory],
] as const)('%s faces forward at rest and throughout the Enter move', (_, blocks, hero) => {
  const book = blocks(basePal(buildPalette()));
  const ch = hero(book);
  for (const seq of [SEQ.idle, SEQ.throw]) {
    const s = ch.sequences[seq];
    const poses = s.frames.slice(0, frameCount(s)).filter((f) => f.pic2 !== MONBL);
    expect(poses.length).toBeGreaterThan(0);
    for (const f of poses) {
      expect([...book.index.keys()][f.pic1]).toMatch(/^f(?:ront|blink|kick[01]|cheer)\.top$/);
      expect([...book.index.keys()][f.pic2]).toMatch(/^f(?:stand|throw[01])$/);
    }
  }
});
