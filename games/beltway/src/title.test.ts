// The finished title must preserve every opaque pixel of all four cars.
import { expect, it } from 'vitest';
import { orientIndex } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildStarterPalette } from '../../kit/starter/palette';
import { monsterPictures } from './monsters';
import { TITLE } from './game';
import { titlePicture } from './title';
import { CAR_AT, LOOP } from './view';

it('keeps the four turned car silhouettes intact on the title', () => {
  const pal = buildStarterPalette(undefined, 'beltway');
  const monsters = monsterPictures(pal);
  const hero = heroPicture(buildHeroBlocks(pal), 'cheer.top', 'jump');
  const title = titlePicture(pal, monsters, hero, TITLE, 'A STARTER GAME');
  const car = monsters.pics.get('car0')!;
  for (const [dx, dy, orientation] of [[0, 0, 0], LOOP[1], LOOP[3], LOOP[5]]) {
    const damaged = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const color = car.px[orientIndex(orientation, x, y)];
        const tx = (CAR_AT[0] + dx) * 20 + x;
        const ty = (CAR_AT[1] + dy) * 20 + y;
        if (color !== 255 && title.px[ty * title.w + tx] !== color) damaged.push([tx, ty]);
      }
    }
    expect(damaged, `car at offset ${dx},${dy}`).toHaveLength(0);
  }
});
