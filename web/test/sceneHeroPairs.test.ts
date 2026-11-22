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

it('keeps an unresolved block slot alongside art found on another path', () => {
  const game = newGame();
  game.scenes.push(emptyScene(ADVTYPE), emptyScene(ADVTYPE));
  game.scenes[0].links[0].toScene = 2;
  game.scenes[2].files[5] = 'Hero.CHR';
  game.scenes[2].links[0].toScene = 3;
  game.scenes[3].files[6] = 'Later.CBL';
  expect(sceneHeroPairs(game).get('hero.chr')).toEqual(new Set(['', 'later.cbl']));
});

it.each([
  ['Plume', buildPlumeBlocks, buildPlume, ['windup', 'kick', 'windup', 'stand', 'kick', 'kick']],
  ['Rory', buildRoryBlocks, buildRory, ['stand', 'toss', 'toss', 'stand']],
] as const)('%s uses the face-on frames at rest and on Enter', (_, blocks, hero, enter) => {
  const book = blocks(basePal(buildPalette()));
  const ch = hero(book);
  const pose = (top: string, bottom: string) => [book.n(top), book.n(bottom)];
  const poses = {
    stand: pose('front.top', 'fstand'),
    blink: pose('fblink.top', 'fstand'),
  };
  const pictures = (seq: number) => {
    const s = ch.sequences[seq];
    return s.frames
      .slice(0, frameCount(s))
      .filter((f) => f.pic2 !== MONBL)
      .map((f) => [f.pic1, f.pic2]);
  };
  const { stand, blink } = poses;
  expect(pictures(SEQ.idle)).toEqual([stand, blink, stand, stand, stand, blink, stand]);
  const enterPose = (name: (typeof enter)[number]) => {
    switch (name) {
      case 'windup':
        return pose('fkick0.top', 'fthrow0');
      case 'kick':
        return pose('fkick1.top', 'fthrow1');
      case 'toss':
        return pose('fcheer.top', 'fthrow1');
      case 'stand':
        return stand;
    }
  };
  expect(pictures(SEQ.throw)).toEqual(enter.map(enterPose));
});
