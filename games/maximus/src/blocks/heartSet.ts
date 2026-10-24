// HEART.BBL: the station blocks with two training-deck info panels (never seen in the Heart)
// traded for the seal down the Guardian's middle. STATION.BBL is full to its 150 blocks.
import { SOLID, type SetBuilder, tex } from './blockset';
import { stationSet } from './station';
import { panel } from './stationArt';
import { R } from './common';
import { WHITE } from '../art/palette';
import { SEAL_COUNTER } from '../ids';

export function heartSet(): SetBuilder {
  const s = stationSet();
  // a wall of the Core's light: a touch opens one block of it once the Core Light has
  // charged it (SEAL_COUNTER above 1), and it stays shut until then
  s.swap(
    'info:walk',
    'seal',
    tex((x, y) => {
      const g = R('glow');
      if (x < 2 || x > 17) return R('tech')[1];
      if ((x + y * 2) % 7 === 0) return WHITE;
      return (x * 5 + y * 3) % 4 === 0 ? g[6] : g[3 + ((x + y) & 1)];
    }),
    { solid: SOLID, effect: SEAL_COUNTER, eamt: -1, touch: 'seal:open' },
  );
  s.swap(
    'info:hop',
    'seal:open',
    panel(87).map((x, y, c) => (x < 2 || x > 17 ? R('tech')[1] : (x + y) % 9 === 0 ? R('glow')[2] : c)),
  );
  return s;
}
